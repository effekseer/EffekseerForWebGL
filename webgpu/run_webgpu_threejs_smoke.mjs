import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const args = process.argv.slice(2);
const htmlPath = args[0];
const optionArgs = args.slice(1);

if (!htmlPath) {
	console.error('Usage: node webgpu/run_webgpu_threejs_smoke.mjs <EffekseerForWebGPUThreeJsSmoke.html> [--screenshot=path] [--width=320] [--height=240]');
	process.exit(2);
}

const resolvedHtmlPath = path.resolve(htmlPath);
if (!fs.existsSync(resolvedHtmlPath)) {
	console.error(`Not found: ${resolvedHtmlPath}`);
	process.exit(2);
}

const options = parseOptions(optionArgs);
const root = path.dirname(resolvedHtmlPath);
const htmlFile = path.basename(resolvedHtmlPath);
const executablePath = findBrowserExecutable();
const server = await createServer(root, htmlFile);
const {port} = server.address();
const devtoolsPort = await getFreePort();
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'effekseer-webgpu-threejs-'));
const url = `http://127.0.0.1:${port}/${htmlFile}?${options.query.toString()}`;

let browser;

try {
	browser = spawn(executablePath, [
		`--user-data-dir=${userDataDir}`,
		`--remote-debugging-port=${devtoolsPort}`,
		'--no-first-run',
		'--no-default-browser-check',
		'--enable-unsafe-webgpu',
		'--ignore-gpu-blocklist',
		...chromeGpuArgs(),
		...(process.env.EFFEKSEER_WEBGPU_HEADLESS === '0' ? [] : ['--headless=new']),
		url,
	], {stdio: ['ignore', 'pipe', 'pipe']});

	let browserStderr = '';
	browser.stderr.on('data', (chunk) => {
		browserStderr += chunk.toString();
		process.stderr.write(chunk);
	});
	browser.stdout.on('data', (chunk) => process.stdout.write(chunk));

	await waitForDevTools(devtoolsPort, browser, () => browserStderr);
	const page = await findPage(devtoolsPort, url);
	const cdp = await connectCDP(page.webSocketDebuggerUrl);

	await cdp.send('Runtime.enable');
	await cdp.send('Page.enable');
	cdp.on('Runtime.consoleAPICalled', (params) => {
		const text = params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
		if (text) {
			console.log(`[browser:${params.type}] ${text}`);
		}
	});
	cdp.on('Runtime.exceptionThrown', (params) => {
		console.error('[browser:exception]', params.exceptionDetails?.text || 'exception');
	});

	const result = await waitForResult(cdp, browser, () => browserStderr);
	if (options.screenshot) {
		await captureScreenshot(cdp, options.screenshot);
	}

	await cdp.close();
	if (result.status !== 'passed') {
		throw new Error(result.message || 'Effekseer WebGPU Three.js smoke failed.');
	}
	console.log(`EFFEKSEER_WEBGPU_THREEJS_SMOKE_PASS ${result.message || ''}`.trim());
} finally {
	await stopBrowser(browser);
	server.close();
	fs.rmSync(userDataDir, {recursive: true, force: true, maxRetries: 10, retryDelay: 100});
}

function parseOptions(optionArgs) {
	const query = new URLSearchParams();
	let screenshot = null;
	for (const option of optionArgs) {
		if (!option.startsWith('--')) {
			continue;
		}
		const separator = option.indexOf('=');
		const key = separator > 2 ? option.substring(2, separator) : option.substring(2);
		const value = separator > 2 ? option.substring(separator + 1) : '1';
		if (key === 'screenshot') {
			screenshot = value;
		} else {
			query.set(key, value);
		}
	}
	return {query, screenshot};
}

function findBrowserExecutable() {
	const candidates = [
		process.env.CHROME_PATH,
		process.env.EDGE_PATH,
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
		'/usr/bin/google-chrome',
		'/usr/bin/google-chrome-stable',
		'/usr/bin/chromium',
		'/usr/bin/chromium-browser',
		'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
		'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
		'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
		'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
	].filter(Boolean);

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	console.error('A WebGPU-capable Chrome or Edge executable is required.');
	console.error('Set CHROME_PATH or EDGE_PATH if it is installed in a custom location.');
	process.exit(2);
}

function chromeGpuArgs() {
	if (process.platform === 'win32') {
		return ['--use-angle=d3d11'];
	}
	if (process.platform === 'darwin') {
		return ['--use-angle=metal'];
	}
	return [];
}

function contentType(filePath) {
	if (filePath.endsWith('.html')) return 'text/html';
	if (filePath.endsWith('.js')) return 'application/javascript';
	if (filePath.endsWith('.wasm')) return 'application/wasm';
	if (filePath.endsWith('.data')) return 'application/octet-stream';
	if (filePath.endsWith('.png')) return 'image/png';
	return 'application/octet-stream';
}

