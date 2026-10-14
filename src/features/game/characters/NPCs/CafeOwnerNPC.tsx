'use client';
import { Humanoid } from '../Humanoid';
import { InteractionTrigger } from '../../physics/InteractionTrigger';
import { useGameState } from '../../engine/GameState';
export function CafeOwnerNPC({position}:{position:[number,number,number]}) {
 const speaking=useGameState(s=>s.isDialogueActive&&s.activeNpcId==='npc_mama_bisi');
 return <group position={position}><Humanoid shirt="#c58137" skin="#7c482f" speaking={speaking}/><InteractionTrigger target={{id:'npc_mama_bisi',type:'npc',label:'Mama Bisi',actionText:'Speak with Mama Bisi',position,radius:2.8}}/></group>;
}
