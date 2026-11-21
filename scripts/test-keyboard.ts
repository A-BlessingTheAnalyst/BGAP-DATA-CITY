// The in-game keyboard's text operations (src/features/game/ui/keyboard/textEdit.ts).
import { applyEdit, completeWord, wordBefore } from '../src/features/game/ui/keyboard/textEdit';

let failures = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
  if (!ok) failures++;
};

eq('insert at caret', applyEdit({ value: 'SELCT', start: 3, end: 3 }, { type: 'insert', text: 'E' }), { value: 'SELECT', start: 4, end: 4 });
eq('insert replaces selection', applyEdit({ value: 'SELECT x FROM t', start: 7, end: 8 }, { type: 'insert', text: '*' }), { value: 'SELECT * FROM t', start: 8, end: 8 });
eq('function key closes its paren', applyEdit({ value: 'SELECT ', start: 7, end: 7 }, { type: 'insert', text: 'COUNT(' }), { value: 'SELECT COUNT()', start: 13, end: 13 });
eq('backspace', applyEdit({ value: 'abc', start: 3, end: 3 }, { type: 'backspace' }), { value: 'ab', start: 2, end: 2 });
eq('backspace at start is a no-op', applyEdit({ value: 'abc', start: 0, end: 0 }, { type: 'backspace' }), { value: 'abc', start: 0, end: 0 });
eq('backspace eats an empty () pair', applyEdit({ value: 'SUM()', start: 4, end: 4 }, { type: 'backspace' }), { value: 'SUM', start: 3, end: 3 });
eq('newline keeps indent', applyEdit({ value: '  SELECT', start: 8, end: 8 }, { type: 'newline' }), { value: '  SELECT\n  ', start: 11, end: 11 });
eq('caret up keeps column', applyEdit({ value: 'abcdef\nxyz', start: 9, end: 9 }, { type: 'move', dir: 'up' }), { value: 'abcdef\nxyz', start: 2, end: 2 });
eq('caret down clamps to line end', applyEdit({ value: 'abcdef\nxy', start: 5, end: 5 }, { type: 'move', dir: 'down' }), { value: 'abcdef\nxy', start: 9, end: 9 });
eq('caret left collapses selection', applyEdit({ value: 'abc', start: 1, end: 3 }, { type: 'move', dir: 'left' }), { value: 'abc', start: 1, end: 1 });
eq('word before caret', wordBefore('SELECT cust', 11), 'cust');
eq('complete a column name', completeWord({ value: 'SELECT cust', start: 11, end: 11 }, 'customer_id'), { value: 'SELECT customer_id ', start: 19, end: 19 });
eq('complete a function', completeWord({ value: 'SELECT su', start: 9, end: 9 }, 'SUM('), { value: 'SELECT SUM()', start: 11, end: 11 });

if (failures) { console.error(`\n${failures} keyboard check(s) failed`); process.exit(1); }
console.log('\nAll keyboard checks passed');
