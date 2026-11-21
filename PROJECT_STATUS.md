# BGAP Data City — Status & Roadmap

*Written 21 November 2026. Companion to `masterprompt.md` (the detailed, line-by-line working log) — this is the readable summary: what's done, what's half-done, and what's genuinely still needed before this is a finished product.*

---

## 1. What this project is

Data City is a 3D, open-world "analyst career simulator" — the player walks/drives around a virtual Lagos-flavoured city, meets business owners with real data problems, and solves them with SQL (and soon Python and spreadsheets) in a real DuckDB-backed grading engine. It's meant to be BGAP's game-based learning arm, sharing BGAP's own login, database and brand — not a standalone side project.

---

## 2. What's been achieved

### Core game (built over several earlier phases)
- A full 3D city (6 districts: Market Boulevard, Academy Quarter, Finance Row, Tech Park, Ilé Gardens, City Gateway) with roads, traffic, pedestrians, buildings, and a day cycle.
- A real analyst workflow: an in-game SQL terminal running DuckDB (both server-side for grading and in-browser via WASM), hidden grading fixtures that can't be gamed by `SELECT *`, hints, findings/claims, pay and XP.
- Character creation and a wardrobe/tailoring shop.
- A driving/flying system: buy a car or chopper from a dealership, or (as of this pass) jack an ambient street vehicle.
- A reputation/rank system per district (Cadet → Partner), gating harder cases.
- A DataPhone UI (missions, garage, wallet, profile), a minimap and full city map, a mission tracker HUD.
- Accessibility settings (reduced motion, large text, colour-blind-safe traffic lights).

### Fixed in the two most recent feedback rounds
- **Car jacking** now actually works — it was blocked behind a ₦200,000 licence a fresh account could never afford, which made it look completely broken. Jacking an ambient vehicle is now free (an informal quick ride); only owning a car from the dealership still needs the licence.
- **Drivers are now visible** in every vehicle — ambient traffic and the player's own car both show a seated figure, not an empty shell.
- **The "standing inside the car" look was fixed** — the driver now has an actual seated pose instead of a standing figure floating at the wrong height.
- **The background audio was replaced** — it used to be dominated by synthesized noise beds that read as "white noise." There's now a soft instrumental chord-pad as the main background layer, with the noise kept only as a quiet, much-reduced road/crowd texture underneath. Horns, engines and footsteps are untouched.
- **The whole UI was re-themed from dark to light**, matching bgap-academy's own palette (cream background, dark text, BGAP blue), including fixing a couple of screens that would have gone text-on-text invisible from a blind palette swap.
- **A shared footer** (`BGAPFooter`) was added, matching bgap-academy's own footer's layout and copy, with links pointing at the real bgap.app pages instead of 404ing on routes Data City doesn't have.
- **5 new missions were added**, one for each of the 4 districts that had zero content (Academy, Finance Row, Tech Park, Gateway), plus a first Python mission. Every one follows the same "naive metric vs. the correct one" trap pattern the original missions use (e.g. raw count vs. true rate, total volume vs. real profit margin).
- **A real backend/database connection was made**: this repo is now wired to BGAP's own live Supabase project (same login system, same underlying database bgap-academy uses), not a toy local file store. A genuine security bug was found and fixed in the process — the server was accepting almost any token as a valid login before this pass.
- **A Python sandbox and grader were built from scratch**, mirroring the SQL one's rigor: player code and a reference solution both run against hidden test data, and the *results* are compared, not the code text. Verified with its own automated test suite.
- One real bug was caught and fixed by briefly getting the game running live in a browser: the "no one's logged in yet" placeholder account wasn't a valid database ID format, which broke every data-reading screen the instant the real database was connected.

---

## 3. What still needs to be done

