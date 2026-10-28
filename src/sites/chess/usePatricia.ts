import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkerIn, WorkerOut } from './engine.worker';

export interface SearchInfo {
  depth: number;
  /** centipawns from the engine's point of view, or mate distance */
  score: { cp: number } | { mate: number };
}

export type EngineStatus = 'loading' | 'ready' | 'error';

interface Pending {
  resolve: (move: string) => void;
  reject: (e: Error) => void;
  onInfo?: (info: SearchInfo) => void;
}

function parseInfo(line: string): SearchInfo | null {
  const depth = /\bdepth (\d+)/.exec(line);
  const cp = /\bscore cp (-?\d+)/.exec(line);
  const mate = /\bscore mate (-?\d+)/.exec(line);
  if (!depth || !(cp || mate)) return null;
  return { depth: Number(depth[1]), score: cp ? { cp: Number(cp[1]) } : { mate: Number(mate![1]) } };
}

/** Loads Patricia into a Web Worker and exposes a promise-based "pick a move". */
export function usePatricia() {
  const worker = useRef<Worker | null>(null);
  // Searches run one at a time in the worker, so replies come back in order.
  const pending = useRef<Pending[]>([]);
  const [status, setStatus] = useState<EngineStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const w = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (event: MessageEvent<WorkerOut>) => {
      const msg = event.data;
      if (msg.type === 'ready') {
        setStatus('ready');
      } else if (msg.type === 'error') {
        setStatus('error');
        setError(msg.message);
        pending.current.splice(0).forEach((p) => p.reject(new Error(msg.message)));
      } else if (msg.type === 'line') {
        const p = pending.current[0];
        if (!p) return;
        if (msg.line.startsWith('bestmove')) {
          pending.current.shift();
          p.resolve(msg.line.split(/\s+/)[1] ?? '');
        } else if (msg.line.startsWith('info')) {
          const info = parseInfo(msg.line);
          if (info) p.onInfo?.(info);
        }
      }
    };
    const init: WorkerIn = { type: 'init', wasmUrl: `${import.meta.env.BASE_URL}patricia/patricia.wasm` };
    w.postMessage(init);
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  const send = useCallback((line: string) => {
    const msg: WorkerIn = { type: 'cmd', line };
    worker.current?.postMessage(msg);
  }, []);

  const newGame = useCallback(
    (skillLevel: number) => {
      send('ucinewgame');
      send('setoption name Hash value 16');
      send(`setoption name Skill_Level value ${skillLevel}`);
      send('isready');
    },
    [send],
  );

  /** Ask for a move in the position reached by playing `moves` (UCI) from `fen`. */
  const bestMove = useCallback(
    (fen: string, moves: string[], skillLevel: number, moveTimeMs: number, onInfo?: (i: SearchInfo) => void) =>
      new Promise<string>((resolve, reject) => {
        pending.current.push({ resolve, reject, onInfo });
        send(`setoption name Skill_Level value ${skillLevel}`);
        send(`position fen ${fen}${moves.length ? ` moves ${moves.join(' ')}` : ''}`);
        send(`go movetime ${moveTimeMs}`);
      }),
    [send],
  );

  return { status, error, newGame, bestMove };
}
