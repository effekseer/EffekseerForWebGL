
import { defineConfig } from 'rollup';
import replace from '@rollup/plugin-replace';

export default defineConfig({
    input: 'src/js/main.mjs',
    plugins: [
        replace({
            preventAssignment: true,
            delimiters: ['', ''],
            values: {
                'this.Module = this.Module || {}': 'Module'
            }
        })
    ],
    output: {
        file: 'build_wasm/effekseer_webgl.js',
        format: 'iife',
        name: 'Module',
        extend: true
    }
});
