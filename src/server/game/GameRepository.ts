import { GameProfile } from '@/shared/types/user';
import { MissionAttempt, MissionDefinition } from '@/shared/types/mission';

// Mock DB store for initial skeleton / development fallback
const mockProfiles: Record<string, GameProfile> = {
  'demo-user-1': {
    userId: 'demo-user-1',
    avatarId: 'analyst_suit_f',
    avatarConfig: {
      outfit: 'corporate_smart',
      colorScheme: 'emerald',
      accessories: ['glasses'],
    },
    level: 2,
    currentXp: 350,
    xpToNextLevel: 500,
    credits: 1200,
    reputationScore: 84,
    careerRank: 'Junior Data Analyst',
    spawnZone: 'academy_plaza',
  },
};

export class GameRepository {
  static async getProfile(userId: string): Promise<GameProfile> {
    return (
      mockProfiles[userId] || {
        userId,
        avatarId: 'default_analyst_m',
        avatarConfig: { outfit: 'casual', colorScheme: 'cyan', accessories: [] },
        level: 1,
        currentXp: 0,
        xpToNextLevel: 200,
        credits: 500,
        reputationScore: 10,
        careerRank: 'Trainee Analyst',
        spawnZone: 'academy_plaza',
      }
    );
  }

  static async updateCheckpoint(
    userId: string,
    zoneId: string,
    position: [number, number, number],
    rotationY: number
  ) {
    console.log('[DB] Checkpoint saved for user:', userId, { zoneId, position, rotationY });
    return true;
  }
}
