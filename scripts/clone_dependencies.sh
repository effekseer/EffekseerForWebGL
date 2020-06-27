git clone -b 15x https://github.com/effekseer/TestData.git
git clone -b 15x https://github.com/effekseer/Effekseer --depth 1 ../Effekseer
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install sdk-1.39.7-64bit
./emsdk activate sdk-1.39.7-64bit
