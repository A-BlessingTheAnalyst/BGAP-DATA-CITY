import { Badge } from '@/shared/types/user';

// Every mission's badgeId needs an entry here or BadgeService.unlockBadge silently awards
// nothing — found 19 Nov 2026 (masterprompt.md §15.2) that only the first two of these existed
// while every other mission already referenced one of the rest. Backfilled from the missions
// that were already live, not invented as new content.
export const GAME_BADGES: Record<string, Badge> = {
  badge_cafe_sleuth: {
    id: 'badge_cafe_sleuth',
    title: 'Café Data Sleuth',
    description: 'Diagnosed gross vs. recognized revenue discrepancy by excluding voids and refunds.',
    icon: '☕🔍',
  },
  badge_sql_master: {
    id: 'badge_sql_master',
    title: 'SQL Precision Operative',
    description: 'Passed 5 consecutive analytical investigations with 100% rubric score.',
    icon: '⚡📊',
  },
  badge_reconciler: {
    id: 'badge_reconciler',
    title: 'The Short Cash Box',
    description: "Matched a POS tally against the till by hand, catching a slip the register's own total missed.",
    icon: '🧾🔍',
  },
  badge_ranker: {
    id: 'badge_ranker',
    title: 'Restock for the Festive Rush',
    description: 'Ranked products by real revenue, not units sold, after spotting a wholesale-discount trap.',
    icon: '🧵📈',
  },
  badge_fleet_analyst: {
    id: 'badge_fleet_analyst',
    title: 'Running on Empty',
    description: 'Worked out true cost per kilometre across a tricycle fleet, filtering out noise in the repair log.',
    icon: '🛺📉',
  },
  badge_fee_detective: {
    id: 'badge_fee_detective',
    title: 'The Half-Paid Term',
    description: "Reconciled a school's fee ledger against bank reversals to find every family's real balance.",
    icon: '🏫💳',
  },
  badge_cohort_analyst: {
    id: 'badge_cohort_analyst',
    title: 'Which Cohort Really Gets It?',
    description: "Judged cohort mastery by each student's best attempt, not a naive average that punished retries.",
    icon: '🎓📊',
  },
  badge_rate_detective: {
    id: 'badge_rate_detective',
    title: 'The Branch With the Real Problem',
    description: 'Found the branch with the worst loan-default rate, not just the most defaults in raw count.',
    icon: '🏦📉',
  },
  badge_uptime_analyst: {
    id: 'badge_uptime_analyst',
    title: "The Server That's Really Hurting Us",
    description: 'Ranked servers by total downtime, not outage count, catching the one with rare but long failures.',
    icon: '🖥️⏱️',
  },
  badge_margin_analyst: {
    id: 'badge_margin_analyst',
    title: 'Pump the Right Tank',
    description: 'Picked the most profitable fuel by margin, not the one that simply sold the most litres.',
    icon: '⛽💰',
  },
  badge_log_parser: {
    id: 'badge_log_parser',
    title: "The Endpoint That Isn't Actually Busy",
    description: "Parsed a raw request log in Python to find real traffic, filtering out a client's failed retries.",
    icon: '🐍📄',
  },
};

export class BadgeService {
  static async unlockBadge(userId: string, badgeId: string) {
    const badge = GAME_BADGES[badgeId];
    if (!badge) return null;
    console.log('[BADGE] Awarded:', badge.title, 'to user:', userId);
    return { ...badge, unlockedAt: new Date().toISOString() };
  }
}
