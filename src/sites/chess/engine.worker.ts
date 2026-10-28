// Runs Patricia (WebAssembly) off the main thread. Searches are synchronous
// inside the engine, so a "go" command occupies this worker until it finishes;
// the page stays responsive because it never runs here.
import { createPatricia, type Patricia } from './patricia-runtime';

const ctx = self as unknown as {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
};

export type WorkerIn = { type: 'init'; wasmUrl: string } | { type: 'cmd'; line: string };
export type WorkerOut =
  | { type: 'ready' }
  | { type: 'line'; line: string }
  | { type: 'error'; message: string };

let engine: Patricia | null = null;
const queue: string[] = [];
let draining = false;

function drain() {
  if (draining || !engine) return;
  draining = true;
  try {
    while (queue.length) engine.send(queue.shift()!);
  } catch (e) {
    ctx.postMessage({ type: 'error', message: String(e) } satisfies WorkerOut);
  }
  draining = false;
}

ctx.onmessage = async (event: MessageEvent<WorkerIn>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    try {
      const response = await fetch(msg.wasmUrl);
      if (!response.ok) throw new Error(`could not load engine (${response.status})`);
      const bytes = await response.arrayBuffer();
      engine = await createPatricia(bytes, (line) =>
        ctx.postMessage({ type: 'line', line } satisfies WorkerOut),
      );
      ctx.postMessage({ type: 'ready' } satisfies WorkerOut);
      drain();
    } catch (e) {
      ctx.postMessage({ type: 'error', message: String(e) } satisfies WorkerOut);
    }
  } else if (msg.type === 'cmd') {
    queue.push(msg.line);
    drain();
  }
};
