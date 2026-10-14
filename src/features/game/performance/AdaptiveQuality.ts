import { GraphicsQuality } from '@/shared/types/game';

export function getRecommendedQuality(): GraphicsQuality {
  if (typeof window === 'undefined') return 'balanced';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) return 'low';
  return 'balanced';
}
