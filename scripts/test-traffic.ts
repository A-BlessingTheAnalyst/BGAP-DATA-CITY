// Phase C acceptance tests: traffic-light phasing and the driver block-reaction state machine
// timings (masterprompt §11 Phase C: stop → horn ~1.5s → shout ~4s → push ~9s).  Run: npm run test:traffic
import { signalPhase, signalBrakeFactor, isBlockedByPlayer, stepBlockState, lampColour, LIGHT_TIMING, type BlockState } from '../src/features/game/world/kit/trafficLogic';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}`);
  if (!ok) failures++;
};

function main() {
  console.log('Traffic lights');
  check(signalPhase(0, 'z') === 'green', 'z-axis roads start green');
  check(signalPhase(0, 'x') === 'red', 'x-axis roads start red while z is green');
  check(signalPhase(LIGHT_TIMING.green + 0.5, 'z') === 'yellow', 'z-axis goes yellow right after its green window');
  check(signalPhase(LIGHT_TIMING.green + LIGHT_TIMING.yellow + 0.5, 'z') === 'red', 'z-axis is red once x-axis gets its turn');
  check(signalPhase(LIGHT_TIMING.green + LIGHT_TIMING.yellow + 0.5, 'x') === 'green', 'x-axis goes green exactly when z-axis goes red');
  // The two axes must never both show green (that would be a real intersection collision).
  let bothGreen = false;
  for (let t = 0; t < 200; t += 0.25) if (signalPhase(t, 'z') === 'green' && signalPhase(t, 'x') === 'green') bothGreen = true;
  check(!bothGreen, 'z and x axes are never green at the same time');
  check(signalPhase(-1, 'z') === signalPhase(-1 + 1000 * (LIGHT_TIMING.green + LIGHT_TIMING.yellow) * 2, 'z'), 'the phase is periodic (negative time handled)');

  console.log('Signal braking');
  check(signalBrakeFactor('green', 8) === 1, 'green never brakes');
  check(signalBrakeFactor('red', -2) === 1, 'already past the stop line: never clamp (avoids stalling mid-junction)');
  check(signalBrakeFactor('red', 1.2) < 0.05, 'red right at the stop line is almost stopped');
  check(signalBrakeFactor('red', 12) > 0.9, 'red far away barely slows you yet');
  check(signalBrakeFactor('yellow', 2) === 1, 'yellow too close to stop: goes through rather than slamming on');
  check(signalBrakeFactor('yellow', 9) < 1, 'yellow with room to spare still eases off');

  console.log('Blocked-by-player detection');
  check(isBlockedByPlayer(0, 0, 0, 1, 0, 3) === true, 'player standing ahead in the lane blocks the car');
  check(isBlockedByPlayer(0, 0, 0, 1, 0, -3) === false, 'player behind the car does not block it');
  check(isBlockedByPlayer(0, 0, 0, 1, 5, 3) === false, 'player far off to the side does not block it');
  check(isBlockedByPlayer(0, 0, 0, 1, 0, 50) === false, 'player far down the road does not block it');

  console.log('Block-reaction state machine (stop → horn ~1.5s → shout ~4s → push ~9s)');
  let s: BlockState = { phase: 'none', timer: 0 };
  s = stepBlockState(s, true, 0.1);
  check(s.phase === 'brake', 'blocking starts in brake, before any threshold');
  // Step forward in small increments to the horn threshold.
  for (let i = 0; i < 13; i++) s = stepBlockState(s, true, 0.1); // ~1.4s total
  check(s.phase === 'brake', 'still braking just under 1.5s');
  s = stepBlockState(s, true, 0.2); // crosses 1.5s
  check(s.phase === 'horn', 'horn kicks in at ~1.5s');
  while (s.timer < 3.9) s = stepBlockState(s, true, 0.1);
  check(s.phase === 'horn', 'still honking just under 4s');
  s = stepBlockState(s, true, 0.2);
  check(s.phase === 'shout', 'shouting kicks in at ~4s');
  while (s.timer < 8.9) s = stepBlockState(s, true, 0.1);
  check(s.phase === 'shout', 'still shouting just under 9s');
  s = stepBlockState(s, true, 0.2);
  check(s.phase === 'push', 'push kicks in at ~9s');
  s = stepBlockState(s, false, 0.1);
  check(s.phase === 'none' && s.timer === 0, 'the player moving away resets the state instantly (a "thank you" moment)');

  console.log('Phase G: colour-blind-safe traffic lights');
  check(lampColour('green', false) !== lampColour('green', true), 'the safe palette actually changes the green lamp');
  check(lampColour('red', false) !== lampColour('red', true), 'the safe palette actually changes the red lamp');
  check(lampColour('yellow', false) === lampColour('yellow', true), 'yellow is already colour-blind-safe and stays the same');
  check(lampColour('green', true) !== lampColour('red', true), 'go and stop are always two different colours, safe mode or not');

  console.log('Barks content');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { checkBarks, barks } = require('../src/server/content/barks');
  check(checkBarks(barks()).length === 0, 'content/barks.json is valid');
  check(checkBarks([]).length > 0, 'an empty bark list is caught (every situation needs a line)');

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll traffic checks passed');
  process.exit(failures ? 1 : 0);
}

main();
