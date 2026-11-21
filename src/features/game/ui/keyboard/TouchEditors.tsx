'use client';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { GameKeyboard } from './GameKeyboard';
import { applyEdit, completeWord, wordBefore, type EditOp, type EditState } from './textEdit';

// Text fields that never summon the phone's own keyboard: `inputMode="none"` keeps the native
// caret/selection (tap to place, long-press to select) but the OS keyboard stays down, and the
// game's GameKeyboard docks at the bottom of the screen instead.

function useEditable(value: string, onChange: (v: string) => void, el: () => HTMLTextAreaElement | HTMLInputElement | null) {
  const pendingCaret = useRef<number | null>(null);
  // Latest text and caret, updated synchronously on every key, so fast taps that land before
  // React re-renders build on each other instead of on a stale value.
  const live = useRef<EditState | null>(null);
  if (live.current === null || (pendingCaret.current === null && live.current.value !== value)) live.current = { value, start: value.length, end: value.length };
  const state = (): EditState => {
    const e = el();
    if (pendingCaret.current !== null && live.current) return live.current;
    const v = live.current?.value ?? value;
    return { value: v, start: e?.selectionStart ?? v.length, end: e?.selectionEnd ?? v.length };
  };
  const commit = (next: EditState) => {
    const changed = next.value !== live.current?.value;
    live.current = next;
    const e = el();
    if (changed) {
      // Held until React renders the new value; the layout effect below then places the caret.
      pendingCaret.current = next.start;
      onChange(next.value);
    }
    e?.setSelectionRange(next.start, next.end);
  };
  // Restore the caret after React re-renders the new value.
  useLayoutEffect(() => {
    const e = el();
    if (e && pendingCaret.current !== null) {
      e.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });
  return {
    op: (op: EditOp) => commit(applyEdit(state(), op)),
    complete: (w: string) => commit(completeWord(state(), w)),
    prefix: () => wordBefore(value, state().start),
  };
}

/** SQL editor for touch devices: code area + docked in-game keyboard with SQL keys and schema chips. */
export function TouchSqlEditor({ value, onChange, suggestions, onRun, runLabel = 'Run' }: {
  value: string; onChange: (v: string) => void; suggestions: string[]; onRun: () => void; runLabel?: string;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const ed = useEditable(value, onChange, () => ta.current);

  return (
    <div className="absolute inset-0 flex flex-col">
      <textarea
        ref={ta}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onSelect={() => force((n) => n + 1)}
        inputMode="none"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="SQL query"
        className="flex-1 w-full resize-none bg-[#1E1E1E] text-[#D4D4D4] font-mono text-[13px] leading-relaxed p-3 outline-none caret-bgap-cyan"
      />
      {!open && (
        <button onClick={() => { setOpen(true); ta.current?.focus(); }} className="absolute right-3 bottom-3 px-3 py-1.5 rounded-lg bg-bgap-cyan text-white text-xs font-bold shadow">
          ⌨ Keyboard
        </button>
      )}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-[70] pointer-events-auto">
          <GameKeyboard
            mode="sql"
            onOp={ed.op}
            onComplete={ed.complete}
            prefix={ed.prefix()}
            suggestions={suggestions}
            onHide={() => { setOpen(false); ta.current?.blur(); }}
            actions={
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); onRun(); }}
                className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[12px] font-bold"
              >
                {runLabel}
              </button>
            }
          />
        </div>,
        document.body,
      )}
      {/* Room so the last lines can scroll above the docked keyboard. */}
      {open && <div className="h-[46vh] [@media(max-height:420px)]:h-[58vh] shrink-0" />}
    </div>
  );
}

/** One-line text field (e.g. the cadet's name) that uses the in-game keyboard on touch devices. */
export function TouchTextInput({ value, onChange, placeholder, maxLength, className, after }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; className?: string; after?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const ed = useEditable(value, (v) => onChange(maxLength ? v.slice(0, maxLength) : v), () => input.current);
  return (
    <>
      <input
        ref={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        inputMode="none"
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
      />
      {after}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-[80] pointer-events-auto">
          <GameKeyboard mode="text" preview={value} placeholder={placeholder} onOp={(op) => (op.type === 'newline' ? (setOpen(false), input.current?.blur()) : ed.op(op))} onHide={() => { setOpen(false); input.current?.blur(); }} onEnter={() => { setOpen(false); input.current?.blur(); }} />
        </div>,
        document.body,
      )}
    </>
  );
}
