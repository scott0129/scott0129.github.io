# Patricia → WebAssembly

Builds [Patricia](https://github.com/Adam-Kulju/Patricia) (Adam Kulju, MIT) into
`public/patricia/patricia.wasm`, which the `/chess` page runs in a Web Worker.

```sh
pip install ziglang     # Zig bundles clang + libc++, no Emscripten needed
./build.sh
```

`build.sh` clones a pinned upstream commit, applies `patch_engine.py` to the
*copy*, and compiles for `wasm32-wasi` (reactor, SIMD128). The patch:

- embeds the three NNUE nets from a generated C file instead of `incbin`
- stubs out Syzygy tablebase probing
- makes the engine single-threaded (GitHub Pages can't send the COOP/COEP
  headers that WebAssembly threads need) and splits `uci()` into
  `uci_init()` / `uci_handle(line)` so JS can feed it one command at a time

Sanity check: `bench` reports 3,187,856 nodes, identical to upstream's native build.
The committed `patricia.wasm` is the build output; rebuild only to update Patricia.
