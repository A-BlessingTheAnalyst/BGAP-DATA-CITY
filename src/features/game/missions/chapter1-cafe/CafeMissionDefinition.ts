import { MissionDefinition } from '@/shared/types/mission';

export const CAFE_MISSION: MissionDefinition = {
  id: 'ch1_cafe_revenue_mystery',
  chapter: 1,
  title: 'The Café Revenue Mystery',
  slug: 'cafe-revenue-mystery',
  briefing:
    'Mama Bisi is perplexed: the café is filled with customers every day, but total reported revenue has plummeted. Investigate her daily transaction ledger, exclude invalid voided/refunded entries, and reveal the true daily earnings.',
  primarySkill: 'SQL',
  difficulty: 'Beginner',
  estimatedMinutes: 15,
  rewards: {
    xp: 150,
    credits: 500,
    badgeId: 'badge_cafe_sleuth',
  },
  objectives: [
    { id: 'obj_meet_owner', description: "Travel to Mama Bisi's Café and receive briefing", completed: false },
    { id: 'obj_run_analysis', description: 'Filter completed sales and calculate daily recognized revenue', completed: false },
    { id: 'obj_present_findings', description: 'Present findings to Mama Bisi to claim certification badge', completed: false },
  ],
  npcId: 'npc_mama_bisi',
  workstationZone: 'ws_cafe_laptop',
  waypoint: [25, 3.5, 15],
};
