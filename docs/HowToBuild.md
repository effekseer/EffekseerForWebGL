## Requirements

- git
- python
- cmake
- mingw-make (Windows only)
- Emscripten 1.38.38 or later (Add directory to PATH)

## Clone the repositories

```
git clone https://github.com/effekseer/EffekseerForWebGL
cd EffekseerForWebGL
git submodule update --init
```

## Build

```
emsdk install 3.1.54
emsdk activate 3.1.54
python -m pip install dukpy jsmin
python build.py
```
