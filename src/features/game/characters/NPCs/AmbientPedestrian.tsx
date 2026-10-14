'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group,Vector3 } from 'three';
import { Humanoid } from '../Humanoid';
import { useGameState } from '../../engine/GameState';
export function AmbientPedestrian({path}:{path:[number,number,number][]}) {
 const ref=useRef<Group>(null),index=useRef(1),speed=useRef(0);
 useFrame((_,dt)=>{if(!ref.current||path.length<2)return;if(useGameState.getState().isPaused||useGameState.getState().isWorkstationActive){speed.current=0;return;}
 const target=new Vector3(...path[index.current]),dir=target.sub(ref.current.position),distance=dir.length();if(distance<0.1){index.current=(index.current+1)%path.length;return;}
 dir.normalize();ref.current.position.addScaledVector(dir,Math.min(dt,0.04)*1.2);ref.current.rotation.y=Math.atan2(dir.x,dir.z);speed.current=1.2;});
 return <group ref={ref} position={path[0]}><Humanoid shirt="#795a88" speed={()=>speed.current}/></group>;
}
