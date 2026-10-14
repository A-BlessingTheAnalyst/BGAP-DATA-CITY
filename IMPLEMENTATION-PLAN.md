# Data City implementation plan

Prepared 14 October 2026 from the local DATA CITY source and the supplied game blueprint. This is a development plan; no game code, dependency installation, database migration, or deployment was performed during this audit.

## The game we are building

An opt-in, single-player, third-person analytics career adventure connected to BGAP's existing accounts and learning records. The first release is one polished district, one controllable humanoid analyst, a café owner, an academy guard, a few ambient pedestrians, and one complete investigation with real SQL practice and trusted grading.

The first success condition is this complete loop:

Enter from BGAP → load saved profile → explore the academy plaza → meet the café owner → accept an assignment → inspect evidence at a laptop → execute SQL → explain the findings to the owner → receive validated rewards → resume the same progress after refresh.

Target visual direction: stylized realism, readable silhouettes, warm daylight, a coherent Nigerian commercial neighborhood, and cinematic conversations. Preserve the existing cyan/emerald interface identity without making every building neon. Start with a compact world whose streets, doors, characters, and mission interactions work reliably.

## What already exists and what remains

| System | Current source | Required work |
|---|---|---|
| Application | Next.js 14 / React 18 / TypeScript, game and supporting pages | Reproducible install, type checks, build, integration contracts |
| Renderer | R3F Canvas, Rapier PhysicsWorld, primitive city geometry | Loading lifecycle, optimized real assets, recovery, quality settings |
| Player | Capsule mesh, world-axis velocity movement | Rigged humanoid, camera-relative movement, capsule collider, acceleration, grounding |
| Animation | CharacterAnimationController logs a clip name | AnimationMixer/actions, per-character instances, crossfades and lifecycle cleanup |
| Camera | Smooth fixed-offset follow and cinematic modes | Mouse/touch orbit, collision handling, real interaction targets |
| NPCs | Primitive meshes and ambient paths | Humanoid models, independent animation, state-specific dialogue, bounded movement |
| Mobile input | Joystick changes appearance on touch | Actual analog movement and camera input, cancellation, movement locking |
| SQL practice | Fixed worker response; hook uses string inspection and JavaScript grouping | Real DuckDB worker, dataset initialization, errors, cancellation, limits |
| Assessment | Query substring checks | Execute server-side against isolated fixtures and grade results |
| Identity | Demo user returned for missing token; any Bearer header treated as verified | Actual Supabase session validation and role checks |
| Persistence | Mock profiles and console-log saves/rewards | Shared database repositories, attempts, checkpoints, atomic reward transactions |
| Mission UI | Client-controlled mission state, static profile and telemetry values | Server-backed lifecycle and truthful display of saved state |

No GLB/glTF/FBX character models or audio assets were found in the folder. No local lockfile or test files were found. Runtime/build validation is a first implementation task, not an outcome established by this audit.

Specific defects to address first:

- `features/analysis/sql-worker/useDuckDb.ts` imports CafeTestData from a relative path that does not point to the existing game mission folder.
- Player movement is not normalized, making diagonal movement faster. Returning early during dialogue/workstation use does not explicitly clear existing horizontal velocity; pause is also not part of the movement guard.
- Updating player transforms through Zustand every frame can rerender subscribers such as camera and proximity components unnecessarily.
- `CameraCollision.ts` is not wired into ThirdPersonCamera. Opening dialogue/workstations does not populate cameraTarget, so the cinematic framing branch is ineffective.
- Independent InteractionTrigger instances can compete for the active target; choose one eligible nearest target centrally.
- The café is a solid box collider. The café owner at approximately `[24, 0.9, 13]` falls within its footprint. Build an accessible interior/doorway or temporarily move the owner to the patio before testing conversations.
- DialogueBox always uses the café dialogue tree, including when the guard is selected. A dialogue option can mark the mission completed locally.
- The terminal starts with the gold query and correct explanation selected. It submits to a hardcoded attempt ID instead of an authenticated persisted attempt.
- The fixed worker output disagrees with the sample data: completed sales on 1 October total NGN115,500, not NGN148,500; the third day's sample has a fractional-currency rounding case. Establish one money representation and derive expected results from fixtures.
- Submission currently grants to `demo-user-1`, and its timestamp-based idempotency key cannot prevent repeated rewards.
- `db/schema.sql` comments describe shared identity, but game_profiles.user_id has no actual auth.users foreign key and the file does not establish RLS policies. It also embeds rubric_config in the mission table; learner APIs must not return hidden answers.

## Architecture and integration ownership

Keep DATA CITY as a dedicated game application initially. Academy remains the account, subscription, curriculum, and learning portal. Practice Workspace remains the existing analytics workspace. All three use the same Supabase project and canonical auth user ID; separate repositories do not imply separate users.

