export interface GameProfile {
  userId: string;
  avatarId: string;
  avatarConfig: {
    outfit: string;
    colorScheme: string;
    accessories: string[];
  };
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  credits: number;
  reputationScore: number;
  careerRank: string;
  spawnZone: string;
}

export interface SkillMasteryItem {
  skillKey: string;
  name: string;
  category: 'SQL' | 'Business' | 'Analytics';
  masteryScore: number;
  assessmentsCount: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}
