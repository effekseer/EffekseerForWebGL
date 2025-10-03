git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install a modern Emscripten SDK that ships macOS arm64 binaries so CI
# runners no longer fall back to Rosetta for legacy toolchains.
EMSDK_VERSION=3.1.57

./emsdk install "${EMSDK_VERSION}"
./emsdk activate "${EMSDK_VERSION}"
