// Phase H (owner feedback 19 Nov 2026, masterprompt.md §15.4): the Python sandbox/grader
// foundation. Run: npm run test:python
// This exercises PythonSandboxRunner + PythonGrader directly against synthetic fixtures (not
// real mission content — tier1_log_parsing is covered by validate:missions instead), so it stays
// fast and focused on the grading mechanism itself: globals injection, result comparison, the
// static safety guard, and error handling.

import { gradePython } from '../src/server/assessment/PythonGrader';
import { PythonSandboxRunner } from '../src/server/assessment/PythonSandboxRunner';
import type { PyCaseFixtures } from '../src/server/assessment/fixtures/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failures++;
};

const CASE: PyCaseFixtures = {
  missionId: 'test-python',
  referencePython: `
total = sum(row['amount'] for row in sales)
result = total
`,
  trapFixtureId: 'negative-amounts',
  fixtures: [
    { id: 'sample', purpose: 'basic sum', failHint: 'Sum every row\'s amount.', tables: { sales: [{ amount: 10 }, { amount: 20 }, { amount: 5 }] } },
    { id: 'negative-amounts', purpose: 'refunds as negative rows', failHint: 'Don\'t skip negative amounts — they\'re refunds and must be subtracted.', tables: { sales: [{ amount: 50 }, { amount: -10 }, { amount: 30 }] } },
    { id: 'floats', purpose: 'float totals', failHint: 'Watch for float rounding.', tables: { sales: [{ amount: 1.1 }, { amount: 2.2 }] } },
  ],
};

async function main() {
  console.log('Static safety guard (PythonSandboxRunner)');
  check((() => { try { PythonSandboxRunner.enforceConstraints('result = 1'); return true; } catch { return false; } })(), 'ordinary code passes');
  check((() => { try { PythonSandboxRunner.enforceConstraints('import os\nresult = 1'); return false; } catch { return true; } })(), '"import os" is blocked');
  check((() => { try { PythonSandboxRunner.enforceConstraints('eval("1")'); return false; } catch { return true; } })(), '"eval(" is blocked');
  check((() => { try { PythonSandboxRunner.enforceConstraints('x = ().__class__.__bases__'); return false; } catch { return true; } })(), '__class__/__bases__ introspection is blocked');
  check((() => { try { PythonSandboxRunner.enforceConstraints('# import os is just a comment\nresult = 1'); return true; } catch { return false; } })(), '"import os" inside a comment is NOT a false positive');
  check((() => { try { PythonSandboxRunner.enforceConstraints(''); return false; } catch { return true; } })(), 'empty code is rejected');

  console.log('Grading (PythonGrader, against synthetic fixtures)');
  const correct = await gradePython('test-python', `result = sum(row['amount'] for row in sales)`, CASE);
  check(correct.passRate === 1, 'a correct solution passes every fixture');
  check(correct.trapPassed, 'a correct solution passes the trap fixture');

  const wrong = await gradePython('test-python', `result = sum(row['amount'] for row in sales if row['amount'] > 0)`, CASE);
  check(wrong.passRate < 1, 'a wrong solution (skips negative amounts) fails somewhere');
  check(!wrong.trapPassed, 'the wrong solution specifically fails the trap fixture');

  const broken = await gradePython('test-python', `result = 1 / 0`, CASE);
  check(broken.passRate === 0, 'code that raises an exception fails every fixture, not a crash');
  check(broken.fixtures.every((f) => !!f.error), 'each failed fixture carries an error message');

  const noResult = await gradePython('test-python', `total = sum(row['amount'] for row in sales)`, CASE);
  check(noResult.passRate === 0, 'code that never sets `result` fails clearly, not silently');

  const unsafe = await gradePython('test-python', `import os\nresult = 1`, CASE);
  check(unsafe.passRate === 0 && !!unsafe.codeError, 'unsafe code is rejected before it ever runs, not executed and then scored');

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll Python sandbox checks passed');
  process.exit(failures ? 1 : 0);
}

main();
