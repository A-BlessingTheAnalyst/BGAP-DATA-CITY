'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowBigUp, ChevronDown, CornerDownLeft, Delete, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import type { EditOp } from './textEdit';

// The game's own on-screen keyboard for touch devices (owner feedback 21 Nov 2026): the phone's
// keyboard covers half the screen and has no SQL keys. This one is drawn by the game, sized for
// landscape, and in SQL mode adds a keyword row plus chips for the case's own tables and columns.
// Keys act on pointer-down and call preventDefault, so the text area never loses focus/caret.

export const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT',
  'IN', 'IS NULL', 'LIKE', 'BETWEEN', 'DISTINCT', 'LIMIT', 'DESC', 'ASC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'COUNT(', 'SUM(', 'AVG(', 'MIN(', 'MAX(', 'ROUND(', 'COALESCE(', 'CAST(', 'NULLIF(', 'DATE_TRUNC(', 'WITH',
];

const LETTERS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const SYMBOLS = ['1234567890', `()*=<>!%'"`, `,.;:_-+/`];

type Layer = 'abc' | 'sym';

interface Props {
  mode: 'sql' | 'text';
  onOp: (op: EditOp) => void;
  /** Autocomplete: replace the partial word before the caret. */
  onComplete?: (word: string) => void;
  /** Partial word before the caret, to rank chips. */
  prefix?: string;
  /** Table/column names for the chip row (SQL mode). */
  suggestions?: string[];
  onHide?: () => void;
  onEnter?: () => void;
  /** Extra buttons at the right of the top bar (e.g. Run). */
  actions?: ReactNode;
  /** Text mode: echo the field's value in the top bar (the field itself may be under the keyboard). */
  preview?: string;
  placeholder?: string;
}

function Key({ onPress, className = '', children, label, repeat = false }: { onPress: () => void; className?: string; children: ReactNode; label?: string; repeat?: boolean }) {
  const timers = useRef<{ t?: number; i?: number }>({});
  const stop = () => { window.clearTimeout(timers.current.t); window.clearInterval(timers.current.i); };
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
        if (repeat) timers.current.t = window.setTimeout(() => { timers.current.i = window.setInterval(onPress, 55); }, 380);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`touch-none select-none h-full min-w-0 rounded-lg bg-white text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.25)] active:bg-slate-200 active:scale-[0.97] flex items-center justify-center text-[15px] font-medium ${className}`}
    >
      {children}
    </button>
  );
}

export function GameKeyboard({ mode, onOp, onComplete, prefix = '', suggestions = [], onHide, onEnter, actions, preview, placeholder }: Props) {
  const [layer, setLayer] = useState<Layer>('abc');
  const [shift, setShift] = useState<'off' | 'once' | 'lock'>(mode === 'text' ? 'once' : 'off');
  const lastShiftTap = useRef(0);

  const ins = (t: string) => {
    onOp({ type: 'insert', text: shift !== 'off' && layer === 'abc' ? t.toUpperCase() : t });
    if (shift === 'once') setShift('off');
  };

  // Chips: words that start with what you're typing first, then the rest (tables/columns, then keywords).
  const chips = useMemo(() => {
    if (mode !== 'sql') return [];
    const pool = [...suggestions, ...SQL_KEYWORDS];
    const p = prefix.toLowerCase();
    if (!p) return pool;
    const hits = pool.filter((w) => w.toLowerCase().startsWith(p) && w.toLowerCase() !== p);
    return [...hits, ...pool.filter((w) => !hits.includes(w))];
  }, [mode, suggestions, prefix]);

  const rows = layer === 'abc' ? LETTERS : SYMBOLS;
  const upper = shift !== 'off';

  return (
    <div
      className="w-full bg-slate-300/95 backdrop-blur border-t border-slate-400 select-none touch-none flex flex-col gap-1 px-1.5 pt-1"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))', paddingLeft: 'max(6px, env(safe-area-inset-left))', paddingRight: 'max(6px, env(safe-area-inset-right))' }}
      role="group"
      aria-label="In-game keyboard"
    >
      {/* Top bar: chips (SQL) + caret keys + actions + hide */}
      <div className="flex items-center gap-1 h-9">
        <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto no-scrollbar touch-pan-x" style={{ touchAction: 'pan-x' }}>
          {mode === 'text' && preview !== undefined && (
            <div className="flex-1 min-w-0 h-8 px-3 rounded-md bg-white text-slate-900 text-sm flex items-center truncate">
              {preview ? <span className="truncate">{preview}<span className="inline-block w-px h-4 bg-bgap-cyan align-middle ml-px animate-pulse" /></span> : <span className="text-slate-400 truncate">{placeholder}</span>}
            </div>
          )}
          {mode === 'sql' && chips.map((w) => (
            <button
              key={w}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); onComplete?.(w); }}
              className={`shrink-0 px-2.5 h-8 rounded-md text-[12px] font-mono font-semibold whitespace-nowrap ${suggestions.includes(w) ? 'bg-bgap-cyan/90 text-white' : 'bg-white text-slate-800'}`}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1 h-8 shrink-0">
          <Key label="Caret up" onPress={() => onOp({ type: 'move', dir: 'up' })} className="w-8 !bg-slate-100" repeat><ChevronUp className="w-4 h-4" /></Key>
          <Key label="Caret down" onPress={() => onOp({ type: 'move', dir: 'down' })} className="w-8 !bg-slate-100" repeat><ChevronDown className="w-4 h-4" /></Key>
          <Key label="Caret left" onPress={() => onOp({ type: 'move', dir: 'left' })} className="w-8 !bg-slate-100" repeat><ChevronLeft className="w-4 h-4" /></Key>
          <Key label="Caret right" onPress={() => onOp({ type: 'move', dir: 'right' })} className="w-8 !bg-slate-100" repeat><ChevronRight className="w-4 h-4" /></Key>
          {actions}
          {onHide && <Key label="Hide keyboard" onPress={onHide} className="px-2 !bg-slate-100 text-[11px] font-semibold">Hide</Key>}
        </div>
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1 h-10 [@media(max-height:420px)]:h-8">
          {ri === 2 && layer === 'abc' && (
            <Key
              label="Shift"
              className={`w-12 ${shift === 'lock' ? '!bg-bgap-cyan !text-white' : shift === 'once' ? '!bg-slate-50' : '!bg-slate-400/70'}`}
              onPress={() => {
                const now = Date.now();
                if (now - lastShiftTap.current < 350) setShift('lock');
                else setShift((s) => (s === 'off' ? 'once' : 'off'));
                lastShiftTap.current = now;
              }}
            >
              <ArrowBigUp className="w-5 h-5" />
            </Key>
          )}
          {ri === 1 && layer === 'abc' && <div className="w-[4%]" />}
          {row.split('').map((ch) => (
            <Key key={ch} onPress={() => ins(ch)} className="flex-1">{upper && layer === 'abc' ? ch.toUpperCase() : ch}</Key>
          ))}
          {ri === 1 && layer === 'abc' && <div className="w-[4%]" />}
          {ri === 2 && <Key label="Backspace" className="w-12 !bg-slate-400/70" onPress={() => onOp({ type: 'backspace' })} repeat><Delete className="w-5 h-5" /></Key>}
        </div>
      ))}

      <div className="flex gap-1 h-10 [@media(max-height:420px)]:h-8">
        <Key className="w-14 !bg-slate-400/70 text-[12px] font-semibold" onPress={() => setLayer((l) => (l === 'abc' ? 'sym' : 'abc'))}>{layer === 'abc' ? '123' : 'ABC'}</Key>
        {mode === 'sql' && <Key className="w-10" onPress={() => ins('*')}>*</Key>}
        <Key className="w-10" onPress={() => ins(',')}>,</Key>
        <Key label="Space" className="flex-1 text-[12px] text-slate-500" onPress={() => onOp({ type: 'insert', text: ' ' })} repeat>space</Key>
        <Key className="w-10" onPress={() => ins('.')}>.</Key>
        {mode === 'sql' && <Key className="w-10" onPress={() => ins("'")}>&apos;</Key>}
        <Key label="Enter" className="w-16 !bg-bgap-cyan !text-white" onPress={() => (onEnter ? onEnter() : onOp({ type: 'newline' }))}>
          <CornerDownLeft className="w-5 h-5" />
        </Key>
      </div>
    </div>
  );
}