### 3.1 Backend — needs finishing, not just wiring
The connection to BGAP's real backend exists now, but it's half of a login system, not a whole one:
- **No real sign-in flow yet.** Right now the game either reads a real BGAP session token (if one is somehow passed to it) or falls back to a fake placeholder player. There is no actual "log in with your BGAP account" screen, and no decision yet on *how* a player gets from bgap.app into Data City — a link from inside the dashboard? Its own login page? An embedded frame? This has to be decided before the backend connection is worth anything in practice.
- **No execution-time safety limit on Python code.** A player submitting an infinite loop would hang the server's grading process. SQL already has this protection (DuckDB can forcibly cancel a stuck query); Python doesn't yet. This needs building before any Python mission goes in front of real players.
- **No Python code editor in the game itself.** The sandbox/grader exist on the server, but there's no in-game screen yet where a player actually writes and submits Python — that UI doesn't exist.

### 3.2 Database — the tables themselves don't exist yet
The game's own tables (wallet ledger, saved profiles, garage/vehicle ownership, mission attempts) have been designed and written as ready-to-run database scripts, but **they have never actually been created in the live database.** Until that one-time setup step runs, every screen that needs to read or write player data will fail. This is a five-minute task (paste one prepared file into Supabase's own SQL tool and run it) but it hasn't happened yet.

Also still to decide: exactly which BGAP account fields Data City needs to read (role, plan, organisation) and whether anything needs adding to BGAP's own user table, or whether Data City's new tables are fully self-contained.

### 3.3 Connecting to workspace.bgap.app (the real Excel/spreadsheet tool)
BGAP already has a full, separate Excel-replica web app — ribbon toolbar, 100+ real formulas, chart building, its own grading — and it's meant to live at its own address, `workspace.bgap.app`, deliberately kept separate from the main BGAP site (confirmed from BGAP's own project history: it was explicitly split out "to external workspace.bgap.app").

This is **not built or connected yet.** The plan is to link out to it rather than rebuild it inside Data City: a spreadsheet-skill mission's workstation would open `workspace.bgap.app` directly (in a new tab, or embedded) with that mission's dataset and challenge passed along, instead of trying to cram the whole Excel engine into the game. This keeps one spreadsheet tool instead of building and maintaining two. None of this has been wired up — it's a clear next task, not started.

### 3.4 More tasks and scenarios — the content is still thin
Right now there are 10 missions total across 6 districts. That's enough to prove every system works, but nowhere near enough to feel like a real city full of work:
- Every district needs harder, second- and third-tier cases, not just one starter case each.
- There's no overarching story yet connecting cases together — each one is still a standalone, one-off client. A few recurring characters or a season-long thread would make this feel like a career, not a quiz machine.
- Tier-3 (the hardest) cases don't exist anywhere yet — the reputation system that's supposed to unlock them has nothing to actually unlock.
- Only one Python mission and zero spreadsheet missions exist so far; both skill tracks need real content once their tools are finished (3.1 and 3.3 above).

### 3.5 Needs an actual look in a working browser
This is the thing underneath almost everything else on this list: for nearly this entire project, the tool used to preview the game has been stuck unable to actually render it at normal speed, so a huge amount of recent work — the new light theme, the new missions' in-world placement, the fixed driver poses, the new audio — has been built and logic-checked but **never actually looked at running.** One short live session near the end of this work caught and fixed a real bug in minutes that no amount of code-reading would have found. A proper walkthrough — ideally on a different device/screen than whatever's been used for development — is overdue and should happen before trusting any of the visual work above.

### 3.6 Smaller known loose ends
- The minimap/full map was reported as feeling like it rotates the wrong way when turning. It's been checked twice on paper and the formulas look correct both times — this is exactly the kind of thing that needs to be watched live, not re-derived with algebra a third time.
- A handful of mission "achievement" badges were silently not working because of a missing registration — this is now fixed, but worth knowing it existed.

---

## 4. Suggested order of attack

1. **Watch the game run, live, properly** — this unblocks confidently trusting everything else.
2. **Run the one-time database setup** so the backend connection is actually usable.
3. **Decide and build the real login flow** between bgap.app and Data City.
4. **Connect to workspace.bgap.app** for spreadsheet work (link-out approach).
5. **Add Python's safety limit and its in-game editor**, then write real Python missions.
6. **Build out more missions/scenarios** per district, and start threading a few of them into an actual storyline.
