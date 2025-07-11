import sys
import os
import shutil
import subprocess
import platform

def compile(build_dir, target_dir, option):
    if platform.system() == 'Windows':
        subprocess.check_call(['cmd', '/c', 'npm ci'])
        subprocess.check_call(['cmd', '/c', 'npm run build'])
    else:
        subprocess.check_call(['sh', '-c', 'npm ci'])
        subprocess.check_call(['sh', '-c', 'npm run build'])

    if not os.path.exists(build_dir):
        os.mkdir(build_dir)
    os.chdir(build_dir)

    if os.path.exists('effekseer.js'):
        os.remove('effekseer.js')

    if platform.system() == 'Windows':
        subprocess.check_call(['cmd', '/c', 'emcmake cmake {0} {1}'.format(option, target_dir)])
        subprocess.check_call(['ninja'])
    else:
        subprocess.check_call(['sh', '-c', 'emcmake cmake {0} {1}'.format(option, target_dir)])
        subprocess.check_call(['ninja'])

    os.chdir('../')

    if platform.system() == 'Windows':
        subprocess.check_call(['cmd', '/c', 'npm run types'])
    else:
        subprocess.check_call(['sh', '-c', 'npm run types'])

compile('build_wasm', '../src/', '-G Ninja')

shutil.copy('build_wasm/effekseer.js', 'Release/effekseer.js')
shutil.copy('build_wasm/effekseer.wasm', 'Release/effekseer.wasm')