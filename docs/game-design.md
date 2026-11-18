# Data City: Game Design Document

*Version 1 · November 2026 · living document; change it when the game changes.*

> **Get hired, find the story in the numbers, and climb from a buka's receipt book to a boardroom. Every naira you spend in the city, you earned by analysing data.**

Companion documents: `docs/roadmap.html` (engineering tasks), `CREDITS.md` (third-party assets), `assets/manifest.json` (asset licences).

---

## 1. Identity

### Tone
Warm, funny and Lagos-flavoured. Characters speak Nigerian English and Pidgin, the streets have hustle energy, and office life is gently satirised. Conflict is **social**: traffic arguments, haggling, negotiation, office politics.

**Never:** weapons, violence, crime loops, gambling or real-money purchases.

### Pillars
Every feature has to serve at least one of these.

| Pillar | Means | Test |
|---|---|---|
| **Analysis is the engine** | Money, reputation, access and story come from solving data problems | Can the player get rich without analysing? Then it's wrong. |
| **The city answers back** | Businesses change after you help them; people react to what you do | Does the world look or sound different after this action? |
| **Your hustle, your style** | You choose your look, ride, employers and path | Is there a meaningful choice here? |
| **Readable and fair** | Grading runs your real SQL on hidden data and explains the result | Can the player tell why they lost points? |

### Loops
- **Core loop (5–20 min):** check the DataPhone job board → travel → meet the client → collect evidence → analyse at a workstation → present findings → get paid and gain reputation → spend.
- **Meta loop (hours):** reputation unlocks bigger employers → harder data, bigger pay → attire, cars, office → new districts → driving and then flight licences → story chapters.

---

## 2. Game flow

| Step | What happens | Teaches |
|---|---|---|
| Title | Continue / New Game / Settings / Credits | — |
| Character creator | Quick-pick one of six cadets, or customise | Choice, ownership |
| Arrival | A danfo drops you at Academy Quarter; the conductor shouts the route | Setting, tone |
| Tutorial | Officer Tunde shows you around; first DataPhone message from Dr. Ifeoma | Move, talk, phone |
| Chapter 1 | Mama Bisi's café revenue mystery (Tier 1) | SQL filtering and aggregation; present findings |
| First pay | ₦ arrives in the Wallet; the tailor and keke rides unlock | Earning and spending |
| Open city | The job board lists Tier 1 gigs; story chapters gate the tiers | Player-driven pacing |
| Career ladder | Tiers 1 → 5, new districts open | Skill progression |
| Late game | Own consultancy, licences, aircraft, board-level cases | Mastery, status |

### The DataPhone
The DataPhone is the in-game hub. It opens with **Tab** or the phone icon.

| App | Contents |
|---|---|
| **Jobs** | Gigs and contracts with tier, client, pay, skill, location and time window |
| **Wallet** | ₦ balance, and a ledger of every earning and purchase (from the server) |
| **Map** | Districts, waypoints, fast travel by danfo or BRT (costs a fare) |
| **Contacts** | People you've met, their trust level, favours (borrow a car, tips) |
| **Wardrobe** | Your outfits; changes apply instantly |
| **Garage** | Owned and borrowed vehicles; call the nearest one |
| **Skills** | Radar of the five skill tracks, plus badges |
| **Messages** | Story beats, client follow-ups, job offers |

### Time of day
A light cycle: morning, afternoon, evening. A full day takes about 24 minutes of real time.
- Offices are open 9–5 in-game hours.
- Bukas are busiest at lunch.
- Night markets and nightlife run in the evening.
- Some gigs appear only in their window.

---

## 3. The core: data analysis

### 3.1 Anatomy of a case

| Beat | Player does | System |
|---|---|---|
| **Brief** | Talks to the client, who describes the problem and the data in their own words | Dialogue JSON with conditions and effects |
| **Field evidence** | Finds 1–3 clues in the world (receipt book, staff chat, invoice, counting customers) | Evidence items go into the notebook; some add a dataset |
| **Workstation** | Writes queries in the Analytics Terminal; uses schema, sample rows and tiered hints | DuckDB-Wasm runs in the browser |
| **Present findings** | Argues each claim by choosing supporting evidence (query results and clues) | Replaces the old radio-button explanation |
| **Consequence** | Gets paid, gains reputation, the business changes, follow-ups unlock | Server grader and ledger; world flags |

### 3.2 Skill tracks

