import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { usePatricia, type Score } from './usePatricia';
import SiteNav from '../home/SiteNav';
import './chess.css';

type Side = 'w' | 'b';
type Promo = 'q' | 'r' | 'b' | 'n';
interface PlayedMove {
  from: Square;
  to: Square;
  promotion?: Promo;
}

// Patricia's Skill_Level 1-20 and their Elo (from her README); 21 is full strength.
const LEVEL_ELO = [500, 800, 1000, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2650, 2800, 3000];
const FULL_STRENGTH = 21;
const DEFAULT_LEVEL = FULL_STRENGTH;
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const MIN_THINK_MS = 700; // so low levels don't answer instantly
const ANALYSIS_MS = 900; // full-strength look at the position while it's your move
const BEST_COLOR = 'rgba(38, 139, 210, 0.85)'; // solarized blue
const SECOND_COLOR = 'rgba(203, 117, 22, 0.85)'; // solarized orange
// Blunder hint thresholds, as a drop in your winning chances (percentage points),
// matching the cut-offs lichess uses for "mistake" and "blunder".
const MISTAKE_DROP = 10;
const BLUNDER_DROP = 15;
const MIN_JUDGE_DEPTH = 8; // don't judge a move from a shallow look

const levelLabel = (level: number) =>
  level === FULL_STRENGTH ? 'Full strength (~3500 Elo)' : `Level ${level} (~${LEVEL_ELO[level - 1]} Elo)`;
