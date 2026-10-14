export type AnimationClipName = 'idle' | 'walk' | 'run' | 'interact' | 'sit_typing';

export class CharacterAnimationController {
  private currentClip: AnimationClipName = 'idle';

  setClip(next: AnimationClipName) {
    if (this.currentClip === next) return;
    this.currentClip = next;
    console.log('[ANIMATION] Blend to:', next);
  }

  getCurrentClip(): AnimationClipName {
    return this.currentClip;
  }
}