| Track | From tier | Tool | Example skills |
|---|---|---|---|
| **SQL** | 1 | SQL terminal | SELECT, WHERE, GROUP BY, JOIN, CASE, window functions, CTEs |
| **Spreadsheets** | 2 | In-game grid with formulas | SUM, IF, VLOOKUP/XLOOKUP, pivots, conditional formatting |
| **Charts and dashboards** | 3 | Chart builder | Choosing the right chart, axes, filters, KPI tiles |
| **Statistics and experiments** | 4 | Guided stats panel | Distributions, A/B significance, confidence, forecasting |
| **Python** | 5 | Pyodide notebook | pandas groupby/merge, plotting, cleaning |

### 3.3 Difficulty tiers

| Tier | Clients | Skills | Data | Pay (₦) | Time limit |
|---|---|---|---|---|---|
| **1 Street** | Buka, kiosk, tailor, barber, POS stand | SELECT, WHERE, SUM/COUNT, GROUP BY | 1 table, under 100 rows | 5k–20k | None |
| **2 SME** | Pharmacy, school, keke fleet, supermarket | JOINs, dates, CASE, cleaning; spreadsheets | 2–3 tables, about 1k rows | 30k–120k | Generous |
| **3 Mid company** | Okeke Foods, Kora Logistics, Atlas Fuel | Window functions, cohorts, KPIs; dashboards | 4–6 tables, about 50k rows | 200k–800k | Business day |
| **4 Corporate** | Meridian Capital, Vantage Insurance, Lumen Telecom | Fraud, churn, forecasting, A/B tests | Multiple sources, messy | 1.5M–6M | Deadlines |
| **5 Board and state** | Conglomerate, BRT authority, ministry | Multi-dataset strategy, board dashboard, memo | Large, conflicting | 10M+ | Milestones |

### 3.4 Grading
- The server runs the player's SQL in DuckDB against **hidden fixtures**: datasets the player never sees, built to catch shortcuts.
- **Comparison:** row order, column names and small numeric differences don't matter.
- **Score:**

  | Component | Weight | How it's measured |
  |---|---|---|
  | Correctness | 50% | Fixture pass rate |
  | Edge cases | 20% | The fixture built for this case's trap (voids, duplicates, nulls…) |
  | Findings | 20% | The evidence chosen in the presentation |
  | Independence | 10% | Hints are logged by the server |

- **Pay** = base pay × score multiplier, plus a speed bonus, minus hint costs. The server grants it **once per attempt**, through an idempotent ledger entry.
- **Feedback** names the fixture that failed ("your query counts voided orders") without revealing the answer.

### 3.5 The first twelve cases

| # | Client · tier | Brief | Data | Trap / lesson | Pay |
|---|---|---|---|---|---|
| 1 | **Mama Bisi's café** · T1 | The café is packed every day, but her printout says revenue fell 40% | `sales` | Voided and refunded rows inflate gross; recognise only completed sales | ₦15k |
| 2 | **Baba Sola's POS kiosk** · T1 | The cash box is short against the POS terminal log | `pos_log`, `cash_book` | Reconcile two lists; find missing or duplicated transactions | ₦12k |
| 3 | **Zee Fabrics** · T1 | Which fabrics should she restock before the festive season? | `sales` | Group, rank, top-N by revenue *and* units (they disagree) | ₦18k |
| 4 | **Sunrise Primary** · T2 | The bursar can't tell who owes fees | `students`, `payments` | LEFT JOIN to find non-payers; partial payments | ₦60k |
| 5 | **Keke fleet owner** · T2 | Fuel spend keeps rising | `trips`, `fuel` | Cost per km per driver; one outlier driver; null odometers | ₦80k |
| 6 | **Grace Pharmacy** · T2 | Too much stock expires on the shelf | `stock`, `sales` | Date logic, FIFO, value of waste; spreadsheet pivot | ₦95k |
| 7 | **Kora Logistics** · T3 | Customers complain about late deliveries | `orders`, `routes`, `drivers` | Window functions, SLA by route and hour; a dashboard | ₦450k |
| 8 | **Okeke Foods** · T3 | Supplier prices creep up quietly | `invoices`, `suppliers`, `items` | Price index over time; chart of creep by supplier | ₦600k |
| 9 | **Lumen Telecom** · T4 | Subscribers are leaving | `customers`, `usage`, `tickets` | Cohort retention, churn drivers; A/B test on an offer | ₦2.5M |
| 10 | **Meridian Capital** · T4 | Defaults are up, but the manager swears the numbers are fine | `loans`, `branches`, `repayments` | Simpson's paradox: the overall rate hides a segment collapse | ₦4M |
| 11 | **Vantage Insurance** · T4 | Some claims smell wrong | `claims`, `policies`, `garages` | Anomaly rules; repeat claimant–garage network | ₦5M |
| 12 | **BRT authority** · T5 | Where should the next buses go? | `taps`, `stops`, `routes`, `survey` | Ridership by stop and hour + survey; recommendation memo | ₦12M |