Game runtime: DATA CITY React/Three.js. Game APIs: DATA CITY's existing Next.js API routes. Learning/reward persistence: shared Supabase with explicit game tables and transactional functions. Heavy SQL grading: an isolated worker/container service invoked by the submit route, not a long-running arbitrary query inside the web process.

Configure the real BGAP Supabase URL and keys through the deployment environment; do not copy credentials into source. Add the Supabase client/SSR dependencies currently absent from package.json. Use verified server session cookies where same-origin; for a separate game hostname, use an expiring one-time handoff exchanged server-side for a game session. Avoid repeating the existing access/refresh-token URL transfer pattern. Match allowed redirects, origins, and roles to the actual deployment.

Keep game XP, fictional credits, and reputation distinct from academic skill mastery. Initially award game progression in game_profiles; define an explicit once-only academic award contract if game missions should increase the academy users.xp_points. Do not let both applications independently award the same completion.

Mission and branching systems share versioned content conventions and evidence concepts. Existing short branching cases can later become office encounters; do not make the entire city depend on completing their ongoing refactor. A 3D mission needs location, interaction, analysis, and server state in addition to a dialogue graph.

## Milestone 0 — establish a runnable foundation

Files: package.json, next.config.mjs, tsconfig.json, .env.example, affected imports, API auth scaffolding.

1. Install and lock dependencies; preserve the React 18 / Fiber 8 / Rapier wrapper 1 compatibility family. Avoid upgrading all majors while introducing gameplay.
2. Run type checking and production build. Fix source errors, client/server boundaries, worker bundling, and model-loading paths.
3. Add a documented development port distinct from the academy/workspace, with API origins configured explicitly.
4. Add CI for type checking, meaningful logic tests, and a browser smoke test.
5. Make an explicit development demo mode that is disabled in production. Production APIs must never fall back to a demo identity.

Gate: clean type check/build, game loads and disposes without errors, non-game routes do not download the world bundle, and unauthenticated API calls are rejected.

## Milestone 1 — build the humanoid asset pipeline

Files: characters/PlayerCharacter.tsx, CharacterAnimationController.ts, AvatarCustomization.ts; new characters/HumanoidModel.tsx, asset manifest, asset validation script, public/assets/characters.

Deliverables:

- One analyst body rig with two initial appearance presets; one café-owner character; guard and pedestrian variants using a compatible rig where appropriate.
- Required clips: idle, walk, run, turn, greeting, talking, listening, pointing, and celebration. Sitting/typing is added once workstation positioning is stable.
- Source assets with documented ownership/license and provenance; exported GLB assets, separate simplified physics colliders, and low-detail variants.

Asset procedure: choose/license or create a model → rig and weight it → retarget clips to the same skeleton → check deformation and foot placement → normalize scale/orientation/root → export → optimize → inspect in the game viewer. Asset acquisition or purchases must be a concrete reviewed selection; do not assume a paid character pack exists.

Implement useGLTF loading, SkeletonUtils-based skinned cloning, independent AnimationMixer state for each NPC, idle/walk/run crossfades driven by actual velocity, and cleanup of mixers/resources. Prefer in-place locomotion initially, with physics controlling displacement. Adjust visual root offset to put feet on the ground. Separate player presentation from the collider.

Initial asset budgets, to revise after profiling: roughly 15–25k triangles for the player, 8–15k per near NPC, predominantly 1k textures with selective 2k hero textures, and a small initial visible NPC population. These are engineering targets, not measured constraints or promises.

Gate: recognizable humanoids with independent animations; no sliding feet, shared skeleton distortion, disappearing clones, or animation reset on UI updates.

## Milestone 2 — make exploration feel like a game

