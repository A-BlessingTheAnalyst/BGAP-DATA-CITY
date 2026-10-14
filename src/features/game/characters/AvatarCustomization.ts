export interface AvatarStyle {
  id: string;
  name: string;
  primaryColor: string;
  suitType: string;
}

export const AVAILABLE_AVATARS: AvatarStyle[] = [
  { id: 'analyst_emerald', name: 'Emerald Ops Suit', primaryColor: '#10B981', suitType: 'tactical_business' },
  { id: 'analyst_cyan', name: 'Cyber Blue Tuxedo', primaryColor: '#00F2FE', suitType: 'corporate_elite' },
  { id: 'analyst_gold', name: 'Executive Gold', primaryColor: '#F59E0B', suitType: 'leadership' },
];
