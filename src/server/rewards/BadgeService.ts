import { Badge } from '@/shared/types/user';

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
};

export class BadgeService {
  static async unlockBadge(userId: string, badgeId: string) {
    const badge = GAME_BADGES[badgeId];
    if (!badge) return null;
    console.log('[BADGE] Awarded:', badge.title, 'to user:', userId);
    return { ...badge, unlockedAt: new Date().toISOString() };
  }
}
