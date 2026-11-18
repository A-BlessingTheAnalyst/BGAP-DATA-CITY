import type { Attempt } from './attempts';
import { targetMinutes } from './attempts';
import type { AttemptView, MissionDef } from '@/shared/types/content';

/** What the terminal may see of an attempt: revealed hints in full, nothing else from the answer key. */
export function toAttemptView(a: Attempt, def: MissionDef): AttemptView {
  return {
    attemptId: a.id,
    missionId: a.missionId,
    startedAt: a.startedAt,
    targetMinutes: targetMinutes(def),
    revealedHints: a.hintLog.map((h) => def.hints[h.index]).filter(Boolean),
    draft: a.draft,
    status: a.status,
  };
}
