// Pure text-editing operations for the in-game keyboard (no DOM), so they're unit-testable.

export interface EditState { value: string; start: number; end: number }

export type EditOp =
  | { type: 'insert'; text: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'move'; dir: 'left' | 'right' | 'up' | 'down' | 'home' | 'end' }
  | { type: 'newline' };

const lineStart = (v: string, i: number) => v.lastIndexOf('\n', i - 1) + 1;
const lineEnd = (v: string, i: number) => { const n = v.indexOf('\n', i); return n === -1 ? v.length : n; };

/** Applies one keyboard operation; returns the new text and a collapsed caret position. */
export function applyEdit(s: EditState, op: EditOp): EditState {
  const { value: v } = s;
  const start = Math.max(0, Math.min(s.start, v.length));
  const end = Math.max(start, Math.min(s.end, v.length));
  const put = (text: string, from: number, to: number): EditState => {
    const value = v.slice(0, from) + text + v.slice(to);
    const caret = from + text.length;
    return { value, start: caret, end: caret };
  };
  switch (op.type) {
    case 'insert': {
      // A function key like "COUNT(" gets its closing paren for free, caret left between them.
      if (/\($/.test(op.text) && op.text.length > 1) {
        const r = put(op.text + ')', start, end);
        return { ...r, start: r.start - 1, end: r.end - 1 };
      }
      return put(op.text, start, end);
    }
    case 'newline': {
      // Keep the current line's indentation.
      const indent = /^[ \t]*/.exec(v.slice(lineStart(v, start), start))?.[0] ?? '';
      return put('\n' + indent, start, end);
    }
    case 'backspace':
      if (start !== end) return put('', start, end);
      if (start === 0) return { value: v, start: 0, end: 0 };
      // Deleting an opening paren right before its empty closing pair removes both.
      if (v[start - 1] === '(' && v[start] === ')') return put('', start - 1, start + 1);
      return put('', start - 1, start);
    case 'delete':
      if (start !== end) return put('', start, end);
      return put('', start, Math.min(v.length, start + 1));
    case 'move': {
      let c = start;
      if (op.dir === 'left') c = start !== end ? start : Math.max(0, start - 1);
      else if (op.dir === 'right') c = start !== end ? end : Math.min(v.length, end + 1);
      else if (op.dir === 'home') c = lineStart(v, start);
      else if (op.dir === 'end') c = lineEnd(v, end);
      else {
        const col = start - lineStart(v, start);
        if (op.dir === 'up') {
          const ls = lineStart(v, start);
          if (ls === 0) c = 0;
          else { const prevStart = lineStart(v, ls - 1); c = Math.min(prevStart + col, ls - 1); }
        } else {
          const le = lineEnd(v, start);
          if (le === v.length) c = v.length;
          else { const nextStart = le + 1; c = Math.min(nextStart + col, lineEnd(v, nextStart)); }
        }
      }
      return { value: v, start: c, end: c };
    }
  }
}

/** The word fragment just before the caret (for autocomplete chips). */
export function wordBefore(v: string, caret: number): string {
  return /[A-Za-z_][A-Za-z0-9_]*$/.exec(v.slice(0, caret))?.[0] ?? '';
}

/** Replaces the partial word before the caret with `word` (+ a trailing space unless it opens a call). */
export function completeWord(s: EditState, word: string): EditState {
  const frag = wordBefore(s.value, s.start);
  const from = s.start - frag.length;
  const text = /\($/.test(word) ? word : word + ' ';
  return applyEdit({ value: s.value, start: from, end: s.end }, { type: 'insert', text });
}
