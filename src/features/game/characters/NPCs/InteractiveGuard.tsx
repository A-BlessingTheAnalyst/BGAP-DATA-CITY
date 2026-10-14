'use client';
import { Humanoid } from '../Humanoid';
import { InteractionTrigger } from '../../physics/InteractionTrigger';
export function InteractiveGuard({position}:{position:[number,number,number]}) {
 return <group position={position}><Humanoid shirt="#344565"/><InteractionTrigger target={{id:'npc_guard_academy',type:'npc',label:'Academy guide',actionText:'Ask the academy guide',position,radius:2.8}}/></group>;
}
