import { MissionState } from '@/shared/types/mission';

export class MissionStateMachine {
  private state: MissionState;

  constructor(initial: MissionState = 'available') {
    this.state = initial;
  }

  getState(): MissionState {
    return this.state;
  }

  transition(next: MissionState): boolean {
    const validTransitions: Record<MissionState, MissionState[]> = {
      locked: ['available'],
      available: ['active'],
      active: ['analysis', 'failed'],
      analysis: ['submitted', 'active'],
      submitted: ['completed', 'failed', 'analysis'],
      completed: [],
      failed: ['active', 'analysis'],
    };

    if (validTransitions[this.state]?.includes(next)) {
      this.state = next;
      console.log('[MISSION STATE] Transitioned to:', next);
      return true;
    }
    console.warn(`[MISSION STATE] Invalid transition from ${this.state} to ${next}`);
    return false;
  }
}
