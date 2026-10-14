export type MissionState =
  | 'locked'
  | 'available'
  | 'active'
  | 'analysis'
  | 'submitted'
  | 'completed'
  | 'failed';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface MissionRubricWeight {
  calculation: number;
  filter: number;
  explanation: number;
  independence: number;
}

export interface MissionDefinition {
  id: string;
  chapter: number;
  title: string;
  slug: string;
  briefing: string;
  primarySkill: 'SQL' | 'Excel' | 'Python' | 'PowerBI';
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  rewards: {
    xp: number;
    credits: number;
    badgeId?: string;
  };
  objectives: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  npcId: string;
  workstationZone: string;
  waypoint: [number, number, number];
}

export interface MissionAttempt {
  id: string;
  userId: string;
  missionId: string;
  status: MissionState;
  currentStep: number;
  draftQuery?: string;
  hintsUsed: number;
  startedAt: string;
  completedAt?: string;
}

export interface MissionSubmissionPayload {
  attemptId: string;
  missionId: string;
  query: string;
  explanationId?: string;
  clientTimeMs: number;
}

export interface MissionEvaluationResult {
  isPassed: boolean;
  totalScore: number;
  scoreBreakdown: {
    calculation: number;
    filter: number;
    explanation: number;
    independence: number;
  };
  feedback: string;
  xpEarned: number;
  creditsEarned: number;
  badgeAwarded?: string;
}