const moveTimeFor = (level: number) => 400 + level * 60;
const toUci = (m: PlayedMove) => `${m.from}${m.to}${m.promotion ?? ''}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatScore(score: Score): string {
  if ('mate' in score) return `${score.mate > 0 ? '' : '-'}M${Math.abs(score.mate)}`;
  const pawns = score.cp / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

/** UCI scores are from the side to move's point of view; the meter is White's. */
function toWhite(score: Score, sideToMove: Side): Score {
  const sign = sideToMove === 'w' ? 1 : -1;
  return 'mate' in score ? { mate: score.mate * sign } : { cp: score.cp * sign };
}

/** Share of the bar given to White, 0-100. */
function whiteShare(score: Score): number {
  if ('mate' in score) return score.mate > 0 ? 100 : 0;
  const winProbability = 1 / (1 + Math.exp(-score.cp / 400));
  return Math.min(97, Math.max(3, winProbability * 100));
}

/** Winning chances for White in percent (lichess's centipawn curve). */
function winPercent(score: Score): number {
  if ('mate' in score) return score.mate > 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * score.cp)) - 1);
}

const negate = (s: Score): Score => ('mate' in s ? { mate: -s.mate } : { cp: -s.cp });

function toSan(fen: string, uci: string): string {
  try {
    const g = new Chess(fen);
    return g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
  } catch {
    return uci;
  }
}

function usePersistedFlag(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : stored === '1';
    } catch {
      return initial;
    }
  });
  const set = (v: boolean) => {
    setValue(v);
    try {
      localStorage.setItem(key, v ? '1' : '0');
    } catch {
      /* private mode etc.: the setting just won't persist */
    }
  };
  return [value, set];
}

interface BlunderAlert {
  kind: 'Blunder' | 'Mistake';
  played: string; // SAN of your move
  better: string | null; // SAN of Patricia's preferred move
  from: string; // eval before your move, your point of view
  to: string; // eval after it
}

interface MoveToJudge {
  fenBefore: string;
  side: Side;
  san: string;
}

interface AnalysisLine {
  move: string;
  score: Score; // White's point of view
  depth: number;
}

function replay(moves: PlayedMove[]): Chess {
  const g = new Chess();
  for (const m of moves) g.move(m);
  return g;
}

function findKing(g: Chess, color: Side): Square | null {
  for (const row of g.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square;
    }
  }
  return null;
}

const SAVE_KEY = 'chess.game.v1';

interface SavedGame {
  level: number;
  side: Side;
  orientation: 'white' | 'black';
  moves: PlayedMove[];
}

/** The game in progress (and chosen strength), so a refresh doesn't lose it. */
function loadSaved(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedGame;
    if (!Number.isInteger(s.level) || s.level < 1 || s.level > FULL_STRENGTH) return null;
    if (s.side !== 'w' && s.side !== 'b') return null;
    if (s.orientation !== 'white' && s.orientation !== 'black') return null;
    if (!Array.isArray(s.moves)) return null;
    const moves: PlayedMove[] = s.moves.map((m) => ({ from: m.from, to: m.to, promotion: m.promotion }));
    replay(moves); // throws if any saved move is illegal, which discards the save
    return { level: s.level, side: s.side, orientation: s.orientation, moves };
  } catch {
    return null;
  }
}

export default function ChessPage() {
  const engine = usePatricia();
  const [saved] = useState(loadSaved);
  const [moves, setMoves] = useState<PlayedMove[]>(saved?.moves ?? []);
  const [playerSide, setPlayerSide] = useState<Side>(saved?.side ?? 'w');
  const [orientation, setOrientation] = useState<'white' | 'black'>(saved?.orientation ?? 'white');
  const [level, setLevel] = useState(saved?.level ?? DEFAULT_LEVEL);
  const [thinking, setThinking] = useState(false);
  const [depthInfo, setDepthInfo] = useState<{ depth: number; score: Score } | null>(null);
  const [meter, setMeter] = useState<Score>({ cp: 0 }); // White's point of view
  const [lines, setLines] = useState<Record<number, AnalysisLine>>({});
  const [showEval, setShowEval] = usePersistedFlag('chess.showEval', false);
  const [showBest, setShowBest] = usePersistedFlag('chess.showBest', false);
  const [showBlunder, setShowBlunder] = usePersistedFlag('chess.showBlunder', false);
  const [blunder, setBlunder] = useState<BlunderAlert | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  const boardBox = useRef<HTMLDivElement>(null);
  const moveList = useRef<HTMLOListElement>(null);
  // Bumped whenever the game is reset or rewound, so a late engine reply is ignored.
  const gameId = useRef(0);
  // Latest full-strength look at a position where it was your move, and the move you
  // just played from it. Patricia's reply search then tells us what that move cost.
  const analysisRef = useRef<{ fen: string; score: Score; depth: number; move: string } | null>(null);
  const judgeRef = useRef<MoveToJudge | null>(null);

  useEffect(() => {
    try {
      const state: SavedGame = { level, side: playerSide, orientation, moves };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* private mode or storage full: the game just won't survive a refresh */
    }
  }, [level, playerSide, orientation, moves]);

  const game = useMemo(() => replay(moves), [moves]);
  const fen = game.fen();
  const gameOver = game.isGameOver();
  const myTurn = game.turn() === playerSide;
  const engineReady = engine.status === 'ready';

  // Keep the board square and as wide as its column allows.
  useEffect(() => {
    const el = boardBox.current;
    if (!el) return;
    const update = () => setBoardWidth(Math.max(240, Math.min(640, Math.floor(el.clientWidth))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    document.title = 'Play Patricia - Scott.Kim';
  }, []);

  // Patricia plays whenever it is her turn.
  useEffect(() => {
    if (!engineReady || gameOver || myTurn) return;
    const id = gameId.current;
    const side = game.turn();
    let cancelled = false;
    let lastScore: Score | null = null; // White's point of view
    setThinking(true);
    setDepthInfo(null);
    (async () => {
      try {
        const [uci] = await Promise.all([
          engine.bestMove(START_FEN, moves.map(toUci), level, moveTimeFor(level), (i) => {
            if (cancelled || id !== gameId.current || i.multipv !== 1) return;
            setDepthInfo({ depth: i.depth, score: i.score });
            lastScore = toWhite(i.score, side);
            setMeter(lastScore);
          }),
          sleep(MIN_THINK_MS),
        ]);
        if (cancelled || id !== gameId.current) return;

        const judge = judgeRef.current;
        judgeRef.current = null;
        const before = analysisRef.current;
        if (judge && lastScore && before && before.fen === judge.fenBefore && before.depth >= MIN_JUDGE_DEPTH) {
          const mine = (s: Score) => (judge.side === 'w' ? winPercent(s) : 100 - winPercent(s));
          const drop = mine(before.score) - mine(lastScore);
          if (drop >= MISTAKE_DROP) {
            const pov = (s: Score) => formatScore(judge.side === 'w' ? s : negate(s));
            const better = toSan(judge.fenBefore, before.move);
            setBlunder({
              kind: drop >= BLUNDER_DROP ? 'Blunder' : 'Mistake',
              played: judge.san,
              better: better === judge.san ? null : better,
              from: pov(before.score),
              to: pov(lastScore),
            });
          }
        }
        if (uci.length >= 4 && uci !== '0000' && uci !== '(none)') {
          const reply: PlayedMove = {
            from: uci.slice(0, 2) as Square,
            to: uci.slice(2, 4) as Square,
            promotion: uci.length > 4 ? (uci[4] as Promo) : undefined,
          };
          setMoves((prev) => [...prev, reply]);
        }
      } catch {
        // engine error is surfaced through engine.status
      } finally {
        if (id === gameId.current) setThinking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves, engineReady, playerSide]);

  // While it's your move, look at the position at full strength (top two lines)
  // for the eval bar, best-move arrows and blunder hint. Only runs if one is on.
  const wantAnalysis = showEval || showBest || showBlunder;
  useEffect(() => {
    if (!engineReady || gameOver || !myTurn || !wantAnalysis) return;
    const side = game.turn();
    const analysisFen = fen;
    let cancelled = false;
    setLines({});
    engine
      .analyze(START_FEN, moves.map(toUci), ANALYSIS_MS, (i) => {
        if (!i.move) return;
        const score = toWhite(i.score, side);
        // Keep updating even after you've moved: the search finishes before Patricia replies.
        if (i.multipv === 1) analysisRef.current = { fen: analysisFen, score, depth: i.depth, move: i.move };
        if (cancelled) return;
        setLines((prev) => ({ ...prev, [i.multipv]: { move: i.move!, score, depth: i.depth } }));
        if (i.multipv === 1) setMeter(score);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, engineReady, gameOver, myTurn, wantAnalysis]);

  useEffect(() => {
    // Scroll the list box itself. scrollIntoView would also scroll the whole
    // page, which on a phone (list below the fold) made it jump on every move.
    const list = moveList.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [moves.length]);

  const resetGame = useCallback(
    (side: Side) => {
      gameId.current += 1;
      setThinking(false);
      setDepthInfo(null);
      setSelected(null);
      setPromotion(null);
      setPlayerSide(side);
      setOrientation(side === 'w' ? 'white' : 'black');
      setMoves([]);
      setLines({});
      setBlunder(null);
      judgeRef.current = null;
      setMeter({ cp: 0 });
      engine.newGame(level);
    },
    [engine, level],
  );

  // Reset the engine's state once it has loaded (and for the first game).
  useEffect(() => {
    if (engineReady) engine.newGame(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineReady]);

  const undo = () => {
    if (!moves.length) return;
    gameId.current += 1;
    setThinking(false);
    setSelected(null);
    setPromotion(null);
    setBlunder(null);
    judgeRef.current = null;
    // Take back to the player's own turn: Patricia's reply and the player's move.
    const lastWasPlayers = (moves.length % 2 === 1) === (playerSide === 'w');
    const drop = lastWasPlayers ? 1 : Math.min(2, moves.length);
    setMoves(moves.slice(0, moves.length - drop));
  };

  const legalTargets = useMemo(() => {
    if (!selected) return [] as Square[];
    return game.moves({ square: selected, verbose: true }).map((m) => m.to);
  }, [game, selected]);

  const tryMove = (from: Square, to: Square, promo?: Promo): boolean => {
    if (!myTurn || gameOver || thinking || !engineReady) return false;
    const candidates = game.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!candidates.length) return false;
    if (candidates[0].isPromotion() && !promo) {
      setPromotion({ from, to });
      return false; // the board snaps back until a piece is chosen
    }
    setSelected(null);
    setPromotion(null);
    setBlunder(null);
    judgeRef.current = showBlunder ? { fenBefore: fen, side: playerSide, san: candidates[0].san } : null;
    setMoves((prev) => [...prev, { from, to, promotion: promo }]);
    return true;
  };

  const onSquareClick = (square: Square) => {
    if (!myTurn || gameOver || thinking) return;
    if (selected && legalTargets.includes(square)) {
      tryMove(selected, square);
      return;
    }
    const piece = game.get(square);
    setSelected(piece && piece.color === playerSide ? square : null);
  };

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    const last = moves[moves.length - 1];
    if (last) {
      styles[last.from] = { background: 'rgba(255, 213, 79, 0.35)' };
      styles[last.to] = { background: 'rgba(255, 213, 79, 0.55)' };
    }
    if (game.isCheck()) {
      const king = findKing(game, game.turn());
      if (king) styles[king] = { background: 'radial-gradient(circle, rgba(255,60,60,0.85) 0%, rgba(255,60,60,0) 70%)' };
    }
    if (selected) styles[selected] = { background: 'rgba(100, 200, 120, 0.55)' };
    for (const sq of legalTargets) {
      const occupied = !!game.get(sq);
      styles[sq] = {
        ...styles[sq],
        background: occupied
          ? 'radial-gradient(circle, transparent 58%, rgba(0,0,0,0.3) 60%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.3) 22%, transparent 24%)',
      };
    }
    return styles;
  }, [moves, game, selected, legalTargets]);

  const status = (() => {
    if (engine.status === 'error') return 'Patricia failed to load. Try reloading the page.';
    if (!engineReady) return 'Waking Patricia up…';
    if (game.isCheckmate()) return game.turn() === playerSide ? 'Checkmate. Patricia wins. 🐇' : 'Checkmate. You beat Patricia!';
    if (game.isStalemate()) return 'Draw by stalemate.';
    if (game.isThreefoldRepetition()) return 'Draw by repetition.';
    if (game.isInsufficientMaterial()) return 'Draw: not enough material.';
    if (game.isDraw()) return 'Draw (50-move rule).';
    if (thinking) return 'Patricia is thinking…';
    return game.isCheck() ? 'Your move. You are in check!' : 'Your move.';
  })();

  const san = game.history();
  const rows: [string, string | undefined][] = [];
  for (let i = 0; i < san.length; i += 2) rows.push([san[i], san[i + 1]]);

  const showAnalysis = myTurn && !thinking && !gameOver && engineReady;
  const arrows = useMemo<[Square, Square, string][]>(() => {
    if (!showBest || !showAnalysis) return [];
    const out: [Square, Square, string][] = [];
    for (const [rank, color] of [[1, BEST_COLOR], [2, SECOND_COLOR]] as const) {
      const move = lines[rank]?.move;
      if (move) out.push([move.slice(0, 2) as Square, move.slice(2, 4) as Square, color]);
    }
    return out;
  }, [showBest, showAnalysis, lines]);

  const share = whiteShare(meter);
  const whiteAtBottom = orientation === 'white';
  const labelAtBottom = share >= 50 === whiteAtBottom; // label sits in the leading side's zone

  return (
    <>
      <SiteNav />
      <div className="row margin-top-large">
        <div className="paper container border-dashed border-thick">
          <div className="pc-heading">
            <h1 className="margin-none">Play Patricia</h1>
            <p className="margin-none">A killer bunny of a chess engine, running entirely in your browser.</p>
          </div>

          <div className="pc-main">
            <div className="pc-boardwrap">
              {showEval && (
                <div className="pc-eval" style={{ height: boardWidth }} title="Evaluation (White's point of view)">
                  <div
                    className="pc-eval-white"
                    style={{ height: `${share}%`, [whiteAtBottom ? 'bottom' : 'top']: 0 }}
                  />
                  <span className={`pc-eval-label ${labelAtBottom ? 'bottom' : 'top'} ${share >= 50 ? 'on-white' : 'on-dark'}`}>
                    {formatScore(meter)}
                  </span>
                </div>
              )}
              <div className="pc-board" ref={boardBox}>
                <Chessboard
                  id="patricia-board"
                  position={fen}
                  boardWidth={boardWidth}
                  boardOrientation={orientation}
                  onPieceDrop={(from, to) => tryMove(from, to)}
                  onSquareClick={onSquareClick}
                  onPromotionCheck={() => false}
                  promotionDialogVariant="modal"
                  showPromotionDialog={!!promotion}
                  promotionToSquare={promotion?.to}
                  onPromotionPieceSelect={(piece) => {
                    if (piece && promotion) {
                      tryMove(promotion.from, promotion.to, piece[1].toLowerCase() as Promo);
                    } else {
                      setPromotion(null);
                    }
                    return true;
                  }}
                  arePiecesDraggable={myTurn && !gameOver && !thinking && engineReady}
                  customSquareStyles={squareStyles}
                  customArrows={arrows}
                  customDarkSquareStyle={{ backgroundColor: '#93a1a1' }}
                  customLightSquareStyle={{ backgroundColor: '#eee8d5' }}
                  customBoardStyle={{ borderRadius: 4, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
                  animationDuration={180}
                />
                {blunder && (
                  <div className={`pc-alert ${blunder.kind.toLowerCase()}`} role="alert">
                    <button className="pc-alert-close" onClick={() => setBlunder(null)} aria-label="Dismiss">×</button>
                    <b>{blunder.kind === 'Blunder' ? '⚠ Blunder!' : '⚠ Mistake'}</b> {blunder.played} took your eval
                    from {blunder.from} to {blunder.to}.
                    {blunder.better && <> Better: {blunder.better}.</>}
                  </div>
                )}
              </div>
            </div>

            <aside className="pc-panel">
              <div className={`pc-status${gameOver ? ' over' : ''}`} role="status" aria-live="polite">
                {status}
              </div>
              {depthInfo && thinking && (
                <div className="pc-info">
                  depth {depthInfo.depth} · eval {formatScore(depthInfo.score)}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="pc-level">Strength</label>
                <select
                  id="pc-level"
                  value={level}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setLevel(next);
                    engine.newGame(next);
                  }}
                >
                  {Array.from({ length: FULL_STRENGTH }, (_, i) => i + 1).map((l) => (
                    <option key={l} value={l}>{levelLabel(l)}</option>
                  ))}
                </select>
              </div>

              <div className="pc-buttons">
                <button className="paper-btn btn-small" onClick={() => resetGame('w')} disabled={!engineReady}>New game as White</button>
                <button className="paper-btn btn-small" onClick={() => resetGame('b')} disabled={!engineReady}>New game as Black</button>
                <button className="paper-btn btn-small" onClick={undo} disabled={!moves.length}>Take back</button>
                <button className="paper-btn btn-small" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>Flip board</button>
              </div>

              <div className="pc-help form-group">
                <label className="paper-check">
                  <input type="checkbox" checked={showEval} onChange={(e) => setShowEval(e.target.checked)} />
                  <span>Evaluation bar</span>
                </label>
                <label className="paper-check">
                  <input type="checkbox" checked={showBest} onChange={(e) => setShowBest(e.target.checked)} />
                  <span>Best moves (top 2)</span>
                </label>
                <label className="paper-check">
                  <input type="checkbox" checked={showBlunder} onChange={(e) => { setShowBlunder(e.target.checked); if (!e.target.checked) setBlunder(null); }} />
                  <span>Blunder hint</span>
                </label>
                {showBest && (
                  <ul className="pc-best">
                    {[1, 2].map((rank) => {
                      const line = showAnalysis ? lines[rank] : undefined;
                      return (
                        <li key={rank}>
                          <span className="pc-swatch" style={{ background: rank === 1 ? BEST_COLOR : SECOND_COLOR }} />
                          {line ? (
                            <>
                              <b>{toSan(fen, line.move)}</b> <span className="pc-score">{formatScore(line.score)}</span>
                            </>
                          ) : (
                            <span className="pc-score">{showAnalysis ? '…' : '-'}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="pc-moves">
                <h2>Moves</h2>
                <ol ref={moveList}>
                  {rows.map(([w, b], i) => (
                    <li key={i}>
                      <span className="n">{i + 1}.</span>
                      <span>{w}</span>
                      <span>{b ?? ''}</span>
                    </li>
                  ))}
                  {!rows.length && <li className="empty">No moves yet. You are {playerSide === 'w' ? 'White' : 'Black'}.</li>}
                </ol>
              </div>
            </aside>
          </div>

          <p className="pc-footer">
            Engine: <a href="https://github.com/Adam-Kulju/Patricia">Patricia</a> by Adam Kulju (MIT license),
            compiled to WebAssembly. Board: react-chessboard. Rules: chess.js.
          </p>
        </div>
      </div>
    </>
  );
}
