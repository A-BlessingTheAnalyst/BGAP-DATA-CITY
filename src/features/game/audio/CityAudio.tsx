'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CityAmbience } from './CityAmbience';
import { playerRuntime } from '../characters/PlayerCharacter';
import { streetRuntime } from '../world/kit/streetLife';
import { districtAt, MARKET_PIECES } from '../world/kit/cityPlan';

// Point sources that hum: the market generator and the Datacore Hub's cooling plant.
const HUMS = [
  { x: MARKET_PIECES.generator.position[0], z: MARKET_PIECES.generator.position[2], hz: 55, gain: 0.05 },
  { x: 140.5, z: -60, hz: 98, gain: 0.03 },
];

/** Drives the procedural city soundscape from the camera, player and street life each frame. */
export function CityAudio() {
  const amb = useRef<CityAmbience | null>(null);
  const fwd = useRef(new Vector3());
  useEffect(() => () => { amb.current?.dispose(); amb.current = null; }, []);
  useFrame(({ camera }, dt) => {
    amb.current ??= CityAmbience.create();
    if (!amb.current) return;
    camera.getWorldDirection(fwd.current);
    const p = playerRuntime.position;
    amb.current.update(Math.min(dt, 0.1), {
      listener: camera.position,
      forward: fwd.current,
      player: p,
      district: districtAt(p.x, p.z),
      vehicles: streetRuntime.vehicles,
      pedestrians: streetRuntime.pedestrians,
      hums: HUMS,
    });
  });
  return null;
}
