"use client";

import React from 'react';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { EnvironmentLighting } from '../world/EnvironmentLighting';
import { Skybox } from '../world/Skybox';
import { CityBlock } from '../world/CityBlock';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { NPCManager } from '../characters/NPCManager';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { WaypointMarker } from '../missions/WaypointMarker';
import { CafeBuilding } from '../world/Buildings/CafeBuilding';
import { AcademyBuilding } from '../world/Buildings/AcademyBuilding';

export const SceneManager: React.FC = () => {
  return (
    <>
      <EnvironmentLighting />
      <Skybox />

      <PhysicsWorld>
        {/* City Geometry & Environment */}
        <CityBlock />
        <AcademyBuilding position={[0, 0, -25]} />
        <CafeBuilding position={[25, 0, 15]} />

        {/* Dynamic Entities */}
        <PlayerCharacter />
        <NPCManager />

        {/* Mission Objectives Waypoint right over the Café patio laptop workstation */}
        <WaypointMarker position={[28, 2.5, 23.5]} label="Mama Bisi's Café Workstation" />
      </PhysicsWorld>

      {/* Cinematic Camera with occlusion raycasting */}
      <ThirdPersonCamera />
    </>
  );
};
