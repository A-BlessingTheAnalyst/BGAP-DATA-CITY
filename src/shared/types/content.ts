// Mission content format (content/missions/<id>/mission.json and friends).
// Server-only fields (reference SQL, hidden fixtures, which findings are correct) are
// stripped before anything is sent to the browser; see PublicMission.

export type Tier = 1 | 2 | 3 | 4 | 5;
export type Skill = 'SQL' | 'Spreadsheets' | 'Charts' | 'Statistics' | 'Python';

export interface ColumnDef { name: string; type: string; desc: string; pk?: boolean }
export interface TableDef { name: string; description: string; columns: ColumnDef[] }

export interface HintDef { title: string; desc: string; snippet?: string }

export interface FindingOption { id: string; text: string; correct?: boolean }
export interface FindingDef {
  id: string;
  claim: string;
  options: FindingOption[];
  /** Evidence id the player must find in the world before answering this claim. */
  evidence?: string;
}

/** Field evidence (case beat 2): something the player picks up in the world. */
export interface EvidenceDef {
  id: string;
  title: string;
  /** What the player reads when they pick it up. Must agree with the case data. */
  text: string;
  /** World position of the prop (y = height of the surface it lies on). */
  position: [number, number, number];
  prop?: 'book' | 'slip' | 'note';
}

export interface FixtureMeta { id: string; purpose: string; failHint: string }

export interface ClientDef {
  name: string;
  business: string;
  /** Character id from world/kit/characters.ts (CHARACTERS). */
  character?: string;
  /** Lines the client says when you meet them. */
  brief: string[];
  thanks: string;
}

export interface MissionDef {
  id: string;
  kind: 'story' | 'gig';
  tier: Tier;
  skill: Skill;
  title: string;
  client: ClientDef;
  /** Short line for the job board. */
  summary: string;
  pay: number;
  xp: number;
  /** Minutes for the +10% fast-finish bonus (default by tier: 15/25/40/60/90). */
  targetMinutes?: number;
  badgeId?: string;
  passMark: number;
  /** World placement. Remote gigs can be opened from the DataPhone instead. */
  location: { district: string; remote: boolean; npc?: [number, number, number]; workstation?: [number, number, number] };
  starterSql: string;
  tables: TableDef[];
  hints: HintDef[];
  findings: FindingDef[];
  /** Items to find in the world; findings may require them. */
  evidence?: EvidenceDef[];
  successFeedback: string;
  trapFixture: string;
  fixtures: FixtureMeta[];
  /** Spreadsheet missions are solved in workspace.bgap.app (BGAP's Excel workspace) rather than the
   * SQL terminal: these are the deliverables shown there and its own auto-graded checks
   * (same format bgap-academy's challenges use, e.g. { type: 'cell_value_equals', cell, expected }). */
  workspace?: { tool?: 'excel' | 'python' | 'sql'; deliverables: string[]; checks?: unknown[]; passScore?: number };
}

export type Row = Record<string, string | number | null>;

/** What the browser is allowed to see. Hint text is only sent once the server logs the reveal. */
export interface PublicMission extends Omit<MissionDef, 'findings' | 'fixtures' | 'trapFixture' | 'successFeedback' | 'hints'> {
  findings: { id: string; claim: string; options: { id: string; text: string }[]; evidence?: string }[];
  hints: { title: string }[];
}

/** A server-side attempt as the terminal sees it. */
export interface AttemptView {
  attemptId: string;
  missionId: string;
  startedAt: string;
  targetMinutes: number;
  /** Hints already revealed on this attempt, in order (full text). */
  revealedHints: HintDef[];
  draft: string | null;
  status: 'open' | 'passed';
}

export interface PublicMissionDetail extends PublicMission {
  /** The visible dataset: one entry per table. */
  data: Record<string, Row[]>;
}
