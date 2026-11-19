import fs from 'node:fs';
import path from 'node:path';
import type { MissionDef, PublicMission, PublicMissionDetail, Row, TableDef } from '@/shared/types/content';
import type { CaseFixtures, Cell, Fixture, PyCaseFixtures, PyFixture } from '@/server/assessment/fixtures/types';
import { parseCsv } from './csv';
import { generatedGigs, getGeneratedGig } from './gigs';

// Loads mission packages from content/missions/<id>/:
//   mission.json   definition (see src/shared/types/content.ts)
//   dataset/*.csv  visible data, one file per table
//   reference.sql  canonical answer (server-only)
//   fixtures/<fixtureId>/*.csv  hidden grading data (server-only)
// Generated gigs (./gigs.ts) produce the same package shape in memory.

export const CONTENT_ROOT = path.join(process.cwd(), 'content', 'missions');

export interface MissionPackage {
  def: MissionDef;
  data: Record<string, Row[]>;
  /** Present for SQL missions (reference.sql in the mission's folder). */
  grading?: CaseFixtures;
  /** Present for Python missions (reference.py instead of reference.sql). */
  pyGrading?: PyCaseFixtures;
}

const NUMERIC = /^(TINYINT|SMALLINT|INTEGER|INT|BIGINT|HUGEINT|DOUBLE|FLOAT|REAL|DECIMAL|NUMERIC)/i;

function readTable(file: string, table: TableDef): Row[] {
  const [header, ...rows] = parseCsv(fs.readFileSync(file, 'utf8'));
  const types = new Map(table.columns.map((c) => [c.name, c.type]));
  return rows.map((r) => {
    const row: Row = {};
    header.forEach((h, i) => {
      const raw = r[i] ?? '';
      row[h] = raw === '' ? null : NUMERIC.test(types.get(h) ?? '') ? Number(raw) : raw;
    });
    return row;
  });
}

/** Converts named rows into the grader's fixture tables, in the table's column order. */
export function toFixtureTables(tables: TableDef[], data: Record<string, Row[]>) {
  return tables.map((t) => ({
    name: t.name,
    columns: t.columns.map((c) => `${c.name} ${c.type}`),
    rows: (data[t.name] ?? []).map((r) => t.columns.map((c) => (r[c.name] ?? null) as Cell)),
  }));
}

function loadPackage(dir: string): MissionPackage {
  const def = JSON.parse(fs.readFileSync(path.join(dir, 'mission.json'), 'utf8')) as MissionDef;
  const data: Record<string, Row[]> = {};
  for (const t of def.tables) data[t.name] = readTable(path.join(dir, 'dataset', `${t.name}.csv`), t);

  // Each fixture's per-table rows, computed once and shared by both grading shapes below
  // (a fixture may reuse the visible dataset for a table it doesn't override).
  const fixtureRows: { meta: (typeof def.fixtures)[number]; fxData: Record<string, Row[]> }[] = def.fixtures.map((meta) => {
    const fxData: Record<string, Row[]> = {};
    for (const t of def.tables) {
      const f = path.join(dir, 'fixtures', meta.id, `${t.name}.csv`);
      fxData[t.name] = fs.existsSync(f) ? readTable(f, t) : data[t.name];
    }
    return { meta, fxData };
  });

  const pyFile = path.join(dir, 'reference.py');
  if (fs.existsSync(pyFile)) {
    const pyFixtures: PyFixture[] = fixtureRows.map(({ meta, fxData }) => ({ ...meta, tables: fxData }));
    return {
      def,
      data,
      pyGrading: { missionId: def.id, referencePython: fs.readFileSync(pyFile, 'utf8'), fixtures: pyFixtures, trapFixtureId: def.trapFixture },
    };
  }
  const fixtures: Fixture[] = fixtureRows.map(({ meta, fxData }) => ({ ...meta, tables: toFixtureTables(def.tables, fxData) }));
  return {
    def,
    data,
    grading: { missionId: def.id, referenceSql: fs.readFileSync(path.join(dir, 'reference.sql'), 'utf8'), fixtures, trapFixtureId: def.trapFixture },
  };
}

let cache: Map<string, MissionPackage> | null = null;

function authored(): Map<string, MissionPackage> {
  // Re-read in development so content edits show up without a restart.
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const map = new Map<string, MissionPackage>();
  if (fs.existsSync(CONTENT_ROOT)) {
    for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkg = loadPackage(path.join(CONTENT_ROOT, entry.name));
      map.set(pkg.def.id, pkg);
    }
  }
  cache = map;
  return map;
}

export function listMissions(): MissionPackage[] {
  return [...authored().values(), ...generatedGigs()].sort((a, b) => a.def.tier - b.def.tier || a.def.pay - b.def.pay);
}

export function getMission(id: string): MissionPackage | undefined {
  return authored().get(id) ?? getGeneratedGig(id);
}

export function toPublic(def: MissionDef): PublicMission {
  const { findings, hints, fixtures: _f, trapFixture: _t, successFeedback: _s, ...rest } = def;
  return {
    ...rest,
    hints: hints.map((h) => ({ title: h.title })),
    findings: findings.map((f) => ({ id: f.id, claim: f.claim, options: f.options.map(({ id, text }) => ({ id, text })), ...(f.evidence ? { evidence: f.evidence } : {}) })),
  };
}

export function toPublicDetail(pkg: MissionPackage): PublicMissionDetail {
  return { ...toPublic(pkg.def), data: pkg.data };
}
