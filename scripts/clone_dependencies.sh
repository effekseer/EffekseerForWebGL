git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install an Emscripten SDK new enough to ship macOS arm64 binaries on CI
# but still compatible with the legacy build flags that our CMake setup
# depends on ("--memory-init-file").
EMSDK_VERSION=3.1.54

./emsdk install "${EMSDK_VERSION}"
./emsdk activate "${EMSDK_VERSION}"
