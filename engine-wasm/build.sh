#!/usr/bin/env bash
# Builds Patricia (https://github.com/Adam-Kulju/Patricia, MIT) to WebAssembly
# with Zig's bundled clang. Output: ../public/patricia/patricia.wasm
#   pip install ziglang
set -euo pipefail
cd "$(dirname "$0")"
PATRICIA_COMMIT=67d83d7   # pinned upstream revision
BUILD=.build
OUT=../public/patricia

rm -rf "$BUILD" && mkdir -p "$BUILD" "$OUT"
git clone --quiet https://github.com/Adam-Kulju/Patricia "$BUILD/patricia"
git -C "$BUILD/patricia" checkout --quiet "$PATRICIA_COMMIT"
python3 patch_engine.py "$BUILD/patricia" "$BUILD/nets.c"

python3 -m ziglang cc -target wasm32-wasi -O3 -c "$BUILD/nets.c" -o "$BUILD/nets.o"
python3 -m ziglang c++ -target wasm32-wasi -mexec-model=reactor \
  -O3 -msimd128 -std=c++20 -ffast-math -fno-exceptions -DNDEBUG \
  "$BUILD/patricia/engine/wasm_entry.cpp" "$BUILD/nets.o" \
  -Wl,-z,stack-size=8388608 -Wl,--initial-memory=134217728 \
  -o "$OUT/patricia.wasm"
ls -l "$OUT/patricia.wasm"
