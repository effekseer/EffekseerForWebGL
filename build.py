import sys
import os
import shutil
import subprocess
import platform
import dukpy
import jsmin

def compile(build_dir,target_dir, option, effekseer_core_js, effekseer_src_js, effekseer_js, effekseer_min_js):
    if not os.path.exists(build_dir):
        os.mkdir(build_dir)
    os.chdir(build_dir)

    if platform.system() == "Windows":
        subprocess.check_call(["cmd", "/c", "emcmake", "cmake",
                           "-G", "MinGW Makefiles", option, target_dir])
        subprocess.check_call(["mingw32-make"])
    else:
        subprocess.check_call(["command", "emcmake", "cmake", option, target_dir])
        subprocess.check_call(["make"])

    outfile_js = open(effekseer_js, "w")
    outfile_min_js = open(effekseer_min_js, "w")

    with open(effekseer_core_js) as infile:
        data = infile.read()
        outfile_js.write(data)
        outfile_min_js.write(data)
    with open(effekseer_src_js) as infile:
        data = infile.read()
        data_es5 = dukpy.babel_compile(data)["code"]
        outfile_js.write(data_es5)
        outfile_min_js.write(jsmin.jsmin(data_es5))

    os.chdir('../')


compile('build_asmjs',
    '../src/',
    '-DAS_WASM=OFF',
    effekseer_core_js = os.path.join(".", "effekseer.core.js"),
    effekseer_src_js = os.path.join("..", "src", "js", "effekseer.src.js"),
    effekseer_js = os.path.join("..", "Release", "effekseer_asmjs.js"),
    effekseer_min_js = os.path.join("..", "Release", "effekseer_asmjs.min.js"))

compile('build_wasm',
    '../src/',
    '-DAS_WASM=ON',
    effekseer_core_js = os.path.join(".", "effekseer.core.js"),
    effekseer_src_js = os.path.join("..", "src", "js", "effekseer.src.js"),
    effekseer_js = os.path.join("..", "Release", "effekseer.js"),
    effekseer_min_js = os.path.join("..", "Release", "effekseer.min.js"))

shutil.copy('build_wasm/effekseer.core.wasm', 'Release/effekseer.wasm')