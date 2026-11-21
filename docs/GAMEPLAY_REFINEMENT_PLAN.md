# Data City — Gameplay & Mobile Refinement Plan

*21 November 2026. Follows on from `PROJECT_STATUS.md` §3.5 ("needs an actual look in a working browser") and the owner's feedback in this round:
walkers that look like they walk but don't move, driving that is slow and doesn't really drive, a HUD that covers the screen and can't be turned off,
weak mobile layout, no landscape enforcement, and the phone's own keyboard popping up for SQL.*

---

## 0. What was found (root causes, not symptoms)

| Complaint | Root cause in the code |
|---|---|
| **Walkers "walk but don't walk"** | `streetLife.tsx` plays `Walk_Loop` for every crowd agent at all times; when a Detour agent stalls (crowding, unreachable target on a fragmented sidewalk net, re-target thrash) its speed drops to ~0 but the clip keeps playing at a 0.2× floor, so they march in place. Nobody ever stops, idles, chats or looks at a phone, so the crowd has no "activeness". No stuck detection. Facing snaps instantly, so slow agents jitter. |
| **Driving is slow** | Top speed is multiplied by **0.6 unless Shift is held** (both `DrivableCar.tsx` and the jacked-traffic path in `streetLife.tsx`). A jacked car cruises at 5.4 m/s (19 km/h), slower than many ambient cars and barely faster than sprinting (7 m/s). Acceleration is a flat 6 m/s² with no gears/drag curve. |
| **Driving "doesn't actually drive"** | (1) The collision check `|m.x| < |dx|·0.4 \|\| |m.z| < |dz|·0.4` tests each axis separately, so a tiny rounding difference on the *minor* axis (driving almost straight along x) reads as a crash and cuts speed by 70% **every frame**. (2) Steering is a constant yaw rate, not a car (no wheelbase, no speed-sensitive steering, no handbrake). (3) The camera never swings behind the car, so "left" on screen and "left" for the car drift apart. (4) On phones the joystick writes analog `axisX/axisZ`, which the vehicle code never reads, so **mobile can't drive at all**. (5) Owned cars are pinned to `y = h/2` after moving, floating them ~0.8 m off the road. |
| **HUD covers the screen** | Minimap + profile card + always-expanded mission tracker (up to 320 px wide) + bouncing prompt + key-hint text, none of which can be hidden. |
| **Mobile layout** | Touch controls use `md:hidden` → hidden on any phone in landscape (≥768 px wide). No safe-area insets, no short-viewport sizing, no driving controls. |
| **No landscape** | Nothing checks orientation. |
| **Phone keyboard for SQL** | Monaco editor opens the OS keyboard, which covers half the screen and has no SQL keys. |

---

## 1. Workstreams

### A. Real driving (vehicle dynamics)
- New pure module `world/vehicleDynamics.ts`: arcade **bicycle model** — speed-dependent steering angle, turn rate = v·tan(δ)/wheelbase, throttle/brake/reverse distinct, engine braking, rolling + aero drag, handbrake (strong decel + extra yaw for slides). Per-vehicle profiles (okada, keke, hatchback, sedan, SUV, van/danfo…).
- Speeds tuned to the city: ~80 km/h sedans, ~70 km/h okada, ~45 km/h keke; 0→60 km/h in ~4–6 s. **Shift = boost**, not "allowed to go fast".
- One shared stepper used by **both** owned cars and jacked traffic. Collision uses swept-length ratio (fixes the false "crash" bug) and scrapes speed proportional to how much of the move was blocked.
- Owned cars stay on the road surface (no floating).
- **Chase camera** while driving: auto-aligns behind the car after you let go of the camera, pulls back and lifts with speed, widens FOV slightly at speed.
- Small **speedometer** (km/h) while driving.
- Smooth analog input: keyboard steering ramps in/out instead of snapping.
- **Touch driving**: steering via the left stick (x axis), right-hand gas/brake pedals + handbrake.
- Unit test `scripts/test-driving.ts` (acceleration time, top speed, braking distance, turning radius, collision-ratio bug).

### B. Living pedestrians
- Per-walker behaviour state machine: **walk → pause (idle / phone / chat) → walk**; ~35% of arrivals pause for 2–7 s, chatting pairs face each other.
- Animation follows *real* movement: below ~0.25 m/s a walker plays an idle clip instead of a slow-motion walk; walk clip rate matched to ground speed.
- **Stuck detection**: walking agents that moved < 0.4 m in 2.5 s get a new reachable target.
- Smoothed facing (no snap/jitter), varied walking speeds, slightly bigger crowd (22 → 30) around the player.
- `CharacterModel` gains an imperative `actionRef` so 30 walkers can switch clips without React re-renders.

### C. Clean HUD
- Default HUD = **minimap + a compact wallet/rank chip + menu**. Everything else is on demand.
- Mission tracker collapses to a one-line pill showing the *next* objective; tap/click to expand.
- **H toggles the HUD** (map always stays); settings toggles for mission tracker and control hints.
- Key-hint text removed from the HUD; replaced by short, one-time **guidance toasts** (e.g. on first drive: "W/S gas & brake · A/D steer · Space handbrake · E exit") that auto-dismiss.
- Interaction prompt: compact, no bouncing.

### D. Mobile & orientation
- `useIsTouch()` (pointer: coarse) replaces `md:hidden` so touch controls show on phones in landscape.
- **Rotate-to-landscape gate** for touch devices in portrait once in the city: full-screen prompt with "Go fullscreen & rotate" (Fullscreen API + `screen.orientation.lock('landscape')` where supported, e.g. Android Chrome); iOS shows the rotate instruction. The character creator and menus still work in portrait.
- Landscape-phone sizing: smaller minimap on short viewports, safe-area insets, controls sized for thumbs, nothing in the screen centre.
- Separate on-foot vs driving touch layouts.

### E. In-game keyboard (touch only)
- `GameKeyboard`: full in-game keyboard rendered by the game — letters (shift/caps), numbers & symbols layer, **SQL quick-keys row** (SELECT, FROM, WHERE, GROUP BY, ORDER BY, COUNT(, SUM(, AVG(, JOIN, ON, AS, LIMIT, DESC…), **schema chips** (the case's table & column names), caret arrows, hold-to-repeat backspace, Run.
- On touch devices the SQL terminal uses a lightweight code area with `inputmode="none"` (the OS keyboard never opens) driven by `GameKeyboard`; desktop keeps Monaco + the physical keyboard.
- Cadet name entry uses the same keyboard on touch.

### F. Verification
- `npm run type-check`, existing test suites + `test:driving`.
- Live in the preview browser: frame rate, pedestrian ground speed vs animation, drive a jacked car, HUD toggle, mobile viewport (375×812 portrait → rotate gate; 812×375 landscape → touch controls + keyboard).

---

## 2. Later (not in this pass)
- Proper wheel meshes that spin/steer on the procedural vehicles; body roll/pitch.
- Ambient traffic yielding at junctions to the player car; pedestrians using crossings on signal.
- Haptics (`navigator.vibrate`) on collisions for Android.
- The backend items in `PROJECT_STATUS.md` §3.1–3.3 (note: in dev, saving a profile currently fails with `player_profiles_user_id_fkey` because the dev mock user has no row in `auth.users`).
