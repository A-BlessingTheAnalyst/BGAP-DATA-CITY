# Data City: Master Prompt

> **What this file is.** The complete working context for Data City: what the game is, how the code is organised, every route, how to run and test it, what is done, what is broken, and every remaining phase with concrete next steps.
>
> Hand this file to any developer or AI assistant picking up the project. Read it top to bottom before changing anything, and **update it whenever a phase lands**.
>
> *Last updated: 18 November 2026 (Phase G: accessibility settings — reduced motion, large text, colour-blind-safe traffic lights) · branch `feat/world-kit` · nothing committed since `f871d51`.*

---

## 0. Instructions for whoever picks this up

1. **Respect the owner's standing rules (section 1)**, especially: do not push to the remote until the owner asks.
2. **Run the game and the checks first** (section 4) so you see the current state.
3. **Work phase by phase** (section 11). Phase A is done; Phase B is next.
4. **Keep data analysis at the centre.** Every feature must serve the four pillars (section 2). Money only comes from graded analysis.
5. **After each phase:**
   - run `npm run type-check`, `npm run build`, `npm run test:grader`, `npm run validate:missions` and `npm run validate:layout`;
   - play the change in the browser;
   - update section 10 (status) and section 11 (phases) of this file.
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

## 12. Immediate next steps (do these first)
1. Commit the branch (owner's call) and push when the owner says so, so CI runs for the first time; fix anything it finds.
2. Play the expanded city in a normal browser window and measure fps (the desktop pane throttles); if it's under 60 on desktop, merge landmark geometry first.
3. Start **Phase B**: the character creator overlay before first spawn (quick-pick cadets, then custom skin, hair and outfit colours), saved to the profile on the server.
4. Then the outfit catalog (`content/outfits.json`) and the tailor shop with `POST /api/game/shop/buy` writing a ledger `purchase`.
5. Update §10 and §11 here as each lands.

---

## 13. Conventions
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