async function createServer(root, htmlFile) {
	const server = http.createServer((request, response) => {
		const requestUrl = new URL(request.url, 'http://127.0.0.1');
		if (requestUrl.pathname === '/favicon.ico') {
			response.writeHead(204);
			response.end();
			return;
		}

		const relativePath = decodeURIComponent(requestUrl.pathname === '/' ? `/${htmlFile}` : requestUrl.pathname);
		const filePath = path.resolve(root, `.${relativePath}`);
		const relativeFromRoot = path.relative(root, filePath);

		if (relativeFromRoot.startsWith('..') || path.isAbsolute(relativeFromRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
			response.writeHead(404);
			response.end('Not found');
			return;
		}

		response.writeHead(200, {
			'Content-Type': contentType(filePath),
			'Cache-Control': 'no-store, max-age=0',
			'Pragma': 'no-cache',
			'Expires': '0',
		});
		fs.createReadStream(filePath).pipe(response);
	});

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	return server;
}

async function getFreePort() {
	const probe = http.createServer();
	await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
	const freePort = probe.address().port;
	await new Promise((resolve) => probe.close(resolve));
	return freePort;
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDevTools(devtoolsPort, browser, getStderr) {
	const start = Date.now();
	while (Date.now() - start < 30000) {
		if (browser.exitCode !== null) {
			throw new Error(`Chrome exited before DevTools was ready.${getStderr() ? `\n${getStderr()}` : ''}`);
		}
		try {
			const response = await fetch(`http://127.0.0.1:${devtoolsPort}/json/version`);
			if (response.ok) {
				return;
			}
		} catch {
		}
		await delay(100);
	}
	throw new Error('Timed out waiting for Chrome DevTools HTTP endpoint.');
}

async function findPage(devtoolsPort, pageUrl) {
	const start = Date.now();
	while (Date.now() - start < 10000) {
		const response = await fetch(`http://127.0.0.1:${devtoolsPort}/json`);
		if (response.ok) {
			const pages = await response.json();
			const page = pages.find((entry) => entry.type === 'page' && entry.url === pageUrl) ||
				pages.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
			if (page?.webSocketDebuggerUrl) {
				return page;
			}
		}
		await delay(100);
	}
	throw new Error('Timed out finding Chrome page.');
}

async function connectCDP(webSocketDebuggerUrl) {
	const socket = new WebSocket(webSocketDebuggerUrl);
	const pending = new Map();
	const listeners = new Map();
	let id = 0;

	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data);
		if (message.id && pending.has(message.id)) {
			const {resolve, reject} = pending.get(message.id);
			pending.delete(message.id);
			if (message.error) {
				reject(new Error(message.error.message || JSON.stringify(message.error)));
			} else {
				resolve(message.result || {});
			}
			return;
		}

		const callbacks = listeners.get(message.method);
		if (callbacks) {
			for (const callback of callbacks) {
				callback(message.params || {});
			}
		}
	});

	await new Promise((resolve, reject) => {
		socket.addEventListener('open', resolve, {once: true});
		socket.addEventListener('error', reject, {once: true});
	});

	return {
		send(method, params = {}) {
			const messageId = ++id;
			socket.send(JSON.stringify({id: messageId, method, params}));
			return new Promise((resolve, reject) => {
				pending.set(messageId, {resolve, reject});
			});
		},
		on(method, callback) {
			if (!listeners.has(method)) {
				listeners.set(method, []);
			}
			listeners.get(method).push(callback);
		},
		close() {
			socket.close();
		}
	};
}

async function waitForResult(cdp, browser, getStderr) {
	const start = Date.now();
	while (Date.now() - start < 60000) {
		if (browser.exitCode !== null) {
			throw new Error(`Chrome exited before the smoke completed.${getStderr() ? `\n${getStderr()}` : ''}`);
		}

		const response = await cdp.send('Runtime.evaluate', {
			expression: 'globalThis.Module && Module.effekseerWebGPUTestResult ? Module.effekseerWebGPUTestResult : null',
			returnByValue: true,
			awaitPromise: false,
		});
		const result = response.result?.value;
		if (result?.status) {
			return result;
		}

		await delay(250);
	}
	throw new Error('Timed out waiting for Effekseer WebGPU Three.js smoke result.');
}

async function captureScreenshot(cdp, screenshotPath) {
	const response = await cdp.send('Page.captureScreenshot', {format: 'png', fromSurface: true});
	if (!response.data) {
		throw new Error('Chrome did not return screenshot data.');
	}
	fs.mkdirSync(path.dirname(path.resolve(screenshotPath)), {recursive: true});
	fs.writeFileSync(screenshotPath, Buffer.from(response.data, 'base64'));
	console.log(`Wrote screenshot: ${screenshotPath}`);
}

async function stopBrowser(browser) {
	if (!browser || browser.exitCode !== null) {
		return;
	}

	browser.kill();
	await Promise.race([
		new Promise((resolve) => browser.once('exit', resolve)),
		delay(3000),
	]);
}
