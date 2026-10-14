'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
// Original articulated humanoid: independent joints, no third-party asset licensing.
export function Humanoid({ speed = () => 0, speaking = false, shirt = '#146b62', skin = '#915b3b' }: {
 speed?: () => number; speaking?: boolean; shirt?: string; skin?: string;
}) {
 const leftArm = useRef<Group>(null), rightArm = useRef<Group>(null), leftLeg = useRef<Group>(null), rightLeg = useRef<Group>(null), head = useRef<Group>(null);
 const clock = useRef(0), gait = useRef(0);
 useFrame((_, delta) => {
  clock.current += Math.min(delta, 0.05);
  const v = Math.min(speed(), 8);
  gait.current = MathUtils.damp(gait.current, Math.min(1, v / 4), 10, delta);
  const swing = Math.sin(clock.current * (v > 5 ? 13 : 8)) * 0.65 * gait.current;
  if (leftLeg.current) leftLeg.current.rotation.x = swing;
  if (rightLeg.current) rightLeg.current.rotation.x = -swing;
  if (leftArm.current) leftArm.current.rotation.x = -swing * 0.7;
  if (rightArm.current) rightArm.current.rotation.x = speaking ? -0.5 + Math.sin(clock.current * 3) * 0.2 : swing * 0.7;
  if (head.current) head.current.rotation.y = speaking ? Math.sin(clock.current * 1.8) * 0.12 : Math.sin(clock.current) * 0.035;
 });
 const limb = (color: string, height: number, width = 0.12) => <mesh position={[0, -height / 2, 0]} castShadow><capsuleGeometry args={[width, height - width * 2, 4, 8]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>;
 return <group>
  <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[0.48, 0.6, 0.28]} /><meshStandardMaterial color={shirt} roughness={0.85} /></mesh>
  <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[0.36, 0.18, 0.25]} /><meshStandardMaterial color="#263447" /></mesh>
  <group ref={head} position={[0, 1.63, 0]}>
   <mesh castShadow><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color={skin} roughness={0.8} /></mesh>
   <mesh position={[0, 0.08, -0.025]}><sphereGeometry args={[0.205, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#201a1a" /></mesh>
   {[-0.07, 0.07].map(x => <mesh key={x} position={[x, 0.01, 0.185]}><sphereGeometry args={[0.023, 8, 6]} /><meshStandardMaterial color="#171923" /></mesh>)}
   <mesh position={[0, -0.07, 0.185]}><boxGeometry args={[0.075, 0.012, 0.01]} /><meshStandardMaterial color="#542e27" /></mesh>
  </group>
  <mesh position={[0, 1.42, 0]}><cylinderGeometry args={[0.085, 0.085, 0.15, 8]} /><meshStandardMaterial color={skin} /></mesh>
  {[{ ref: leftArm, x: -0.31 }, { ref: rightArm, x: 0.31 }].map(({ ref, x }) => <group key={x} ref={ref} position={[x, 1.35, 0]}>{limb(shirt, 0.42)}<group position={[0, -0.39, 0]}>{limb(skin, 0.3, 0.085)}<mesh position={[0, -0.32, 0]}><sphereGeometry args={[0.09, 8, 6]} /><meshStandardMaterial color={skin} /></mesh></group></group>)}
  {[{ ref: leftLeg, x: -0.11 }, { ref: rightLeg, x: 0.11 }].map(({ ref, x }) => <group key={x} ref={ref} position={[x, 0.78, 0]}>{limb('#263447', 0.65, 0.095)}<mesh position={[0, -0.71, 0.06]} castShadow><boxGeometry args={[0.19, 0.13, 0.32]} /><meshStandardMaterial color="#19202c" /></mesh></group>)}
 </group>;
}
