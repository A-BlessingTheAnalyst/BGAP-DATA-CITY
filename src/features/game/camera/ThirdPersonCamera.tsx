'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster } from 'three';
import { useGameState } from '../engine/GameState';
import { playerRuntime } from '../characters/PlayerCharacter';
import { runtimeInput } from '../input/InputManager';
export function ThirdPersonCamera() {
 const {camera,gl,scene}=useThree(),look=useRef(new Vector3()),ray=useRef(new Raycaster());
 useEffect(()=>{
  let drag=false,x=0,y=0;
  const down=(e:PointerEvent)=>{if(e.button===0||e.button===2){drag=true;x=e.clientX;y=e.clientY;gl.domElement.setPointerCapture(e.pointerId);}};
  const move=(e:PointerEvent)=>{if(!drag||useGameState.getState().isPaused||useGameState.getState().isDialogueActive||useGameState.getState().isWorkstationActive)return;runtimeInput.yaw-=(e.clientX-x)*0.005;runtimeInput.pitch=Math.max(0.1,Math.min(1.1,runtimeInput.pitch+(e.clientY-y)*0.005));x=e.clientX;y=e.clientY;};
  const up=()=>{drag=false;},context=(e:Event)=>e.preventDefault();
  gl.domElement.style.touchAction='none';gl.domElement.addEventListener('pointerdown',down);gl.domElement.addEventListener('pointermove',move);gl.domElement.addEventListener('pointerup',up);gl.domElement.addEventListener('pointercancel',up);gl.domElement.addEventListener('contextmenu',context);
  return()=>{gl.domElement.removeEventListener('pointerdown',down);gl.domElement.removeEventListener('pointermove',move);gl.domElement.removeEventListener('pointerup',up);gl.domElement.removeEventListener('pointercancel',up);gl.domElement.removeEventListener('contextmenu',context);};
 },[gl]);
 useFrame((_,dt)=>{
  const s=useGameState.getState(),p=playerRuntime.position, target=new Vector3(p.x,p.y+0.8,p.z);
  let desired=new Vector3(p.x+Math.sin(runtimeInput.yaw)*5*Math.cos(runtimeInput.pitch),p.y+1.3+Math.sin(runtimeInput.pitch)*5,p.z+Math.cos(runtimeInput.yaw)*5*Math.cos(runtimeInput.pitch));
  if(s.cameraMode!=='follow'&&s.cameraTarget){target.set(s.cameraTarget[0],s.cameraTarget[1]+1.2,s.cameraTarget[2]);desired.copy(target).add(new Vector3(2,0.4,3));}
  const dir=desired.clone().sub(target),distance=dir.length();ray.current.set(target,dir.normalize());ray.current.far=distance;
  const blockers=scene.children.filter(c=>c.userData.cameraBlocker);
  const hits=ray.current.intersectObjects(blockers,true);if(hits[0])desired.copy(target).addScaledVector(dir,Math.max(0.6,hits[0].distance-0.3));
  const factor=1-Math.exp(-8*Math.min(dt,0.05));camera.position.lerp(desired,factor);look.current.lerp(target,factor);camera.lookAt(look.current);
 });
 return null;
}
