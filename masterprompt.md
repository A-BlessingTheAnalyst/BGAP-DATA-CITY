# Data City: Master Prompt

> **What this file is.** The complete working context for Data City: what the game is, how the code is organised, every route, how to run and test it, what is done, what is broken, and every remaining phase with concrete next steps.
>
> Hand this file to any developer or AI assistant picking up the project. Read it top to bottom before changing anything, and **update it whenever a phase lands**.
>
> *Last updated: 19 November 2026, second pass (§15: full breakdown of the owner's second feedback round — jacking's licence paywall removed, driver pose fixed to actually sit, background noise beds replaced with a synthesised instrumental pad; missions/storyline, backend+database, Python sandbox, Excel workspace and the light-theme/shared-footer redesign are all scoped in §15 but not started — §15.3 backend/database needs the owner's sign-off before any of it touches real credentials) · branch `feat/world-kit` · last pushed commit `322049f` (uncommitted local changes on top).*

---

## 0. Instructions for whoever picks this up

1. **Respect the owner's standing rules (section 1)**, especially: do not push to the remote until the owner asks.
2. **Run the game and the checks first** (section 4) so you see the current state.
3. **Work phase by phase** (section 11). Phases A–G all have at least a first pass done (some partial/scoped down — read each phase's own notes). **Section 12 and §15 are current work**: two rounds of owner live-play feedback. §12.1–12.4 and §15.1 are all coded, type-checked, tested and built clean, but **none of it is live-verified yet** (the Browser pane was backgrounded all of 19 Nov's sessions) — that's the top of §13, start there. §12.5 (map rotation) hasn't been touched. §15.2–§15.6 are a full breakdown + plan for missions/storyline, a real shared backend+database, a Python sandbox, the Excel workspace and a light-theme/shared-footer redesign — none of that is started; §15.3 (backend/database) needs the owner's sign-off on two architecture questions before any code lands, since it's a real shared production system.
4. **Keep data analysis at the centre.** Every feature must serve the four pillars (section 2). Money only comes from graded analysis.
5. **After each phase, and after each item in section 12:**
   - run `npm run type-check`, `npm run build`, `npm run test:grader`, `npm run validate:missions` and `npm run validate:layout`;
   - play the change in the browser, **watched live** — section 12.5 is a cautionary tale about trusting pure code-reading or algebra over actually seeing it happen;
   - update section 10 (status), section 11 (phases) and section 12 (owner feedback) of this file.
6. **Design references:**
   - `docs/game-design.md` and its published page, Data City Game Design: https://claude.ai/artifact/NxbRmsRypEErfMBG7eWj6s
   - Engineering roadmap: `docs/roadmap.html`, published as Data City Roadmap: https://claude.ai/artifact/CeVJapsGWz1PYLyp4yeqCd
   - Both pages are private to the owner until they are shared.

---

## 1. Owner's standing rules and preferences

| Rule | Detail |
|---|---|
| **No pushing** | Never `git push` until the owner explicitly asks. Committing is also only on request. |
| **Free assets only** | Third-party assets must be **CC0 or CC-BY**, recorded in `assets/manifest.json` and credited in `CREDITS.md`. Never Synty, Fab Standard, Mixamo raw files, Textures.com or BlenderKit RF. |
| **Original IP** | All companies, brands, characters and logos are fictional. Lagos flavour, no real brands, no real-game recreation. |
| **Web first** | Next.js + React Three Fiber in the browser. The old Unity / SanAndreasUnity track is abandoned and was never shippable (it needs GTA files). |
| **Tone guardrails** | No weapons, violence, crime loops, gambling, loot boxes or real-money purchases. Conflict is social (shouting, pushing, fines). |
| **Server-authoritative money** | The client never grants money. Pay is written only by the grader route, through an idempotent ledger. |
| **Skills scope** | All five skill tracks will ship: SQL → Spreadsheets → Charts & dashboards → Statistics & A/B → Python. |
| **First build order** | Phase A (analysis loop and money) first, then the remaining phases in order. |

---

## 2. The game

**Pitch.** *Get hired, find the story in the numbers, and climb from a buka's receipt book to a boardroom. Every naira you spend in the city, you earned by analysing data.*

**What it is.** A third-person, open-city web game set in an original, fictional Lagos-like West African city ("Data City").
- You play a BGAP Academy cadet who takes paid data-analysis jobs from businesses: cafés, kiosks, fabric shops, then banks, telecoms and the state.
- Your money buys attire (corporate and traditional), cars, licences and eventually planes and choppers.
- The street reacts to you: drivers honk, shout and push; crowds comment.

**Pillars**
1. **Analysis is the engine.** Money, reputation, access and story come from solving data problems.
2. **The city answers back.** Businesses change after you help them; people react to what you do.
3. **Your hustle, your style.** You choose your look, ride, employers and path.
4. **Readable and fair.** Real SQL is graded on hidden data, with explanations.

**Core loop:** DataPhone job board → travel → meet client → field evidence → workstation analysis → present findings → paid + reputation → spend.

**Meta loop:** reputation → bigger employers and tiers → attire, cars, office → new districts → licences (driving, flight) → story chapters.

**Tiers**

| Tier | Clients | Skills | Pay (₦) |
|---|---|---|---|
| 1 Street | Buka, kiosk, tailor, POS stand | SELECT, WHERE, SUM/COUNT, GROUP BY | 5k–20k |
| 2 SME | Pharmacy, school, keke fleet | JOINs, dates, CASE, cleaning, spreadsheets | 30k–120k |
| 3 Mid company | Okeke Foods, Kora Logistics | Window functions, cohorts, KPIs, dashboards | 200k–800k |
| 4 Corporate | Meridian Capital, Vantage, Lumen | Fraud, churn, forecasting, A/B | 1.5M–6M |
| 5 Board/state | Conglomerate, BRT authority | Strategy, board dashboard, memo | 10M+ |

**Case anatomy:** Brief → Field evidence → Workstation → Present findings (back each claim with evidence) → Consequence.

**Scoring:**

| Component | Weight | Measured by |
|---|---|---|
| Correctness | 50 | Fixture pass rate |
| Edge cases | 20 | The trap fixture |
| Findings | 20 | Share of claims answered correctly |
| Independence | 10 | −3 per hint |

- **Pass** = score ≥ the mission's pass mark **and** every fixture correct.
- **Pay:**
  - below 60 → 10% call-out fee;
  - otherwise base × (0.5–1.0) × 1.1 for a fast finish × (1 − 0.08 × hints).
- Only a pass is credited, **once per mission**.

**Twelve planned story cases** (full table in `docs/game-design.md` §3.5):

| Tier | Case | Status |
|---|---|---|
| T1 | Mama Bisi's café | Built |
| T1 | Baba Sola's POS kiosk | Built |
| T1 | Zee Fabrics | Built |
| T2 | Sunrise Primary fees | To build |
| T2 | Keke fleet fuel | To build |
| T2 | Grace Pharmacy expiry | To build |
| T3 | Kora Logistics late deliveries | To build |
| T3 | Okeke Foods price creep | To build |
| T4 | Lumen Telecom churn | To build |
| T4 | Meridian Capital defaults (Simpson's paradox) | To build |
| T4 | Vantage Insurance claim fraud | To build |
| T5 | BRT authority bus allocation | To build |

**Economy prices** (game-design §4) cover attire (casual 5k–30k; corporate 50k–600k; traditional 40k–900k), transport fares, driving school 200k, flight school 15M, used car 1.5M, keke 2.5M, SUV 12M, light plane 120M, chopper 500M, laptop 100k, co-working desk 1M and an own office 20M.

**Districts:**
- Academy Quarter (tutorial)
- Market Boulevard (T1, built)
- Finance Row (T4)
- Tech Park (T3–4)
- Ilé Gardens (residential, T2/T5)
- City Gateway
- Airfield (late)

**Story cast:**

| Character | Role | Where |
|---|---|---|
| Mama Bisi | Café owner | Market Boulevard |
| Officer Tunde | Academy guard and guide | Academy Quarter |
| Dr. Ifeoma Nwosu | Lecturer | Academy Quarter |
| Kemi Bello | Rival cadet | Everywhere |
| Baba Sola | POS kiosk owner | Market Boulevard |
| Aunty Zainab | Zee Fabrics owner | Market Boulevard |
| Chef Amaka | Café cook | Market Boulevard |
| Mr. Kunle Adeyemi | Meridian Capital branch manager | Finance Row |
| Chidi Okafor | Datacore engineer | Tech Park |

---

## 3. Tech stack (current versions)

| Layer | Package (version) | Notes |
|---|---|---|
| App | next 14.2, react 18.3, typescript 5.7, tailwind 3.4 | App Router |
| 3D | three 0.160, @react-three/fiber 8.18, @react-three/drei 9.122 | Frozen at the last R3F 8 / drei 9 releases |
| Physics | @react-three/rapier 1.5, @dimforge/rapier3d-compat 0.14 | Kinematic character controller; vehicle controller available |
| Post-FX | @react-three/postprocessing **2.19.1** + postprocessing **6.36.7** (pinned for three r160) | N8AO, Bloom, SMAA, ACES |
| Instancing | @three.ez/instanced-mesh 0.3.16 | InstancedMesh2 with BVH culling |
| AI | recast-navigation 0.44 + @recast-navigation/three (navmesh crowds), yuka 0.7.8 (steering) | |
| Audio | howler 2.2.4 | |
| State | zustand 5 | |
| SQL (browser) | @duckdb/duckdb-wasm 1.29 | Loaded from jsDelivr at runtime |
| SQL (server grader) | @duckdb/node-api 1.5.x | Native; externalised in `next.config.mjs` |
| Editor | @monaco-editor/react | |
| DB/auth | @supabase/supabase-js, @supabase/ssr | Not configured yet; placeholder env |
| Asset pipeline (dev) | @gltf-transform/* 4.5.1, meshoptimizer, sharp | `scripts/assets/optimize.mjs` |
| Scripts (dev) | tsx | Tests and validators |

**Planned stack upgrade (separate sprint):** Next 15/16 → React 19 → R3F 9 → drei 10 → three r18x → rapier 2.2 → postprocessing 3.
- It unlocks ecctrl 2 (character controller), Takram atmosphere, newer postprocessing and BVHEcctrl.
- Breaking changes: texture `colorSpace`, `ThreeElements` types, light intensities, async Next APIs.

---

## 4. How to run, build and test

```bash
npm install
npm run dev              # http://localhost:3000  (game at /game, Asset Lab at /game/kit)
npm run type-check       # tsc --noEmit
npm run build            # stop the dev server first; both use .next/
npm run test:grader      # grader acceptance tests (correct/wrong/unsafe queries, rubric, cases, gigs)
npm run validate:missions  # validates every mission package and today's gigs
npm run validate:layout    # city plan spatial integrity: overlaps, buildings on roads, blocked story points, lanes, GPS
node scripts/assets/optimize.mjs [packId…]   # re-optimise third-party packs into public/assets/kits
npx tsx scripts/content/build-tier1-cases.ts # regenerate Baba Sola + Zee Fabrics data (deterministic)
```

- **Launch config:** `.claude/launch.json` defines `data-city-dev` (`npm run dev`, port 3000).
- **First load** in dev takes about 15–35 s (compile + assets). A hidden browser pane throttles rendering to about 1 fps.

**Controls:**

| Input | Action |
|---|---|
| WASD / arrows | Move (default speed is a jog) |
| Shift | Sprint |
| Mouse drag | Orbit camera |
| Mouse wheel | Camera zoom |
| M | City map (click to drop a pin; click a client to track their job) |
| E | Interact / talk / open workstation |
| Tab | DataPhone |
| Esc | Close phone / map |

On mobile: joystick, Run and Interact buttons.

**Environment** (`.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. When real values are present the wallet switches from the file store to Supabase.
- `NEXT_PUBLIC_ENABLE_PHYSICS_DEBUG`
- Other BGAP integration vars.

---

## 5. Repository map

```
masterprompt.md            ← this file
CREDITS.md                 generated asset credits (do not hand-edit)
IMPLEMENTATION-PLAN.md     original audit plan (partly stale; superseded by this file)
README.md
assets/manifest.json       every third-party pack: source, licence, include globs, options
assets-src/                raw downloaded packs (gitignored): kenney/*, quaternius/*
content/missions/<id>/     mission packages (see §8)
db/schema.sql              original schema (profiles, missions, attempts, rubrics…)
db/migrations/0001_wallet_ledger.sql   wallet ledger + RLS
db/seeds/chapter1_cafe_seed.sql
docs/game-design.md|.html  game design document (+ published page)
docs/roadmap.html          engineering roadmap T01–T76 (+ published page)
public/assets/
  characters/              user's original Blender GLBs (analyst, guard, mama_bisi), now unused
  world/                   user's original Blender props, mostly unused now
  kits/                    optimised CC0 packs (Kenney, Quaternius), ~12 MB
  audio/{sfx,ui}/          Kenney CC0 footsteps and UI sounds
  hdri/partly_cloudy_1k.hdr  Poly Haven CC0
blender/                   user's .blend sources
scripts/
  assets/optimize.mjs      asset optimiser + CREDITS generator
  content/build-tier1-cases.ts   seeded data for the Tier 1 cases
  test-grader.ts           grader acceptance tests
  validate-missions.ts     mission validator (CI candidate)
  validate-layout.ts       city-plan spatial validator (CI candidate)
src/app/                   Next.js routes (see §6)
src/features/analysis/     SQL terminal: editor, schema, hints, results, DuckDB-Wasm hook
src/features/game/         3D game (see §7)
src/server/                server-only: grading, content loader, gigs, wallet, auth stubs
src/shared/                types and constants shared by client and server
```

**Untracked or ignored:** `/assets-src/`, `/.data/` (dev wallet file), `.next/`, `node_modules/`. The Unity folders (`unity/`, `DataCity_Core/`, `ThirdParty/`) are still tracked in git; removing them is roadmap T01 (not done).

---

## 6. Routes

### Pages

| Route | File | What it is |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page |
| `/game` | `src/app/game/page.tsx` → `GameClient` → `GameWorld` | **The game** (canvas + HUD + interactions) |
| `/game/kit` | `src/app/game/kit/page.tsx` → `KitShowroom` | **Asset Lab**: browse all kit assets, library models, characters; "Street scene" shows Market Boulevard |
| `/game/missions` | `src/app/game/missions/page.tsx` | Mission list page (**stale**: still uses hard-coded `CAFE_MISSION`) |
| `/game/profile` | `src/app/game/profile/page.tsx` | Profile page (static mock data) |
| `/admin/game` | `src/app/admin/game/page.tsx` | Admin page (mock stats, unprotected) |
| `/dashboard`, `/learn` | | Placeholder pages |

### API (all under `/api/game`)

| Method + path | File | Request | Response | Status |
|---|---|---|---|---|
| `GET /missions` | `missions/route.ts` | – | `{ missions: PublicMission[] }`: story cases + today's 3 gigs, no answers | Real |
| `GET /missions/[id]` | `missions/[id]/route.ts` | – | `PublicMissionDetail` (tables, visible data, hints, findings without answers) | Real |
| `POST /missions/[id]/start` | `missions/[id]/start/route.ts` | – | `AttemptView { attemptId, missionId, startedAt, targetMinutes, revealedHints[], draft, status }`. Resumes the player's open attempt or starts one | **Real** |
| `POST /attempts/[id]/hint` | `attempts/[id]/hint/route.ts` | `{ index }` | `AttemptView` with the hint text; 400 if out of order | **Real** (logged on the attempt) |
| `POST /attempts/[id]/submit` | `attempts/[id]/submit/route.ts` | `{ query, findings: {claimId: optionId} }` (any `hintsUsed` in the body is ignored) | Evaluation `{ isPassed, totalScore, scoreBreakdown, feedback, xpEarned, creditsEarned, fixtures[], findings[], queryError, hintsUsed, fast, alreadyPaid, balance }`; 400 `{error}` for unsafe or invalid SQL; 404 for an unknown attempt | **Real** (DuckDB grader + attempt + ledger) |
| `POST /attempts/[id]/save` | `attempts/[id]/save/route.ts` | `{ query }` | `{ success, savedAt }`. Draft restored on reopen | **Real** |
| `GET /attempts/[id]/result` | `attempts/[id]/result/route.ts` | – | `{ status, submissions, hintsUsed, lastResult }` | **Real** |
| `GET /wallet` | `wallet/route.ts` | – | `{ balance, xp, entries[≤50], completedMissions[] }` (grants ₦5,000 welcome once) | Real |
| `GET /bootstrap` | `bootstrap/route.ts` | – | `{ user, wallet, missions[], spawn }` (spawn = last checkpoint or the market spawn) | **Real** |
| `POST /checkpoint` | `checkpoint/route.ts` | `{ zoneId, coords, rotationY }` | `{ success, savedAt }`. User from the session (a body `userId` is ignored); coords must be inside the city | **Real** (file store) |
| `GET /profile` | `profile/route.ts` | – | Mock profile | Stub |

**Auth:** `src/server/game/SessionValidator.ts` returns a dev user (`dev-cadet-analyst`) when not in production, and treats **any** bearer token as the same verified user. Real Supabase auth is Phase A2 / roadmap T50.

---

## 7. Game systems (where things live)

### Engine and scene
- **`engine/GameCanvas.tsx`**: the R3F Canvas.
  - Starting quality comes from drei `useDetectGPU`.
  - `PerformanceMonitor` steps quality low/balanced/high; `AdaptiveDpr`.
  - Renders `SceneManager` and `PostFX`.
- **`engine/PostFX.tsx`**: tiered effects. Low = none (renderer ACES); balanced = half-res N8AO, bloom, SMAA, ACES; high = full AO and vignette.
- **`engine/SceneManager.tsx`**: lighting, sky, Physics, `<City physics />` (whole city, ground and colliders), `<MarketBoulevard physics streets={false} life={false} />` (hand-dressed core), city-wide `Traffic` + `Pedestrians` (the crowd follows the player), café `WorkstationDesk`, `CafeOwnerNPC`, `InteractiveGuard`, `<MissionClients />`, `<CustomWaypoint />`, `PlayerCharacter`, `ThirdPersonCamera` (inside Physics), `<CityAudio />`.
- **`camera/ThirdPersonCamera.tsx`**: orbit (drag) and wheel zoom; occlusion by a Rapier ray against fixed colliders, so the camera never enters a building.
- **Dev handle:** `window.__dataCity` is the R3F state in development (scene, camera, gl) for console debugging.
- **`engine/GameState.ts`** (zustand) holds:
  - player transform, camera mode, active target, dialogue, workstation;
  - `terminalMissionId`, `completedMissions`, `walletBalance`, `trackedMissionId`, `talkedTo`, `isPhoneOpen`;
  - legacy café `missionState`, graphics, mute and pause.
- **`world/Skybox.tsx`** + **`world/EnvironmentLighting.tsx`**: warm afternoon; drei `Sky` + `Environment` (HDRI); fog 110–520 m, camera far 650 m. The sun's 160 m shadow box follows the player (texel-snapped).

### World kit (`src/features/game/world/kit/`)
| File | What it holds |
|---|---|
| **`cityPlan.ts`** | **The city master plan (pure TS)**: 5×5 street grid (`GRID`, named `ROADS`), `INTERSECTIONS`, road tiles, sidewalks, crossings, 16 `BLOCKS` → districts, deterministic lots (Market frontage + 15 landmarks + ~600 generated library buildings), street trees and lamps, perimeter walls, `CITY_BOUNDS`, `CITY_LANES`, `CITY_WALKWAYS`, `districtAt()`, `streetAt()`, `routeBetween()` (GPS: Dijkstra on the road graph), `mapPlaces()`. Used by the world, the map, audio and `validate-layout.ts` |
| `kitData.ts` | Pure kit metadata: `kitInfo`, `kitSize`, `PACK_SCALE`, `modularSize` (no React; usable from scripts) |
| **`City.tsx`** | Renders the plan: instanced roads and sidewalks, district ground, one InstancedMesh2 per building model (per-instance plaster tint), landmarks and shop signs behind `DistanceCull`, instanced trees and lamps, every collider, the ground and perimeter walls |
| `palette.ts` | Art-direction colours, `seeded()` RNG |
| `textures.ts` | Procedural canvas textures (façades, signs, corrugated roofs, ground) |
| `parts.tsx` | Box, Sign, roofs, WaterTank, Generator, Awning, palms, CompoundWall… |
| `buildings.tsx` | Procedural original buildings (CafeBisi, Kiosk, MarketStalls, BankBranch, OfficeTower…); `SHOPS` sign list |
| `vehicles.tsx` | Procedural Minibus (danfo), Tricycle (keke), Motorcycle, Car variants, CityBus, DeliveryVan |
| `KitModel.tsx` | Loads optimised GLBs from `generated/kitIndex.json`; `PACK_SCALE` (Kenney roads 10, commercial/suburban 8, cars 1.6, nature 5); warm palette and tint; bundle pieces (`node`); `center` |
| `InstancedKit.tsx` | InstancedMesh2 for repeated props |
| `modular.tsx` | `ModularBuilding`: assembles Quaternius MegaKit pieces (walls, shopfront, windows, corner columns, cornice, roof) |
| `district.tsx` | **`MarketBoulevard`** (positions come from `cityPlan.MARKET_FRONTAGE` / `MARKET_PIECES`; the `streets` prop draws its own roads for the Asset Lab): roads, sidewalks, west and east frontages (Kenney + Quaternius buildings with Lagos signage, tanks, ACs), modular Meridian Capital block, café, market, kiosk, bus stop, instanced lamps/palms/bushes, parked cars, Traffic + Pedestrians; `Solid` adds Rapier colliders when `physics` |
| `streetLife.tsx` | **Pedestrians**: recast navmesh from sidewalks and zebra crossings, a Detour crowd and varied `CastMember` crowd; with `focus`, walkers more than 85 m away are re-placed 35–70 m from the player. **Traffic**: yuka lane loops (one per road), same-lane braking, danfo/keke/okada/Kenney cars, hidden past 160 m. `streetRuntime` publishes live positions for audio |
| `characters.tsx` | `Outfit`, procedural `Person` (fallback), `HeadPiece` (gele, cap, kufi, beret, helmet, chef hat), **`CHARACTERS`** cast with `look` (rigged) + `outfit` |
| `CharacterModel.tsx` | Rigged Quaternius body + hair on one 65-bone UE skeleton; **generated skinned clothing** by bone region; dress skirt; headwear follows the head bone; `CLIP` map to UAL animations |
| `CastMember.tsx` | Character def → `CharacterModel` (with Suspense fallback to `Person`); `clothingFor()` |
| `catalog.tsx` | **World bible**: `DISTRICTS`, `KIT` assets (57 original + modular bank), `LIBRARY` (all optimised library models) |
| `KitShowroom.tsx` | The Asset Lab UI |
| `MissionClients.tsx` (in `world/`) | Renders clients, talk triggers and workstations from mission files; waypoint for the tracked mission |

### Characters and NPCs
- **`characters/PlayerCharacter.tsx`**: kinematic Rapier capsule. Animations: jog (default), sprint, idle, "Type". Footsteps. Spawn and bounds from `shared/constants/marketLayout.ts`.
- **`characters/NPCs/CafeOwnerNPC.tsx`** (Mama Bisi) and **`InteractiveGuard.tsx`** (Tunde) use `CastMember`.
- Unused legacy files: `RiggedHumanoid.tsx`, `Humanoid.tsx`, `CharacterAnimationController.ts`, `AvatarCustomization.ts`, `GameLoop.ts`, `DistrictZones.ts`, `MissionStateMachine.ts` (to wire or delete; roadmap T02).

### Interaction, dialogue and missions
- **`interactions/InteractionManager.tsx`**: picks the nearest target every 100 ms from `InteractionTrigger` registrations.
- **`input/useInput.ts`** `interact()`:
  - NPC → dialogue;
  - workstation → terminal. `ws:<missionId>` targets always open; the café laptop needs the café dialogue first.
- **`interactions/DialogueBox.tsx`**:
  - `client:<missionId>` NPCs use the generic **ClientDialogue** from the mission file (brief → offer with pay → opens terminal; thanks after payment).
  - The café and guard use hand-written trees (`DialogueTrees.ts`, `CafeDialogueTree.ts`).
- **`missions/MissionTrackerHUD.tsx`**: objectives for the tracked mission from the catalog.
- **`missions/WaypointMarker.tsx`**: floating marker.

### Analysis terminal (`src/features/analysis/`)
- **`AnalyticsTerminalModal.tsx`**:
  - loads `/api/game/missions/[terminalMissionId]` and starts or resumes the attempt (`/start`); restores the draft and revealed hints; autosaves the draft;
  - hints are revealed through `/attempts/[id]/hint` (only titles are public until then);
  - case notes from found evidence; findings that need evidence stay locked until it's found;
  - one scrolling column below `lg` so Run/Submit never sit under the findings;
  - tabs: SQL / Data / Hints;
  - runs queries in DuckDB-Wasm;
  - findings step (one radio group per claim);
  - submits to the grader;
  - on a pass: marks complete and refreshes the wallet.
- **`sql-worker/useDuckDb.ts`**: singleton DuckDB-Wasm from the **self-hosted** `/duckdb/` bundles (jsDelivr only as a fallback); (re)loads mission tables; shows DATE as `YYYY-MM-DD` and TIMESTAMP as `YYYY-MM-DD HH:MM:SS`; never fakes results. `MonacoSqlEditor.tsx` binds Ctrl/Cmd+Enter to Run. `duckdb.worker.ts` and `workerBridge.ts` are legacy and unused.
- **`results/HintSystem.tsx`**: hint titles; reveals in order via the server, with cost. **`SchemaViewer.tsx`**: columns + sample rows. **`RubricFeedback.tsx`**: score breakdown and pay.

### Map and navigation
- **`world/navigation.ts`**: `useNavTarget()` (the custom pin, else the tracked job's next stop), `missionStop()`, `useMapClients()`.
- **`ui/Minimap.tsx`**: heading-up minimap (turns with the camera); roads, blocks and buildings from the plan; GPS route line, clients, off-screen target chevron, N marker; district, street and distance by road underneath; click opens the map. `DistrictBanner` shows "Entering Finance Row".
- **`ui/map/CityMap.tsx`** (M): full city map with district and street names, landmarks, clients (click to track), a pin you can drop anywhere (GPS route plus a world marker via `world/CustomWaypoint.tsx`, cleared on arrival), pan/zoom, centre-on-me. `ui/map/MapLayers.tsx` holds the shared SVG layers.

### HUD and phone
- **`ui/GameHUD.tsx`**: minimap, balance, jobs done, tracker, phone/mute/menu buttons, `DataPhone`, mobile controls.
- **`ui/phone/DataPhone.tsx`**: Jobs (clients to track; gigs to "Work remotely") and Wallet (balance, XP, ledger). Tab/Esc.
- **`ui/phone/useCareer.ts`**: zustand mirror of missions and ledger; `loadMissions()`, `refreshWallet()`, `useCareerBootstrap()`, `naira()`.

### Audio
- **`audio/AudioManager.ts`** (howler): footsteps, UI sounds (`click`, `open`, `close`, `confirm`, `error`, `select`); mute synced to GameState; `warmUp()`.
- **`audio/CityAmbience.ts`** + **`audio/CityAudio.tsx`**: procedural positional soundscape on Howler's context (so mute and the autoplay unlock apply; `Howler.autoSuspend` is off). Traffic bed by vehicle density; 4 positional engine voices on the nearest vehicles; horns from real vehicles (more when traffic crawls); crowd murmur from nearby walkers (louder in the market); generator and Datacore hums; server hum in Tech Park; birds in the gardens; an air bed. The listener follows the camera. All synthesised: swap in CC0 recordings in Phase C.

---

## 8. Mission content format

```
content/missions/<id>/
  mission.json          MissionDef (src/shared/types/content.ts)
  dataset/<table>.csv   visible data (sent to the browser)
  reference.sql         canonical answer (server-only)
  fixtures/<fixtureId>/<table>.csv   hidden grading data (server-only);
                        a fixture without a folder (e.g. "sample") reuses dataset/
```

**MissionDef fields:**

| Field | Contents |
|---|---|
| `id`, `kind` | `kind` is `story` or `gig` |
| `tier`, `skill`, `title`, `summary`, `pay`, `xp`, `badgeId?`, `passMark` | Basic metadata |
| `client` | `{ name, business, character?, brief[], thanks }` |
| `location` | `{ district, remote, npc?, workstation? }`; world positions |
| `starterSql` | What the editor opens with |
| `tables[]` | `{ name, description, columns[{name,type,desc,pk?}] }` |
| `hints[]` | `{ title, desc, snippet? }` |
| `findings[]` | `{ id, claim, options[{id,text,correct?}], evidence? }`; exactly one correct; `evidence` locks the claim until that item is found |
| `evidence[]` (optional, in-world only) | `{ id, title, text, position:[x,y,z], prop?: book|slip|note }`. Field evidence; its text must agree with the data |
| `targetMinutes` (optional) | Fast-finish window; default by tier 15/25/40/60/90 |
| `successFeedback` | Shown on a pass |
| `trapFixture` | The fixture that tests the case's trap |
| `fixtures[]` | `{ id, purpose, failHint }`; at least three |

**Loader and helpers:**
- `src/server/content/missions.ts`: `listMissions()`, `getMission(id)`, `toPublic()`, `toPublicDetail()`, `toFixtureTables()`. Re-reads from disk in dev.
- `src/server/content/gigs.ts`: procedural Tier 1 gigs.
  - Templates `dupes` (double-printed receipts) and `top` (top 3 by completed revenue).
  - Fictional businesses; 3 gigs a day; id `gig-<template>-<seed>`; deterministic.
- `src/server/content/csv.ts`: parse and write CSV.

**Adding a case:**
1. Create the folder.
2. Write `mission.json`.
3. Generate the data with a seeded script (see `scripts/content/build-tier1-cases.ts`).
4. Write `reference.sql`.
5. Add at least 3 fixtures, one of them the trap.
6. Run `npm run validate:missions`.
7. Add correct and wrong query checks to `scripts/test-grader.ts`.
8. Place the client `npc` and `workstation` in the world (sidewalk, clear of buildings).

---

## 9. Grading, sandbox and wallet

- **`src/server/assessment/SandboxRunner.ts`** (first line of defence):
  - one statement;
  - SELECT/WITH only;
  - forbidden keywords (DROP, ATTACH, COPY, INSTALL, SET, PRAGMA…);
  - forbidden functions (read_csv, read_parquet, glob, duckdb_*…);
  - 5,000-character limit.
- **`src/server/assessment/SqlGrader.ts`**:
  - a fresh in-memory DuckDB (`@duckdb/node-api`) per fixture, with `enable_external_access=false`, no extensions, 1 thread, 256 MB and `lock_configuration`;
  - 3 s timeout (interrupt) and a 5,000-row cap;
  - runs both the reference query and the player's query, and compares them with `canonical()`. Ignored: column names and order, row order, float noise to 2 dp, midnight timestamps vs dates, and zero/null-only rows.
- **`src/server/assessment/RubricEngine.ts`**: score, feedback (fixture `failHint`s, never the answer), `payout()`.
- **`src/server/game/attempts.ts`**: one open attempt per (player, mission); `hintLog` (in-order reveals), `startedAt` (fast bonus), `draft`, `submissions`, `status`, `lastResult`. File store `.data/attempts.json` or Supabase `game_attempts` (`db/migrations/0002_attempts.sql`, unique open attempt per player and mission, RLS read-own).
- **`src/server/game/checkpoints.ts`**: validated last position per player (`.data/checkpoints.json`).
- **`src/server/storage/jsonFile.ts`**: serialised JSON file store for development; `DATA_CITY_DATA_DIR` overrides `.data/` (tests use a temp dir).
- **`src/server/economy/wallet.ts`**:
  - ledger entries `{ amount, kind: earning|purchase|grant, reason, missionId, xp, idempotencyKey }`;
  - `getWallet()` grants a ₦5,000 welcome once;
  - `creditMissionReward()` uses key `reward:<missionId>`, so a mission pays once ever;
  - Supabase `wallet_ledger` when configured, otherwise `.data/wallet-ledger.json` with a serialised write queue.
- **Tests:** `scripts/test-grader.ts` covers:
  - café: 5 correct and 5 wrong queries;
  - 5 unsafe queries;
  - rubric and pay;
  - Baba Sola: 3 correct and 2 wrong;
  - Zee Fabrics: 2 correct and 2 wrong;
  - gigs: the reference passes, `SELECT *` fails, and each finding has exactly one right answer;
  - attempts: resume, per-player isolation, in-order hints, free re-reveal, closed after a pass, fast bonus from the server clock, hint text never public.
- **Current result:** all pass, and `validate:missions` is all valid.

---

## 10. Status: what is done, partial and broken

### Done
- **Analysis (Phase A complete, 18 Nov 2026):** real SQL grading on hidden fixtures; sandbox plus DuckDB lockdown; the mission content format, loader and validator; three Tier 1 story cases; daily procedural gigs; the generic terminal with findings, hints with cost, schema with samples; **server-side attempts** (hints and fast bonus counted by the server, draft autosave); **field evidence** (café receipt book, Baba Sola's POS slip) that unlocks findings; **self-hosted DuckDB-Wasm** (works offline); **CI** (`.github/workflows/ci.yml`).
- **Browser play-through (18 Nov 2026):** a remote gig, Baba Sola, Aunty Zainab and Mama Bisi each completed and paid once (₦57,000 total with the welcome grant); resubmission pays nothing; balance and café debrief survive a refresh. Bugs it found are fixed: Ctrl+Enter didn't run, dates showed as epoch numbers, Submit was covered on narrow screens, the tracker stayed on a finished job, a repeat pass claimed a new payment, and leaving Mama Bisi before her last line locked the laptop.
- **Economy:** idempotent wallet ledger (file store; Supabase-ready) and wallet API; DataPhone (Jobs, Wallet); tracker HUD; balance on the HUD.
- **World and people:**
  - in-world clients from mission files (Baba Sola at the kiosk, Aunty Zainab at Zee Fabrics) with generic dialogue and waypoints;
  - Market Boulevard from Kenney + Quaternius + the original Lagos layer;
  - colliders, the instanced street props and the asset pipeline with credits;
  - the rigged Quaternius cast with generated clothing, skin tones, hair and headwear; a 20-clip animation library;
  - yuka traffic and recast pedestrians;
  - sound (footsteps, UI), lighting, HDRI, post-FX, adaptive quality;
  - the Asset Lab;
  - the design doc and roadmap pages.

- **City scale and navigation (18 Nov 2026):** the city grew from one 144 m street to a **524 × 562 m** grid of 16 blocks and six districts (Market Boulevard, Finance Row, Tech Park, Ilé Gardens, Academy Quarter, City Gateway): 10 named roads, ~615 buildings, 15 landmarks, ~930 trees and lamps, 46 vehicles, a crowd around the player and perimeter walls. Also: heading-up minimap, full map with pins and GPS routing, district banner, camera occlusion, wall-clamped bounds (no more teleport at ±72 m), sun shadows that follow the player and spatial audio. `validate:layout` passes.

### Partial or known issues
- **Auth:** `SessionValidator` still accepts any bearer token and uses a dev user outside production (real Supabase auth is T50). The game client doesn't call `/checkpoint` or use `/bootstrap`'s spawn yet.
- **Evidence is gated in the browser only:** found evidence is remembered in localStorage; the grader doesn't check it. Record it on the attempt if it ever affects pay.
- **Zee Fabrics has no field evidence yet**; add some when the case gets a second beat.
- **Assets and visuals:**
  - generated clothing is plain colour, and the boubou is a simple skirt;
  - MegaKit buildings keep American red brick;
  - free Quaternius bodies are "superhero" proportions;
  - dev first load is 15–35 s.
- **City scale follow-ups:**
  - render cost: about 2,000 draw calls and 16–19 ms CPU for the scene at 1536×1152, measured before distance culling was added (procedural landmarks and vehicles are many small meshes); merge landmark geometry and add LODs (Phase G). **Measure fps in a normal browser window:** the Claude desktop browser pane throttles `requestAnimationFrame` to about 3 fps for every page (even the landing page), so fps read there is meaningless;
  - generated blocks have no interiors or alleys worth exploring, no signs outside the market and no street-name signs in the world;
  - the ambience is synthesised (a good bed, placeholder horns); add CC0 horn, crowd and conductor recordings (Phase C);
  - footsteps are concrete everywhere (no grass or asphalt variants);
  - the new districts have no story content yet (Phase E).
- **Traffic and pedestrians:**
  - cars have no colliders, so the player walks through traffic;
  - lanes cross at every junction with no lights (now 25 junctions);
  - no player perception, so cars don't stop for the player yet (Phase C).
- **Housekeeping:**
  - Unity folders are still tracked (T01);
  - legacy unused modules remain (T02);
  - CI exists but has not run on GitHub yet (it runs on the first push); the asset packs in `public/assets/kits` and `kitIndex.json` must be committed for its build to pass;
  - `IMPLEMENTATION-PLAN.md` is stale.
- **Profile, admin and HUD:** level and XP aren't modelled; the profile and admin pages show mock data.

---

## 11. Remaining phases (in order) with next steps

> Each phase ends playable. "Done when" is the acceptance test. Roadmap task IDs (Txx) are in `docs/roadmap.html`.

### Phase A: analysis loop and money ✅ done (18 Nov 2026)
All eight tasks landed: browser play-through (and its bug fixes), server-side attempts with hint logging and the fast bonus, real `bootstrap`/`/game/missions`, a secure checkpoint, field evidence, self-hosted DuckDB-Wasm, CI, and a passing production build. `CafeMissionDefinition` and `CheckpointService` are deleted.

**Carried forward:** real auth (T50) so attempts, wallet and checkpoints belong to real users; have the client save checkpoints and spawn from `/bootstrap`; server-side evidence checks if evidence ever affects pay.

**Dev play-test handles (development builds only):** `window.__player.teleport(x, z)` and `window.__player.runtime.position`; `window.__dataCity` (R3F state).

### Phase B: character creator, wardrobe and shops ✅ done (18 Nov 2026)
- **Character creator** (`ui/wardrobe/CharacterCreator.tsx`): shows before first spawn (the player is frozen until a cadet exists) and reopens from the pause menu ("Edit cadet") or the DataPhone Wardrobe tab. Quick-pick 6 cadets (`PRESET_CADETS`) or a "Surprise me" randomiser, custom body (two rigs), skin swatches + fine shade slider, hairstyle (body-specific list) and hair colour, starter top/bottom/shoes. Live-rotating 3D preview (`CadetPreview.tsx`, drag to spin). Saved to `PlayerProfile` on the server (`PUT /api/game/profile`); the player (`PlayerCharacter.tsx`) renders with `usePlayerDef()`, the saved look.
- **Outfit catalog** (`content/outfits.json`, loaded by `server/content/outfits.ts`): 27 items across slots top/bottom/dress/shoes/head, tags starter/casual/corporate/traditional, prices from docs/game-design.md §4. A dress (boubou/kaftan) replaces top+bottom; a gele or kufi replaces hair. Validated by `checkCatalog()` (also run from `validate-missions.ts`-style checks in `test-shop.ts`).
- **Tailor shop**: Zee Fabrics Tailoring counter in the world (`world/TailorCounter.tsx`, fabric rolls + sign + mannequin, `MARKET_LAYOUT.tailor`), opened with E. Try-on changes the 3D preview live before buying; **Buy** calls `POST /api/game/shop/buy` (price from the catalog only, never the client); **Wear** swaps the equipped item instantly. Wardrobe tab in the DataPhone lets you re-wear anything already owned without visiting the shop.
- **Money safety**: `wallet.debit()` (file store) / `wallet_debit()` Postgres function (`db/migrations/0003_shop.sql`, advisory-locked, atomic balance-check-then-insert) — buying something twice, or N simultaneous clicks, charges once; buying what you can't afford is refused with the exact shortfall. Covered by `scripts/test-shop.ts` (22 checks, incl. 3 simultaneous buys → 1 charge).
- **Not yet built:** fabric pattern textures (flat colours only — UVs on the generated clothing would be needed for ankara/aso-oke print textures); attire gating at Tier 4 fronts / traditional-wear pay bonuses (ties into Phase E rubric work); compliment barks (Phase C); authored Blender outfits.

**Done when:** you create a custom cadet, buy an outfit, reload, and the look persists; the balance is debited once. ✅ verified in-browser 18 Nov 2026 (Zara preset → saved → spawned with that look; bought an ankara shirt for ₦12,000, balance debited once, worn instantly).

### Phase C: reactive street ✅ done (18 Nov 2026)
- **Traffic lights** at every four-way junction (`world/kit/trafficLogic.ts`, pure and unit-tested): each axis gets 9s green + 2s yellow before the other axis's turn, offset per junction so the city doesn't flash in lockstep; `signalBrakeFactor()` eases vehicles to a stop at the line (or lets them through if already too close to stop safely on yellow, or already past the line). `TrafficLights` (in `streetLife.tsx`) renders 20 colour-cycling lamps (2 per junction × 10 junctions) updated from the same pure function, no new geometry needed.
- **Driver block-reaction state machine** (`trafficLogic.ts`'s `stepBlockState`, pure, unit-tested against the exact masterprompt timings): brake (0s, already natural from the brake factor) → horn (~1.5s) → shout (~4s) → push (~9s). `isBlockedByPlayer()` detects the player standing ahead in a vehicle's lane. On clearing, a "thank you" bark fires once. **Simplified from the original design:** "push" is a small physical nudge on the player (`playerNudge`, consumed once by `PlayerCharacter`'s movement loop) plus horn/bark, not a modelled driver who exits the car and walks over with a `Push_Loop` animation — that full walking-NPC rig is listed as a follow-up, not built this pass. "A danfo mounts the kerb" after a long jam is also not built.
- **Vehicle colliders**: every traffic vehicle carries a kinematic `RigidBody`+`CuboidCollider` sized to its footprint, updated every frame from its yuka position — the player can no longer walk through moving traffic.
- **Pedestrian reactions**: sprinting into a walker (speed > 5, within ~1m) triggers a "bumped" bark and sidesteps their navmesh target away from the player. Onlookers-gather-at-arguments and reputation-based greetings are not built (Phase E, once reputation exists).
- **Barks system**: `content/barks.json` (14 lines across horn/shout/push/thanks/bumped/greeting, English + Pidgin), served by `server/content/barks.ts` + `GET /api/game/barks`, validated (`checkBarks()`, also covered by `scripts/test-traffic.ts`). `world/barks.ts` is the runtime (`pushBark(situation, pos, source, now, cooldown)` — the cooldown key must include the situation, not just the speaker, or one bark's cooldown silently swallows the next: this was a real bug found and fixed during testing). `world/BarkLayer.tsx` renders active lines as floating `<Html>` subtitles, polled at 10Hz.
- **Audio**: still the Phase A procedural soundscape (CityAmbience); no new CC0 horn/crowd/conductor recordings were added — this environment has no way to fetch new binary asset packs mid-session, so it's carried forward as a Phase C follow-up, same as the masterprompt already flagged in §10.

**Done when:** standing in the lane gives stop → horn (~1.5 s) → shout (~4 s) → push (~9 s), and queued honks; bumping pedestrians gets a shout. Unit-test the state-machine timings. ✅ `npm run test:traffic` (26 checks: phase cycling, never-both-green, brake factors, blocked detection, the exact 1.5/4/9s transitions, barks validity) + verified live in-browser: horn and shout fired with correct, distinct lines; push fired at the recorded 9.1s mark in an earlier run (before the cooldown-key fix, which is why the first live run showed horn repeating instead of escalating — the fix was applied and retested); 20 traffic lamps confirmed cycling colour over a 12s window with no NS/EW conflict.

### Phase D: vehicles and driving ✅ core done (18 Nov 2026)
- **Vehicle dealership**: `content/vehicles.json` (5 cars: used hatchback 1.5M, keke 2.5M, sedan 3.8M, pickup 5.2M, SUV 12M), `server/content/vehicles.ts` (validated catalog), `GET /api/game/garage` (owned + catalog + licence), `POST /api/game/garage/buy` (price from the catalog only, atomic debit — same `wallet.debit()` safety as outfits: buying twice or unaffordably is refused, never double-charged).
- **Driving licence** (`driving_licence`, ₦200k, bought the same way as a car) gates entry: the world prompt shows "pass your driving test first" and `interact()` refuses to start driving without it (checked both in the UI and structurally alongside the purchase system — there is no server-side drive *action* to gate, since driving itself has no server call, only owning the car and the licence do).
- **Driving** (`world/DrivableCar.tsx`): **not** Rapier's full ray-cast wheel/suspension controller — a kinematic arcade controller using the same `world.createCharacterController()` shape-cast pattern as the player (proven, collision-aware, and far more reliable to get right without the extensive interactive suspension-tuning that a dynamic vehicle needs). Accelerate/brake/reverse, speed-scaled steering, Shift for a speed boost, a forward+side raycast-style collision response that sheds speed on impact. E enters (near a parked, owned, licensed car) and E always exits first regardless of what's nearby. While driving, the player's own body is hidden and its collider disabled; the camera, minimap and GPS keep following "the player" unchanged because the car mirrors its position onto the same `playerRuntime` the rest of the game already reads.
- **Garage**: cars park at `MARKET_LAYOUT.garage` (east sidewalk near the kiosk) by default; the DataPhone **Garage** tab lets you call every owned car to a ring of spots around you, buy more cars or the licence, and see what you own. `db/migrations/0004_garage.sql` adds the Supabase table for parked positions, **but `server/game/garage.ts`'s loader is file-store only for now** — it doesn't switch to Supabase the way `wallet.ts`/`attempts.ts` do, since this project has no Supabase instance configured to test against; the migration is ready for when T50 (real auth) lands.
- **Hailing a ride**: `POST /api/game/garage/hail` prices a `fareFor(distance)` road-distance fare (server/economy/fares.ts), debits it (never idempotent — every real ride costs money, protected only by the same atomic balance check), then the client fast-travels the player straight to the tracked job or map pin via a new `requestTeleport()` one-shot (consumed by `PlayerCharacter`, same mechanism the dev `teleport()` handle already used). **Not built:** a travel cutscene/animation — the jump is instant, same as the existing map-pin/dev teleport.
- **Not built (follow-ups, scoped out this pass):** Borrow from Contacts and Rent by the hour (both need a trust/relationship system that doesn't exist yet); a Contacts DataPhone app; a mechanic and vehicle damage/repair ("settle it" fines for bumps); a walking driver NPC getting out to push (Phase C already covers the push *reaction*, just not from a car YOU hit); a danfo conductor bark at the bus stop.

**Done when:** you hail a danfo to the café (fare deducted); borrow and return a car; buy a car, find it in the garage and drive it with collisions. **Partially met**: hail-with-fare-and-teleport ✅ verified live; buy → find in garage → drive with collisions ✅ verified live (licence gate, enter/exit, forward motion, steering all confirmed in the browser — a real bug was found and fixed in this pass: hailing paid the fare but never actually moved the player, now fixed via `requestTeleport`). Borrow/rent are not built (see above), so that half of "Done when" does not apply yet.

**Verification note:** as in Phase C, this environment's browser pane suspends `requestAnimationFrame` almost entirely once backgrounded (confirmed at 0 ticks over 13s in one check), which froze camera/physics-driven behaviour (but not click-driven UI) until a click re-woke it — not a code regression. A `location.reload()` also left a stale reference to the `PlayerCharacter` module's teleport singleton via Fast Refresh, making the very first hail test look broken; a full `navigate()` reload resolved it and the retest passed cleanly. Both are noted here so a future session doesn't chase the same false leads.

### Phase E: career content, new districts and new skill tools — partial (18 Nov 2026)
- **Districts:** unchanged from Phase A — the layout for all six exists in `cityPlan.ts`. Still remaining: dressing Ilé Gardens/Finance Row further (compound walls, gates, building interiors), and district streaming if perf needs it. Two case NPCs are now placed in Ilé Gardens (see below), which is the first story content that district has had.
- **Cases 4–10 — 2 of 7 built, to the same quality bar as the Tier 1 cases** (full hidden-fixture grading, a real trap, grader acceptance tests, evidence, in-world NPC placement):
  - **T2 Sunrise fees** (`content/missions/tier2_sunrise_fees`) — JOIN + partial payments. Two tables (`students`, `payments`); the trap is reversed bank transfers and duplicate entries counted as real money (both still carry a `status` the player must filter on). Client: Mrs. Adaeze Chukwu, bursar, in Ilé Gardens near Sunrise Primary. 4 fixtures incl. an "everyone's paid" empty-result edge case. 5 new grader checks.
  - **T2 Keke fleet** (`content/missions/tier2_keke_fleet`) — cost/km with outliers and nulls. One table (`keke_log`) mixing fuel and repair entries; the trap is a single large repair bill that — if not filtered by `category = 'fuel'` — makes the WRONG keke (KK-02) look like the worst performer instead of the real culprit (KK-04), with some days missing an odometer reading (`distance_km IS NULL`) on top. Client: Alhaji Musa, fleet owner, also in Ilé Gardens. 4 fixtures. 4 new grader checks.
  - **Not built:** Grace Pharmacy (T2), Kora late deliveries and Okeke price creep (T3), Lumen churn and Meridian defaults (T4) — the remaining five cases from the table below are untouched; T3/T4 also need window-function/cohort-level data design this pass didn't get to.

  | Tier | Case | Status |
  |---|---|---|
  | T2 | Sunrise fees (JOIN, partial payments) | ✅ built |
  | T2 | Keke fleet (cost/km, outliers, nulls) | ✅ built |
  | T2 | Grace Pharmacy (dates, FIFO, waste) | Not built |
  | T3 | Kora late deliveries (window functions, SLA) | Not built |
  | T3 | Okeke price creep (time series, chart) | Not built |
  | T4 | Lumen churn (cohorts, A/B) | Not built |
  | T4 | Meridian defaults (Simpson's paradox) | Not built |

- **Reputation** (`src/shared/reputation.ts`, pure, derived): per-district score 0–100 from completed in-world missions (tier-weighted points, capped), five ranks Cadet Analyst → Partner. Nothing is stored separately — it's computed live from the same public mission list and completed-mission list the rest of the game already trusts, so there's nothing new to fake. The HUD's "Cadet Analyst" label now shows the real computed overall rank; the DataPhone Wallet tab shows the per-district breakdown. `tierReadyIn()` is a soft readiness check (tier 1 always open; tier N+1 wants some reputation in that district first) — **not yet wired to anything**, since there's no T3+ content yet to gate. 18 new tests (`scripts/test-reputation.ts`).
- **Not built this pass (documented, not silently skipped):** the spreadsheet grid, the chart builder and the statistics panel (three separate new editor/grading surfaces, each comparable in size to the SQL terminal — real future work, not attempted here); salaried contracts; more gig templates; authored story-chapter consequences (the café getting busier, billboards changing).

**Done when:** scenarios 4–10 pass validation and are playable; the spreadsheet and chart tools grade; reputation gates work. **Partially met**: 2 of 7 new scenarios (both T2) pass validation, are graded with full fixture coverage, and have in-world NPCs — verified via `validate:missions`, `validate:layout`, `test:grader` (9 new checks across both cases) and live in-browser (both "Talk to [client]" prompts confirmed on approach; the full dialogue→terminal→submit loop was *not* re-verified live for these two specific cases in this session, since the user began actively playing partway through testing and further automated input would have fought them for control — the dialogue/terminal pipeline itself is unchanged, shared code already proven live for the three Tier 1 cases). Reputation is real and visible (not gated on anything yet, since nothing above T2 exists to gate). Spreadsheet/chart tools: not built.

### Phase F: aviation — foundation only, honestly scoped down (18 Nov 2026)
**Why minimal:** every payoff this phase promises (the aerial-survey gig, the BRT authority case, the Vantage claims case) is Tier 5 content that depends on Tier 3/4 cases Phase E didn't build. Flying a chopper with nothing to do up there is decoration, not gameplay, so this pass builds the structure and stops rather than inventing rushed Tier 5 missions that wouldn't meet the grading-quality bar the rest of the game holds to.
- **Airfield** (`world/Airfield.tsx`): a helipad + control hut + windsock in City Gateway (`MARKET_LAYOUT.airfield`). **No runway and no light plane** — only the hover model was built (see below), so a landing strip isn't needed yet.
- **Flight licence**: `flight_licence`, ₦15,000,000 (docs/game-design.md §4), bought through the same dealership/wallet machinery as the driving licence (`shared/types/garage.ts`'s `licence: 'driving' | 'flight'` field on `VehicleDef` picks which one a vehicle needs; `useInput.ts` looks it up per-vehicle rather than assuming driving).
- **Chopper** (`content/vehicles.json`'s `chopper_light`, ₦500,000,000 per docs/game-design.md §4; procedural model in `world/kit/vehicles.tsx`'s `Chopper`, spinning main + tail rotors): bought like any other vehicle, but spawns at the Airfield instead of the car garage spot. Reuses the whole garage/ownership/entry-exit system from Phase D — **not** a separate vehicle type.
- **Flight physics** (`world/DrivableCar.tsx`, a new branch keyed on `def.body === 'chopper'`): free-flying hover — W/S thrust, A/D yaw (can turn in place, unlike a car), Space climbs, Shift descends, clamped between the ground and a 140 m ceiling. **Deliberately simpler than ground vehicles**: no collision against buildings (a chopper's collider is a sensor, not solid) — full 3D obstacle avoidance is real future work, not attempted here. This is the one system in the whole session built to a visibly lower standard than its ground counterpart, and that gap is intentional, not an oversight.
- **Not built:** the light plane (lift/drag physics is a different system from a hover model); helipads on the bank roof or in Tech Park (only the Airfield's own pad exists); a dedicated flight camera (the existing orbit chase camera is reused, unchanged); Tier 5 content of any kind.

**Done when:** you earn the licence, fly the chopper and land on the bank helipad. **Not met** — there is no bank helipad to land on (see above). What *is* done: buy the chopper, pass flight school, take off from the Airfield, fly, land back. 28 garage/vehicle tests pass (`scripts/test-garage.ts`, 8 of them new for Phase F), the Airfield's helipad mesh was confirmed present in a live scene check, and the layout validator confirms the helipad is clear of buildings — but the actual takeoff-to-landing loop was **not** flown live in this session (the user was actively playing when this phase was built, and taking the controls to test flight would have interrupted them; the next session should fly it manually or via the dev `window.__player`-style handle before trusting it fully).

### Phase G: polish and launch — accessibility only this pass (18 Nov 2026)
**Why scoped down:** the user was actively playing the live game for most of this session (confirmed by real mouse clicks and movement showing up mid-test). Performance work (geometry merging, LODs) and a mobile pass both mean changing how the city actually renders, which risks visibly breaking the scene for someone looking at it right now — too risky to attempt blind without watching it render. Accessibility settings are additive and **off by default**, so turning this phase's work on can't disrupt anyone who doesn't opt in.
- **Accessibility (T72) — done:** three new, opt-in, `localStorage`-remembered toggles in Settings (`GameState.reducedMotion/largeText/colorblindSafe`, `SettingsModal.tsx`):
  - **Large text** scales the whole UI (`document.documentElement.style.fontSize = '125%'`, so every rem-based Tailwind size scales together, not a one-off CSS hack);
  - **Reduced motion** turns off the "press E" prompt's bounce animation and the character creator/wardrobe/tailor preview's auto-spin (drag-to-turn still works);
  - **Colour-blind-safe traffic lights** swaps the Phase C signal lamps from green/red to blue/orange (`trafficLogic.ts`'s new `lampColour()`, unit-tested) — red/green is the one pairing that fails across the most common forms of colour blindness, and traffic lights are exactly the kind of HUD-adjacent signal where getting it wrong matters.
  - Subtitles already existed (Phase C's barks) and are not further changed; a keyboard-only terminal was not specifically audited (Monaco is already keyboard-driven, but this wasn't verified end-to-end).
- **Not built, and not silently skipped:**
  - **Performance (T70/T71):** no LODs, no KTX2 textures, no district streaming, no fps measurement. The procedural-landmark/vehicle draw-call cost flagged back in Phase A (§10) is unchanged.
  - **Mobile pass (T73):** `MobileTouchControls.tsx` is unchanged from Phase A; not re-tested this pass.
  - **Title screen / onboarding (T74):** the game still drops straight into the character creator; deliberately not touched, since inserting a mandatory screen before it could disrupt the session already under way.
  - **Telemetry (T75), real Supabase auth (T50/T51), deploy (T76):** all need external services this local session doesn't have access to.
  - The optional stack-upgrade sprint: not attempted.

**Verified:** `scripts/test-traffic.ts` (4 new checks: the safe palette actually changes colours, yellow is unchanged, go/stop stay distinguishable); `document.documentElement.style.fontSize` was reasoned through rather than watched live, for the reason above. Type-check, full test suite and the production build all pass.

### Housekeeping (any time, small)
- **T01:** stop tracking `unity/`, `DataCity_Core/` and `ThirdParty/` (keep the Yarn narrative text in `content/narrative/`).
- **T02:** delete or wire the legacy modules listed in §7.
- Repaint MegaKit brick for Lagos (tint or retexture); add a CC0 African-attire workflow.
- Retire `IMPLEMENTATION-PLAN.md`, or point it to this file.

---

## 12. Owner feedback (18 Nov 2026) — reported issues and the investigation/fix plan

Phases A–G (§11) are built, tested and pushed. The owner then played the live build and reported five problems in one message. **Exact asks, kept verbatim so nothing gets softened in translation:**

> "i want it to have real cars, i noticed that the characteres in the game seem to be walking but not actually walking. i also noticed that the drivers of cars are not visible and the main character (the person playing) cannot enter a car or a plane yet. then i noticed that the map works differently when the person is going left the map seems like it is going right. we need to fix everything. and make it better."

Below is each item, what it most likely means, and the investigation/fix plan — written here **before** touching code, per the owner's explicit instruction to record the plan first.

### 12.1 "Real cars" — ✅ built (19 Nov 2026)
**Reading:** two things — (a) the player should be able to get into *any* car on the street, not only a dealership car, and (b) cars should read as more convincing.
**What shipped:** ambient traffic is now jackable. `world/kit/streetLife.tsx`'s `Traffic` registers one `InteractionTarget` per vehicle directly in the module-level `interactionTargets` map (mutated in place every frame, not via the `<InteractionTrigger>` React component, so 40+ moving targets cost no extra re-renders), id'd `vehicle:traffic:<i>`. Pressing E near one hands that one yuka vehicle to a player-controlled kinematic branch (reusing `DrivableCar.tsx`'s ground-vehicle accel/brake/turn math, via a shared lazily-created `world.createCharacterController()` since only one vehicle can be jacked at a time) and writes the result back into the yuka `Vehicle`'s own `position`/`velocity`, so releasing it (E) hands smoothly back to `FollowPathBehavior` from wherever it ends up. (b) judged resolved by §12.2's driver + the jacking itself — no new models added this pass.

### 12.2 "Drivers not visible" — ✅ built (19 Nov 2026)
**What shipped:** every ambient vehicle now renders a seated driver — a cheap procedural `Person` (not the full rigged `CastMember`, to keep 40+ instances light) from the existing crowd-archetype palette, seated at an eyeballed per-vehicle offset. The player's own car (`DrivableCar.tsx`) and a jacked ambient vehicle (`streetLife.tsx`) both now show the player's actual look (`usePlayerDef()`) seated at the wheel via `CastMember` with the `Drive` clip (`Driving_Loop` — was already in `CLIP` but unused). `PlayerCharacter.tsx` still hides the player's own walking body while `isDriving` (unchanged — the seated figure is rendered by whichever vehicle component they're in, not by `PlayerCharacter` itself).

### 12.3 "Cannot enter a car or a plane yet" — ✅ addressed (19 Nov 2026)
Root cause was (a) from the original reading: ambient street traffic was never enterable by design (fixed by §12.1), and the dev account owned no vehicles/licences at the time, so the only entry points it could reach were ambient cars. `useInput.ts`'s `interact()` now branches on the vehicle id prefix: a `traffic:`-prefixed id (ambient/jacked) always needs the ground driving licence (no catalog lookup — no ambient choppers exist); an owned-vehicle id keeps its existing catalog + flight-licence lookup. Exiting any vehicle (owned or jacked) now steps the player out to its right-hand side via `requestTeleport` instead of leaving them standing exactly inside the vehicle's collider.

### 12.4 "Characters walking but not actually walking" — ✅ fixed (19 Nov 2026)
**Root cause found by reading the animation code, not by guessing:** `CharacterModel.tsx` always played every clip at a fixed `timeScale` of 1, regardless of how fast the character was actually translating. The player's `Run`/`Sprint` clips (and the crowd's `Walk_Loop`, always on) played at full authored rate even while `MathUtils.damp`-eased acceleration meant the actual ground speed was much lower — classic foot-sliding, which reads exactly as "walking but not actually walking."
**Fix:** `CharacterModel` now accepts an optional `speedScaleRef` (a stable mutable `{current: number}`, not a prop that would need a re-render every frame) and applies it to the live `AnimationAction.timeScale` inside its existing per-frame `useFrame`. `PlayerCharacter.tsx` computes it each frame from `playerRuntime.speed` against the clip's nominal speed (4 m/s jog, 7 m/s sprint), clamped to [0.4, 1.6]. `Pedestrians` in `streetLife.tsx` does the same per recast agent against a 1.3 m/s nominal walk speed, clamped to [0.2, 1.3] — so a crowd agent that's briefly slowed (crowding, re-targeting) now visibly slows its footfall instead of sliding at full walk rate.
**Not live-verified this pass** (see §12.6) — this is a code-level fix for a mechanism that's unambiguous once you read `CharacterModel.tsx`'s `useEffect`/`useFrame`, but it should still be watched in motion next session to confirm it reads right, not just technically-correct.

### 12.5 "The map works differently when going left — seems to go right" — not touched this pass
**Status unchanged from the last entry:** every rotation formula in `Minimap.tsx` and `CityMap.tsx` was independently re-derived by hand and matched the code exactly (see the previous revision of this section, kept below for the full derivation notes). Per the owner's standing instruction not to trust another round of algebra, this needs to be watched live — turning the camera and comparing the minimap/arrow against a known landmark's true bearing. That live check could not be done this pass (§12.6) and is carried forward as the top of §13.
<details><summary>Prior algebraic check (18 Nov 2026), kept for reference</summary>

Every rotation formula in `Minimap.tsx` (the world-rotation `theta`, the off-screen target chevron, the player arrow) and in `CityMap.tsx` (the fixed player arrow) was independently re-derived by hand from first principles (world convention: +X east, +Z north; map convention: svgY = −worldZ, matching `MapLayers.tsx`/`CityLayers`; rotations solved by adding angles via `atan2`, not by eyeballing compass directions, which is error-prone and produced a false positive on an earlier pass). Every formula currently in the code matched the from-scratch derivation exactly. That doesn't rule out a bug — it means if the math is sound, the issue is more likely a mouse-drag sign (`ThirdPersonCamera.tsx`'s `runtimeInput.yaw -= (e.clientX - x) * 0.005`), a units slip, or something only watching it live will show.
</details>

### 12.6 How this was verified this pass
Type-check, the full test suite (`test:grader`, `test:shop`, `test:traffic`, `test:garage`, `test:reputation`), `validate:missions`, `validate:layout` and `npm run build` all pass clean after every change in §12.1–12.4. **Live in-browser verification (walking, jacking a car, watching the seated driver, watching the animation scale, turning the camera to watch the map) could not be completed this pass**: the Claude Browser pane stayed reported as hidden/backgrounded for the whole session (confirmed via a direct `requestAnimationFrame` frame-count probe — under 2 ticks/second instead of ~60 — even immediately after a fresh `navigate()`, a canvas click, and an explicit "show this pane" call), so WASD/driving input and animation never had real frames to run on. Console was otherwise clean (no errors from the app itself; the only errors seen were from the agent's own test script dispatching a `KeyboardEvent` on `window` instead of a real element). **This is the first item for whoever picks this up next: open `/game` in a normal, focused browser window (not the backgrounded pane) and walk through §13's checklist.**

---

## 13. Immediate next steps (do these first)
1. **Live-verify §12.1–12.4 and §15.1 in a real, focused browser window** (the pane was backgrounded all of 19 Nov's sessions): own nothing → walk up to an ambient car, confirm jacking needs no licence and the prompt/driver show up → press E, confirm your own character is seated believably (not floating/standing) → drive, exit, confirm you step out beside it → repeat with an owned/dealership car (licence still required there) → listen for the instrumental pad vs. leftover noise-bed loudness → watch a sprinting/jogging player and a few pedestrians for foot-sliding.
2. Then §12.5: watch the minimap/full map live while turning, compare against a known landmark — do **not** re-derive the formulas again first.
3. Push when the owner says so, so CI runs; fix anything it finds.
4. Work §15's roadmap in its suggested order (§15.7): districts' missions → light theme/landing/footer → Python sandbox → Excel workspace → backend/database last (needs the owner's sign-off first — see §15.3).
5. Update §10, §11, §12 and §15 here as each lands.

---

## 14. Conventions
- **Code:**
  - TypeScript strict; `@/` maps to `src/`.
  - Server-only code lives in `src/server/` and must never be imported by client components.
  - Answers and fixtures never leave the server.
- **3D:**
  - World units are metres; assets face +Z; the ground is y = 0.
  - Library models load through `KitModel` / `InstancedKit` with `PACK_SCALE`.
  - Colliders come from the kit `footprint`/`height` via `Solid` in `district.tsx`.
- **Assets:** add packs to `assets/manifest.json` → `node scripts/assets/optimize.mjs <id>` → use `KitModel`. CREDITS regenerates automatically.
- **Content:** missions are data. New cases go in `content/missions/` and must pass `validate:missions` and have grader tests.
- **Copy:** player-facing text is plain, warm, Lagos-flavoured; naira as `₦12,000`.
- **Git:** work on a feature branch (currently `feat/world-kit`); commit only when asked; **never push without the owner's go-ahead**.

---

## 15. Owner feedback (19 Nov 2026, second round) — full breakdown and roadmap

Three of the five items below were fixed the same day (§12's jacking/driver/animation work had landed, then the owner reported the jacking licence paywall, the driver's pose and the audio as still broken — see the "fixed this pass" note under each). The rest is new, much bigger scope: missions/storyline content, a real shared backend, a full theme/landing-page redesign shared with the main BGAP platform, and an Excel/Python skills story. **Exact ask, kept verbatim:**

> "the drivers in cars basically look like drivers standing inside the car... then the car jacking is not working. it doesn't work at all. then the game keeps having a white noise in the background... then the different game storyline, missions and all should be built as well and given function. also, the game does not have a backend and a database yet. the backend and database of the main bgap game should be used. the landing page should be redesigned to light theme the whole game should be light mode... should have the same footer. share the same backend and the same database... PREPARE THE FULL BREAKDOWN AND THEN SUGGESTIONS ON WHAT NEEDS TO BE DONE. THEN IMPLEMENT IT. THE SQL THE PYTHON PART IN THE GAME SHOULD WORK WELL... AND IF THERE IS NEED FOR EXCEL SPREADSHEET AS WELL, WE CAN USE THE BGAP EXCEL WORKSPACE ALONGSIDE"

This project lives at `C:\THE BGAP OF AIDLEARN\DATA CITY`, a sibling of the main BGAP platform. The other folders at `C:\THE BGAP OF AIDLEARN\` matter for everything below:
- **`bgap-academy/`** — the main BGAP platform. `frontend/` is Next.js 14 + Supabase (`@supabase/ssr`, `@supabase/supabase-js`), already **light-themed** (`#F8F6F1` background, `#0f172a` text, Plus Jakarta Sans/Inter — see `frontend/app/globals.css`), with its own landing page (`frontend/app/LandingPageClient.js`, 130 KB) and footer (`frontend/app/components/BGAPFooter.jsx`). `backend/` is a separate Node service. `supabase-setup/` holds the production schema as plain SQL (`01_schema.sql` … `09_waitlists_and_newsletter.sql`) — the source of truth for what tables/RLS already exist in the shared project.
- **`BGAP-practice-workspace/`** — a standalone Next.js app that is very likely "the BGAP Excel workspace" the owner means (not inspected in depth yet — next session should open it and confirm what it exports/how it's meant to be reused).
- Both `bgap-academy/frontend` and this repo already depend on `jspreadsheet-ce` + `hyperformula` (a real in-browser spreadsheet engine), so there may be a shared component here already, not just a separate app.

### 15.1 Driver pose, car jacking, background audio — ✅ fixed this pass (19 Nov 2026)
- **Jacking "doesn't work at all":** root cause found by re-reading the code, not guessing — jacking an ambient car required the same ₦200,000 driving licence as buying one from the dealership. A fresh account can't afford that, so every attempt silently failed (a quiet error sound, no other feedback). Jacking is now free — an informal quick ride needs no licence; owning a car from the dealership still does.
- **"Drivers standing inside the car":** the ambient driver (`Driver` in `streetLife.tsx`) used a standing-idle pose positioned by scaling off total vehicle height, which put the hip near the roofline of most vehicles. `Person` (`characters.tsx`) now has a `seated` pose (legs bent at the hip instead of hanging straight down) and the driver is positioned near the vehicle's actual floor. The player's own seated `CastMember` (in `DrivableCar.tsx` and the jacked-vehicle render in `streetLife.tsx`) got the same conservative height correction, though its "Driving_Loop" clip likely already seats the pelvis correctly — **this one still needs a live look to confirm/tune**, it wasn't guessed blind.
- **"White noise in the background":** `CityAmbience.ts`'s background was dominated by filtered brown/pink/white noise beds. Added a synthesised 4-voice instrumental chord pad (no sample files, consistent with how the rest of this file works) as the new background layer, and roughly halved the noise beds so they're a quiet road/crowd texture under the music, not the dominant sound. Horns, engines and footsteps are untouched (they're SFX, not the complaint).
- **None of this is live-verified yet** — same Browser-pane-backgrounded limitation as §12.6. This is the top of the next live-verification pass (§13/§16).

### 15.2 Storylines, missions and districts — not started, this is the biggest content gap
**Current state:** 5 missions total (`content/missions/`), all tier 1–2, all reading as market/finance-district cases (akara spot, fabric shop, keke fleet, a POS reconciliation, a fees case). **Academy, Gardens, Tech Park and Gateway have zero missions.** No tier-3 content exists. There's no overarching storyline connecting cases — each is a standalone SQL puzzle with a client and a payout.
**Suggestion:** this is content-authoring work, not a code fix, and it's the single largest remaining item. Proposed shape, to match the "real analyst career" framing already in the game (reputation per district, ranks from Cadet to Partner — `src/server/rewards/reputation.ts`):
1. One tier-1 and one tier-2 case per remaining district (4 districts × 2 = 8 cases) before any tier-3 work, so every district has *something* to do.
2. A light throughline: 3–5 "signature" cases that reference each other (a recurring client, a season-long fraud thread) rather than every case being fully disconnected — gives "storyline" without needing a full narrative engine.
3. Tier-3 cases once tier-2 reputation gating has real cases to gate (`tierReady()` in `reputation.ts` is already built and tested — it has nothing to open yet).
4. Each new case needs: a grader fixture set (DuckDB), `validate:missions` passing, and — per §15.4 below — a matching Python or spreadsheet task where that's the better tool for the case, not SQL for everything.

### 15.3 Backend and database — owner approved the shared project (19 Nov 2026); wiring in progress
Owner's answer: **share `bgap-academy`'s live Supabase project** (not a separate one). Progress this pass:
- **✅ Done:** `.env.local` (gitignored, never committed) now has this repo's own copy of `bgap-academy/frontend/.env.local`'s three Supabase values (URL, anon key, service-role key — none of that file's other keys, like Gemini/Groq/Resend, were copied; they belong to that app, not this one).
- **✅ Done, and a real security fix, not just wiring:** `SessionValidator.ts` was a stub — **any** Bearer token that wasn't literally the string `"invalid"` was accepted and mapped to a hardcoded fake user. That was a genuine auth bypass, independent of whether the backend integration ever happened. It now verifies the token as a real Supabase session (`supabaseAdmin.auth.getUser(token)`) against the shared project, looks up `public.users` (bgap-academy's real user/role table — confirmed by grepping its frontend for `.from('users')`, not `.from('profiles')` as the table name initially suggested) for `role`, and maps BGAP's role vocabulary onto Data City's `student`/`instructor`/`admin`. A dev-mock identity still applies when there's no token and `NODE_ENV !== 'production'`, so local work without a live session still works.
- **⏳ Needs the owner to run one script:** the four existing migrations (`0001_wallet_ledger.sql`…`0004_garage.sql`) create new tables (`wallet_ledger`, `game_attempts`, `player_profiles`, `garage_vehicles`) that don't exist in the shared project yet — they were checked against `bgap-academy/supabase-setup/01_schema.sql` and don't collide with anything there. No `psql`/Supabase CLI/connection string was available in this session to run them directly, and doing DDL against a live production database through an improvised workaround isn't the right call — they're concatenated into **`db/migrations/RUN_THIS_IN_SUPABASE.sql`**, ready to paste into Supabase Dashboard → SQL Editor → New query, run once. **Until that runs, the wallet/garage/profile/attempts API routes will error** the next time the dev server restarts (it now has real credentials, so `supabaseConfigured()` is true and those three stores try Supabase instead of the local JSON-file fallback they used before).
**Still open, needs the owner's call before building further:**
1. **Entry point / login flow** — does a player reach Data City from inside `bgap-academy` (nav link, iframe, subroute) carrying the existing session, or as a standalone site reading a shared cookie/JWT? `bgap-academy/frontend/middleware.js` uses `@supabase/ssr`'s cookie-based session; Data City's frontend has no login UI or browser Supabase client yet, and no central place that attaches an `Authorization` header to its `fetch('/api/game/...')` calls (there are 4+ separate call sites: `useGarage.ts`, `useCareer.ts`, `useWardrobe.ts`, `barks.ts`). This is real, scoped frontend work for next session once the entry-point question is answered — not attempted blind here.
2. Decide whether Data City's few game-specific columns (its own `role` mapping, its own tables) need anything added to `public.users` itself, or whether they're fully self-contained in the four new tables (current migrations assume the latter — no `ALTER TABLE users`).

### 15.4 SQL and Python quality
- **SQL:** already solid — `SandboxRunner.ts` is a real two-layer guard (keyword blocklist + a parsed-AST check that only a single read-only `SELECT` is allowed, no file/network/system-table functions), backed by DuckDB running server-side and in WASM. This mostly needs more mission content (§15.2) to exercise it, not a rewrite.
- **Python: doesn't exist yet.** There's no Python sandbox, grader, or UI anywhere in this repo — "the Python part in the game should work well" is a feature to build, not a bug to fix. Needs its own scoped design next session (likely Pyodide in a worker, with the same kind of AST/keyword guard `SandboxRunner` already proves out for SQL) before any implementation.

### 15.5 Excel workspace
`bgap-academy/frontend` already ships a real in-browser spreadsheet (`jspreadsheet-ce` + `hyperformula`), and this repo already depends on the same two packages — so there's a real chance of sharing one component instead of building a second spreadsheet engine from scratch. `BGAP-practice-workspace/` (a separate app at the same `C:\THE BGAP OF AIDLEARN\` level) wasn't opened yet this pass and needs a look next session to see exactly what it is and how it's meant to be reused — this is listed as a plan item, not assumed.

### 15.6 Light theme, shared landing page, shared footer
- `bgap-academy` is already light-themed; Data City's HUD/menus currently use a dark cyberpunk palette (`bgap-dark`/`bgap-cyan`/etc. Tailwind tokens throughout `src/features/game/**/*.tsx`). **Scope question for the owner:** "the whole game should be light mode" most naturally means the 2D UI chrome — HUD panels, DataPhone, garage/shop/wardrobe menus, the landing/entry screen — not the 3D city itself (which is already a bright, lit virtual city by day; "light mode" doesn't map the same way onto a 3D scene's art direction). Proceeding on that reading unless told otherwise.
- Plan: define a shared light palette (ideally as actual shared Tailwind tokens/CSS variables pulled from `bgap-academy/frontend/app/globals.css`, not hand-matched hex values) and re-skin Data City's UI components against it.
- Landing page: build (or redesign) Data City's own entry screen to visually match `bgap-academy`'s `LandingPageClient.js` in tone/typography, and literally reuse `BGAPFooter.jsx` (port the component, or extract it to a package both apps import) rather than hand-copying its markup.

### 15.7 Suggested sequencing
Rough order, biggest/riskiest last since they need the owner's decisions first:
1. Live-verify §12/§15.1's fixes (jacking, driver pose, audio) — cheap, unblocks trusting everything else.
2. §15.2 missions for the 4 empty districts — self-contained, no cross-repo risk, immediately makes the game feel more finished.
3. §15.6 light theme + landing page + shared footer — self-contained within this repo (footer reuse needs one decision: copy vs. shared package).
4. §15.4 Python sandbox — self-contained, but should land after a couple more SQL missions prove out the fixture/grading pattern to reuse.
5. §15.5 Excel workspace — needs `BGAP-practice-workspace/` inspected first.
6. §15.3 backend/database — last, because it's the one item that touches a real, shared, production system and needs explicit sign-off on the architecture questions in §15.3 step 1 and 4 before any code changes land.