### 3.6 Procedural side gigs
Templates for Tiers 1–3: sales ledger, inventory, payroll, attendance and delivery log.

1. A generator seeds a realistic dataset for a random fictional business.
2. It injects 1–2 anomalies from a list: duplicates, voids, outliers, nulls, timezone shifts, a mislabeled category.
3. It writes a reference query, so the job always has a correct answer and its own hidden fixtures.

### 3.7 Content format
Every authored case lives in `content/missions/<id>/`:

```
mission.json     id, tier, client, pay, location, time window, beats, unlocks
dialogue.json    nodes with conditions/effects (flags, objectives)
evidence.json    world clues: id, location, text, optional dataset
dataset/*.csv    the data the player queries
reference.sql    the canonical answer
fixtures/*.csv   hidden datasets for grading (server-only)
rubric.json      weights, trap fixture, hint costs, feedback strings
```

A validator in CI checks that `reference.sql` passes every fixture and that every file is consistent.

---

## 4. Economy and career

### Rules
- Money is fictional in-game naira (₦), and **only graded analysis pays meaningfully**.
- Salaried roles at Tier 3+ pay a daily wage while you complete that employer's weekly tasks.
- **Reputation** is tracked per employer and per district (0–100).
  - High reputation: unlocks employers, discounts and lending, and NPCs greet you by name.
  - Failures, abandoned jobs and street incidents reduce it.
- **Ranks** come from reputation plus badges: Cadet → Junior Analyst → Analyst → Senior → Lead → Principal → Partner.

### Price list (starting values; tune in playtests)

| Category | Item | Price (₦) | Effect |
|---|---|---|---|
| Transport | Keke ride | 300 | Short fast travel |
| | Danfo fare | 500 | District fast travel |
| | BRT weekly pass | 2,000 | Unlimited BRT fast travel |
| Attire: casual | T-shirt / jeans / sneakers | 5k–30k | Style |
| Attire: corporate | Shirt + tie | 50k | Required at Tier 4 front desks |
| | Suit / office dress | 250k–600k | Better client first impressions (+pay on T4–5) |
| Attire: traditional | Buba & sokoto / iro & buba | 40k–120k | Bonus with traditional businesses |
| | Agbada / aso-oke + gele | 300k–900k | Events; big bonus with elders and family firms |
| Licences | Driving school | 200k | Drive owned or borrowed cars |
| | Flight school | 15M | Chopper and light plane |
| Vehicles | Used hatchback | 1.5M | Own car |
| | Keke (business) | 2.5M | Earns ride fares when idle |
| | SUV | 12M | Faster; prestige with corporate clients |
| | Luxury sedan | 40M | Prestige |
| Aircraft | Light plane | 120M | District flights |
| | Chopper | 500M | Rooftop helipads |
| Workspace | Laptop upgrade | 100k | Bigger result preview, +1 free hint per case |
| | Co-working desk | 1M | Workstation in each district |
| | Own office | 20M | Start your consultancy; hire NPC analysts (late game) |

### Ways to get a car
- **Hail:** a taxi or danfo; pay the fare; skip to the destination.
- **Borrow:** from a contact with trust ≥ 60, for 1 in-game day. Damage or a late return costs trust and money.
- **Rent:** hourly, at a rental point.
- **Buy:** at the dealership; the car is kept in your garage.

---

## 5. Characters

### Player character creator
- **Quick pick:** six preset cadets with different bodies, skin tones, hairstyles and starting outfits.
- **Custom:** body (female/male), skin tone slider across the African palette, hairstyle, eyebrows, and starting outfit colours.
- **Tech:** built on `CharacterModel` and `CastMember` (Quaternius base bodies, shared skeleton, generated clothing, headwear that follows the head).

### Wardrobe
- An outfit catalog with slots: top, bottom, dress, shoes, headwear, accessory, colour and pattern.
- **Now:** generated clothing with fabric patterns (ankara, aso-oke, pinstripe).
- **Later:** authored Blender outfit meshes on the same skeleton (wide-sleeved agbada, gele variants, tailored suits) swap in through the same catalog.
- **Shops:** a tailor on Market Boulevard, a boutique on Finance Row, a mall later. Try outfits on before you buy.

### Story cast

| Character | Role | Where |
|---|---|---|
| Mama Bisi | Café owner, Chapter 1 client | Market Boulevard |
| Officer Tunde | Academy guard, tutorial guide | Academy Quarter |
| Dr. Ifeoma Nwosu | Lead lecturer, sends assignments | Academy Quarter |
| Kemi Bello | Fellow cadet, rival and friend | Everywhere |
| Baba Sola | Kiosk owner, rumour source | Market Boulevard |
| Chef Amaka | Café cook, knows the real plate count | Market Boulevard |
| Mr. Kunle Adeyemi | Meridian Capital branch manager | Finance Row |
| Chidi Okafor | Datacore systems engineer | Tech Park |

