## Requirements

- git
- python
- cmake
- ninja
- Emscripten

## Clone the repositories

```
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

git clone https://github.com/Watunder/EffekseerForWebGL
cd EffekseerForWebGL
git submodule update --init --depth 1
```

## Build

```
cd /path/to/EffekseerForWebGL
python build.py
```
