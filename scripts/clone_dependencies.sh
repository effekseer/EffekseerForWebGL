git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install the oldest Emscripten SDK that still supports C++17 and ships
# macOS arm64 binaries (required by CI), while remaining compatible with
# our legacy build flags (e.g. "--memory-init-file").
EMSDK_VERSION=3.1.47

./emsdk install "${EMSDK_VERSION}"
./emsdk activate "${EMSDK_VERSION}"
