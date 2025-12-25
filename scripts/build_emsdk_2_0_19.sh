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

"$emsdk_cmd" activate sdk-2.0.19-64bit
# shellcheck source=/dev/null
source "$emsdk_dir/emsdk_env.sh"

python3 -m pip install --upgrade pip
python3 -m pip install dukpy jsmin
python3 build.py