Files: PlayerCharacter.tsx, physics/CharacterCollider.tsx, input/*, camera/*, engine/GameState.ts, interactions/InteractionManager.tsx and InteractionTrigger.tsx.

- Implement a dedicated kinematic capsule controller using Rapier shape movement, slope limits, step handling, gravity, and ground snapping. Define one authority for movement and grounding.
- Normalize analog movement and transform it by camera heading. Add acceleration/deceleration, smooth shortest-angle rotation, walking/running, and out-of-bounds recovery.
- Store high-frequency position, velocity, and input in runtime refs/store reads; update HUD snapshots at a lower frequency. Clamp large frame deltas after a background-tab return.
- Add mouse orbit, configurable sensitivity, touch camera drag, analog joystick, sprint, and interaction. Clear input on blur, pointer cancellation, and overlay focus. SQL typing must not move the character.
- Freeze movement on pause/dialogue/workstation; stop velocity as part of mode entry. Keep pause-menu display and simulation pause synchronized.
- Integrate camera occlusion queries excluding player and trigger sensors. Provide stable follow, conversation, and workstation camera targets and transitions.
- Centralize nearest interaction selection with range, facing, mission eligibility, and line-of-sight rules. Populate the camera target from the chosen NPC/desk.

Gate: walk from plaza to café, negotiate curbs/doorways, rotate camera around walls, use desktop/mobile controls, pause safely, and interact with the correct nearby entity.

## Milestone 3 — produce one finished district

Files: world/CityBlock.tsx, Buildings/*, EnvironmentLighting.tsx, Skybox.tsx, characters/NPCManager.tsx, NPCs/*, missions/WaypointMarker.tsx.

Build academy frontage, a short commercial street, an accessible café interior/patio, street furniture, signs, greenery, and a few background buildings. Use modular geometry and consistent real-world scale; separate decorative meshes from colliders. Add visible doors/thresholds with usable collision openings.

Create a district asset manifest with model/texture URLs, versions, bounds, LODs, and license references. Load spawn-area assets first, then café assets. Use instancing for repeated static furniture. Avoid loading a full city at startup.

NPC classes: ambient pedestrians follow bounded routes and stop when blocked; guard answers location/tutorial questions; café owner changes dialogue state with mission progress. Only nearby NPCs need full animation updates. Use visual head tracking and short gestures; procedural idle movement supplements authored clips.

Start with daytime lighting, a limited shadow budget, and ambient audio. Add footsteps and interaction sounds after user input enables audio. Add subtitles and volume controls. Defer traffic/driving, multiplayer, weather, and unrestricted AI NPC conversations.

Gate: cohesive district with an accessible café, recognizable characters, working interiors and interactions, and progressive loading with explicit error/retry states.

## Milestone 4 — wire shared identity, saves, and mission state

Files: server/game/*, server/rewards/*, shared/types/*, app/api/game/*, db/schema.sql and new reviewed migrations.

- Replace SessionValidator, GameRepository, CheckpointService, RewardLedgerService and BadgeService mocks with real implementations.
- Review existing Supabase schemas before migration. Add real foreign keys, constraints, owner-scoped RLS, mission snapshots/versions on attempts, completed rewards uniqueness, badge grants, and necessary indexes. Keep answer keys/fixtures server-only.
- Bootstrap returns verified profile, published learner-safe mission metadata, saved attempt, valid checkpoint, settings, and entitlement state. Initialize HUD/runtime from it.
- Mission start creates or resumes an attempt; save records draft query and permitted progress; submit validates ownership and current state; result reads persisted evaluation. All mutations derive user ID from the session.
- Enforce transitions server-side. Client animation/dialogue does not grant completion. Save at chapter changes, terminal draft debounce, and safe periodic world checkpoints; validate finite coordinates and allowed zone bounds.
- Transactionally persist submission, completion, ledger entries, badge grant, skill record and profile updates. Use stable mission/attempt award keys; repeated or concurrent submit returns the same result without a new award.
- Handle offline saves explicitly and reconcile on reconnect. Do not show 'saved' until the server acknowledges. Restore to a safe spawn if checkpoint geometry changes.

Gate: two accounts cannot access each other's attempts; invalid transitions fail; refresh resumes; concurrent submission awards once; failed persistence does not display a completed reward.

## Milestone 5 — implement real SQL and the complete café mission

Files: analysis/sql-worker/*, sql-editor/*, server/assessment/*, missions/chapter1-cafe/*, app/api/game/attempts/*.

SQL practice:

- Fix imports, instantiate real DuckDB-Wasm, and load the mission dataset into the worker once.
- Replace canned output with request-ID-based worker RPC, typed rows, decimals/dates serialization, initialization progress, errors, cancellation and worker termination/recreation for timeouts.
- Bundle worker/WASM assets on an approved origin. Start with a compatible single-threaded bundle; use cross-origin-isolated threading only after checking its impact on model/CDN/auth dependencies.
- Permit analysis against supplied local tables. Do not expose extension installation, external network readers, or arbitrary resource fetching. Bound time, memory and result sizes.
- Load Monaco and DuckDB only when a terminal is opened. Reduce background simulation cost while editing; release worker memory when appropriate.

Trusted grading:

- Parse SQL statements and permit the supported read-only subset; substring filtering alone is inadequate.
- Execute in an isolated grading worker with bounded CPU/memory/time, no outbound network, no shared application filesystem, and no database credentials in the execution environment.
- Compare result sets on multiple hidden fixtures, including voids, refunds, zero rows, duplicates, quantity > 1, decimal values and date boundaries. Accept equivalent SQL solutions.
- Separate numerical correctness, reporting basis, explanation, and hint usage. Hint usage comes from server events; hidden datasets and reference queries do not ship to browsers.

Café mission:

1. Spawn/tutorial and meet the academy guard.
2. Talk to Mama Bisi, inspect a sales summary, and agree what 'revenue' means.
3. Accept the assignment and approach the laptop.
4. Inspect transaction status and calculate daily recognized revenue using actual SQL.
5. Receive a follow-up evidence item explaining a discrepancy; compare completed orders and reporting totals.
6. Return to Mama Bisi and explain supported findings and limits. A correct aggregation alone cannot establish the cause of a decline without comparison evidence.
7. Receive validated progression, badge and a next-assignment invitation.

Do not prefill the gold solution or select the correct explanation. Reconcile story, dates, numbers, hints, expected results and seed fixtures before authoring extra chapters. Use fixed-point minor currency units or a documented decimal representation with explicit rounding.

Gate: arbitrary SQL is truly executed; invalid SQL errors; equivalent solutions pass; superficially matching wrong queries fail; story explanations follow the evidence; completion survives refresh.

## Milestone 6 — polish, publish, and measure

Files: performance/*, GameCanvas.tsx, GameHUD.tsx, SettingsModal.tsx, FallbackView.tsx, admin/game/page.tsx, new automated tests and telemetry APIs.

- Wire frame-time monitoring into adaptive resolution, shadows, view distance and NPC animation frequency with hysteresis to avoid constant quality oscillation.
- Profile GPU/CPU time, draw calls, memory, loading and long frames. Initial target: 60 FPS on specified desktop hardware and 30 FPS on selected mid-range physical phones. Specify actual devices before claiming success.
- Test pointer capture, touch controls, foreground/background recovery, WebGL context loss, slow networks, worker failures, asset failures and memory pressure.
- Make terminal/dialogue responsive, keyboard-accessible, focus-trapped and readable. Offer reduced motion, subtitles, adjustable sensitivity and a functional non-3D learning path.
- Replace invented admin/player statistics with server records or honest empty states. Protect admin routes. Add mission draft/preview/publish/version controls with validation.
- Telemetry records mission milestones, hint events, validated attempts, recovery and sampled performance with minimal personal data. Evaluate learning with a separate post-test; do not present blueprint learning-gain targets as observed results.

Gate: full browser regression passes, physical-device targets are measured, demo code is excluded from production paths, migration/rollback reviewed, and a learner can complete the mission without developer help.

## Work order and deliverables

| Batch | Deliverable | Dependency |
|---|---|---|
| A | Runnable project, asset specification, authenticated API contracts | Source audit |
| B | Humanoid player, movement, camera, working mobile input | A and a usable rigged asset |
| C | Polished plaza/café with NPCs and cinematic interactions | B |
| D | Shared Supabase persistence and authoritative mission lifecycle | A; can progress alongside B/C |
| E | Real browser SQL, isolated grading, complete café investigation | C and D |
| F | Mobile profiling, accessible fallback, authoring and learner pilot | E |

The supplied 12–16-week roadmap is a planning assumption, not a commitment based on this repository. Re-estimate after a clean build, the first asset integration, and a measured movement prototype. Asset creation/retargeting and grading-service deployment are material work, not small component edits.

## Acceptance tests to add

- Controller: diagonal speed, slope/step behavior, pause stops movement, no fall-through, recovery after tab suspension.
- Camera/input: occlusion, NPC target framing, cancellation, touch movement, keyboard typing isolation.
- Missions: valid transitions, attempt ownership, version pinning, failed submit recovery, one-time reward across retries/concurrency.
- SQL: actual execution, timeout/cancel, decimal consistency, fixture grading, invalid queries, no remote-resource access.
- Browser: login → explore → dialogue → terminal → submit → explain → rewards → refresh/resume; mobile equivalent; fallback equivalent.
- Asset/performance: loading failures, skeleton cloning, missing clip fallback, cleanup, measured frame-time and memory budgets.

## Decisions for the start of implementation

Recommended defaults: separate game deployment, same Supabase identity; stylized realism; one compact daytime district; SQL-first café mission; licensed reusable rigs adapted to BGAP; keyboard/mouse plus touch; fixed simulated case data; no multiplayer or vehicles in the first release.

Before asset acquisition, select a concrete character/environment shortlist with previews, licenses, and costs. Before database/deployment changes, prepare actual migrations, API contracts, and grading-service configuration for review. Local development can proceed on the foundation and asset-independent controller work while those choices are resolved.

## Primary technical references

- [React Three Fiber compatibility](https://r3f.docs.pmnd.rs/next/getting-started/introduction): Fiber 8 pairs with React 18.
- [React Three Rapier compatibility](https://pmndrs.github.io/react-three-rapier/): wrapper v1 supports the React 18/Fiber 8 family.
- [Rapier character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/): stepping, slopes and ground snapping.
- [Three.js game animation](https://threejs.org/manual/pages/game.html): independent cloned animated models and mixers.
- [DuckDB-Wasm deployment](https://www.duckdb.org/docs/current/clients/wasm/deploying_duckdb_wasm): bundles and cross-origin isolation requirements.
