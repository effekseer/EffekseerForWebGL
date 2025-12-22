#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

emsdk_dir="${EMSDK_DIR:-$root_dir/emsdk}"
emsdk_cmd="$emsdk_dir/emsdk"

if [ ! -x "$emsdk_cmd" ]; then
  echo "emsdk not found at $emsdk_cmd" >&2
  exit 1
fi

"$emsdk_cmd" activate sdk-fastcomp-tag-1.38.11-64bit
# shellcheck source=/dev/null
source "$emsdk_dir/emsdk_env.sh"

if [ -z "${BINARYEN_ROOT:-}" ]; then
  echo "BINARYEN_ROOT is not set after emsdk_env.sh" >&2
  exit 1
fi

if [ ! -f "$BINARYEN_ROOT/bin/wasm.js" ]; then
  binaryen_src_root="${BINARYEN_ROOT%_64bit_binaryen}"
  binaryen_src_wasm="${binaryen_src_root}/bin/wasm.js"
  mkdir -p "$BINARYEN_ROOT/bin"
  if [ -f "$binaryen_src_wasm" ]; then
    cp "$binaryen_src_wasm" "$BINARYEN_ROOT/bin/"
  else
    url="https://raw.githubusercontent.com/WebAssembly/binaryen/1.38.11/bin/wasm.js"
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "$url" -o "$BINARYEN_ROOT/bin/wasm.js"
    elif command -v wget >/dev/null 2>&1; then
      wget -qO "$BINARYEN_ROOT/bin/wasm.js" "$url"
    else
      echo "Neither curl nor wget is available to download $url" >&2
      exit 1
    fi
  fi
fi

python3 -m pip install --upgrade pip
python3 -m pip install dukpy jsmin
python3 build.py --skip-asmjs
