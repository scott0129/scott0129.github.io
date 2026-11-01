// Minimal WASI (preview1) host + wrapper for the Patricia WebAssembly engine.
// Works in a Web Worker and in Node (for tests). The engine is driven one UCI
// command at a time; everything it prints is delivered line by line.

export interface Patricia {
  send(command: string): void;
}

export async function createPatricia(
  wasmSource: BufferSource | WebAssembly.Module,
  onLine: (line: string) => void,
): Promise<Patricia> {
  // eslint-disable-next-line prefer-const -- assigned after the module is instantiated
  let memory: WebAssembly.Memory;
  let outBuf = '';
  const dec = new TextDecoder();
  const enc = new TextEncoder();

  const view = () => new DataView(memory.buffer);
  const bytes = () => new Uint8Array(memory.buffer);

  function flushLines(final: boolean) {
    let i;
    while ((i = outBuf.indexOf('\n')) >= 0) {
      const line = outBuf.slice(0, i).replace(/\r$/, '');
      outBuf = outBuf.slice(i + 1);
      if (line) onLine(line);
    }
    if (final && outBuf) {
      onLine(outBuf);
      outBuf = '';
    }
  }

  const wasi = {
    args_get: () => 0,
    args_sizes_get: (argc: number, size: number) => {
      view().setUint32(argc, 0, true);
      view().setUint32(size, 0, true);
      return 0;
    },
    environ_get: () => 0,
    environ_sizes_get: (count: number, size: number) => {
      view().setUint32(count, 0, true);
      view().setUint32(size, 0, true);
      return 0;
    },
    clock_time_get: (_id: number, _precision: bigint, out: number) => {
      const ns = BigInt(Math.round(performance.now() * 1e6));
      view().setBigUint64(out, ns, true);
      return 0;
    },
    clock_res_get: (_id: number, out: number) => {
      view().setBigUint64(out, 1000n, true);
      return 0;
    },
    fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
      const dv = view();
      let total = 0;
      for (let i = 0; i < iovsLen; i++) {
        const ptr = dv.getUint32(iovs + i * 8, true);
        const len = dv.getUint32(iovs + i * 8 + 4, true);
        if (fd === 1 || fd === 2) outBuf += dec.decode(bytes().subarray(ptr, ptr + len), { stream: true });
        total += len;
      }
      dv.setUint32(nwritten, total, true);
      flushLines(false);
      return 0;
    },
    fd_read: (_fd: number, _iovs: number, _len: number, nread: number) => {
      view().setUint32(nread, 0, true);
      return 0;
    },
    fd_close: () => 0,
    fd_seek: () => 70, // ESPIPE
    fd_fdstat_get: (fd: number, out: number) => {
      const dv = view();
      dv.setUint8(out, fd <= 2 ? 2 : 4); // character device / regular file
      dv.setUint16(out + 2, 0, true);
      dv.setBigUint64(out + 8, 0xffffffffffffffffn, true);
      dv.setBigUint64(out + 16, 0xffffffffffffffffn, true);
      return 0;
    },
    fd_fdstat_set_flags: () => 0,
    fd_prestat_get: () => 8, // EBADF: no preopened directories
    fd_prestat_dir_name: () => 8,
    path_open: () => 44, // ENOENT
    random_get: (ptr: number, len: number) => {
      crypto.getRandomValues(bytes().subarray(ptr, ptr + len));
      return 0;
    },
    sched_yield: () => 0,
    proc_exit: (code: number) => {
      throw new Error(`engine exited with code ${code}`);
    },
  };

  const module = wasmSource instanceof WebAssembly.Module ? wasmSource : await WebAssembly.compile(wasmSource);
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi });
  const exp = instance.exports as unknown as {
    memory: WebAssembly.Memory;
    _initialize?: () => void;
    patricia_init: () => void;
    patricia_input: () => number;
    patricia_command: () => void;
  };
  memory = exp.memory;
  if (exp._initialize) exp._initialize();
  exp.patricia_init();

  return {
    send(command) {
      const b = enc.encode(command + '\0');
      if (b.length > 8000) throw new Error('UCI command too long');
      bytes().set(b, exp.patricia_input());
      exp.patricia_command();
      flushLines(true);
    },
  };
}
