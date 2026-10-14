'use client';
import { useEffect } from 'react';
import { InteractionTarget } from '@/shared/types/game';
export const interactionTargets = new Map<string,InteractionTarget>();
export function InteractionTrigger({target}:{target:InteractionTarget}) {
 useEffect(()=>{interactionTargets.set(target.id,target);return()=>{interactionTargets.delete(target.id);};},[target]);
 return null;
}
