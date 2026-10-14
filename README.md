# BGAP 3D Game — Data City

> **Cinematic Open-World Data Analytics Career Simulator & Hybrid Learning Platform**  
> *Architecture Proposal v1.0 • React / Next.js • Desktop + Mobile Web*

---

## 🌆 Overview

**BGAP Data City** is a hybrid learning platform and real-time 3D adventure game where learners walk around a stylized 3D city, interact with characters, investigate business data, execute live SQL queries in an interactive analytics terminal, and see the consequences of their analysis.

### Core Architectural Principle
> **The 3D game is a presentation and interaction layer; BGAP's backend remains authoritative for learning results, progression, and rewards.**

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) + TypeScript | Accounts, API routing, server evaluation |
| **3D Rendering** | Three.js + React Three Fiber | Real-time WebGL 3D world |
| **Game Utilities** | @react-three/drei | Camera controls, environment, helpers |
| **Physics** | Rapier + @react-three/rapier | Character movement, collisions, proximity triggers |
| **Game State** | Zustand | Fast runtime UI, camera, input, and interaction state |
| **Data Analysis** | Monaco Editor + DuckDB-Wasm | In-browser client SQL queries with zero latency |
| **Server Grading** | Authoritative Evaluation Engine | Hidden test fixtures, anti-tamper rubric grading |
| **Persistence** | PostgreSQL / Supabase | Shared user IDs, missions, attempts, XP ledger |

---

## 📁 Directory Structure

```
src/
├── app/                  # Next.js App Router (Pages, Game entry, API routes)
│   ├── game/             # /game route (GameClient with ssr: false)
│   │   ├── missions/     # /game/missions (Catalog & History)
│   │   └── profile/      # /game/profile (Avatar, Skills Radar, Badges)
│   ├── admin/game/       # /admin/game (Mission publishing & telemetry)
│   └── api/game/         # Authoritative APIs (bootstrap, submit, checkpoint)
├── features/
│   ├── game/             # 3D Game Engine (Canvas, World, Characters, Camera, UI)
│   └── analysis/         # Analytics Terminal (Monaco SQL, DuckDB-Wasm Worker, Rubrics)
├── server/               # Authoritative Backend (Evaluator, Sandbox, Rewards)
├── shared/               # Shared TypeScript types, constants, and math utils
└── db/                   # Database schemas and seed migrations
```

---

## ☕ Chapter 1: The Café Revenue Mystery

- **Setting:** Mama Bisi's Café in BGAP Commercial Boulevard.
- **Problem:** Store is busy every day, but reported revenue dropped sharply.
- **Skill:** SQL (Filtering completed transactions, excluding voided/refunded rows, grouping by date).
- **Execution:**
  1. Spawn at BGAP Academy.
  2. Follow minimap waypoint to Café.
  3. Talk to Café Owner (Cinematic camera switch).
  4. Approach laptop workstation and press **[E]** to launch Analytics Terminal.
  5. Run DuckDB SQL query locally.
  6. Submit to authoritative server endpoint for rubric evaluation.
  7. Earn 150 XP, 500 BGAP Credits, and the **"Data Sleuth"** badge.

---

## 🚀 Quickstart for Development

```bash
# 1. Install dependencies
npm install

# 2. Run Next.js development server
npm run dev

# 3. Visit in browser
# http://localhost:3000/game
```