---

## 6. Movement and animation

| Context | Animations (Quaternius Universal Animation Library) |
|---|---|
| Locomotion | Idle, Walk, Jog, Sprint; turn-in-place; Jump start/loop/land |
| Work | Sitting enter / idle / talking / exit; Interact; PickUp_Table |
| Social | Idle_Talking; Interact as a wave or gesture |
| Street conflict | Push_Loop (a driver pushes you out of the road) |
| Vehicles | Driving_Loop |

- Playback speed matches movement speed, so feet don't slide.
- NPCs vary their idles (phone, chatting pairs, benches) and turn their heads to look at the player.

**Camera modes:** follow (with wall collision), conversation (over the shoulder), workstation, vehicle chase, flight.

---

## 7. Vehicles and aviation
- **Driving:** the Rapier ray-cast vehicle controller with arcade tuning and a chase camera. Press **E** to enter or exit.
- **Traffic AI v2:** a lane graph with junctions, traffic lights and give-way rules.
  - Danfos stop at bus stops while conductors call routes.
  - Cars look ahead with raycasts so they stop for the player and for each other.
- **Incidents:** bumping cars or people costs reputation and a "settle it" fine, and a mechanic repairs damage. No injuries; it stays comedic.
- **Aviation (late game):** an Airfield district and a flight-school lesson for the licence.
  - The chopper uses a hover model.
  - The light plane uses a simple lift/drag model.
  - Helipads sit on the bank roof and in Tech Park.
  - Aerial survey gigs give Tier 5 cases a new kind of data.

---

## 8. A street that reacts

### Driver behaviour
Each traffic vehicle runs a state machine, using yuka's `StateMachine`.

| Time blocked | Driver does |
|---|---|
| 0 s | Brakes and stops behind the obstacle |
| 1.5 s | **Horn** (sound, horn emote) |
| 4 s | **Shouts** a line, shown as a subtitle over the car |
| 9 s | **Gets out, walks over and pushes you** aside (Push_Loop plus a gentle impulse), then drives off |
| Cleared | "Thank you o" or a grumble; resumes |

Cars queued behind also honk, staggered and quieter. After a long jam, a danfo may mount the kerb and go round.

### Pedestrian behaviour
- **Bumped:** a short shout.
- **Player sprints through the crowd:** people sidestep and comment.
- **A loud argument nearby:** onlookers gather, comment, then disperse.
- **Well-dressed player:** occasional compliments.
- **Player with high district reputation:** greetings by name.

### Barks (sample lines)
The full table lives in `content/barks.json`, with situation, speaker type, weight and cooldown for each line.

| Situation | Lines |
|---|---|
| Blocked driver | "Oya comot for road!" · "You no get eye?" · "Abeg shift, I dey late!" |
| Driver pushes | "Na so una dey do for this city?" · "Commot jor!" |
| Cleared | "Thank you o." · "Ehen, better." |
| Bumped pedestrian | "Ah! Watch where you dey go!" · "Sorry o — no wahala." |
| Trader | "Fine tomato! Buy two, I go dash you one!" · "Customer, come see!" |
| Danfo conductor | "Academy–Market! Enter with your change!" · "Last stop, Finance Row o!" |
| Compliment | "See as you fine! Na corporate be this?" |

### Audio
CC0 horn, crowd, conductor and generator sounds, played through `AudioManager` (howler) with positional audio.

---

## 9. Guardrails
- No real-money purchases, gambling or loot boxes.
- No weapons or violence. Conflict ends in shouting, a push or a fine.
- All companies, brands and characters are fictional and original.
- All third-party assets are CC0/CC-BY, enforced by `assets/manifest.json`.
- Money and inventory are **server-authoritative**. The client never grants itself money.

---

## 10. Build phases
These are summarised here; each one ends in something playable.

| Phase | Delivers |
|---|---|
| 0 | This document and its page |
| **A** | **Real grading, job board, wallet, pay**, evidence-based findings, Chapter 1 ported, two more Tier 1 cases, procedural Tier 1 gigs |
| B | Character creator, wardrobe, tailor shop |
| C | Reactive street: traffic lights, honking, shouting, pushing, crowd reactions, barks |
| D | Vehicles: enter, drive, hail, borrow, rent, buy, garage, mechanic |
| E | Career content: Tiers 2–4, Ilé Gardens and Finance Row, spreadsheet and chart tools, salaried contracts |
| F | Aviation: airfield, licence, chopper, plane, helipads |
| G | Polish, mobile, accessibility, telemetry, launch |
