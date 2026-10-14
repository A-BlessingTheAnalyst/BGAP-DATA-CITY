'use client';

import React from 'react';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { EnvironmentLighting } from '../world/EnvironmentLighting';
import { Skybox } from '../world/Skybox';
import { CityBlock } from '../world/CityBlock';
import { WorldProps } from '../world/WorldProps';
import { CitySkyline } from '../world/Buildings/CitySkyline';
import { AcademyBuilding } from '../world/Buildings/AcademyBuilding';
import { CafeBuilding } from '../world/Buildings/CafeBuilding';
import { FinancialTower } from '../world/Buildings/FinancialTower';
import { DataCenterBuilding } from '../world/Buildings/DataCenterBuilding';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { NPCManager } from '../characters/NPCManager';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { WaypointMarker } from '../missions/WaypointMarker';

export const SceneManager: React.FC = () => {
  return (
    <>
      <EnvironmentLighting />
      <Skybox />

      {/* Distant Metropolis Skyline (outside physics bounds) */}
      <CitySkyline />

      <PhysicsWorld>
        {/* City Streets, Plaza & Sidewalks */}
        <CityBlock />

        {/* 3D Blender City Props: Streetlights, Benches, Planters, Vehicles, Billboards */}
        <WorldProps />

        {/* Key Architectural Buildings */}
        {/* 1. Education Hub: Academy Building */}
        <AcademyBuilding position={[0, 0, -25]} />

        {/* 2. Commercial Boulevard: Mama Bisi's Café */}
        <CafeBuilding position={[25, 0, 15]} />

        {/* 3. Financial District: Meridian Capital Tower */}
        <FinancialTower position={[-36, 0, 36]} />

        {/* 4. Tech Infrastructure: Data Center Bunker */}
        <DataCenterBuilding position={[-32, 0, -25]} />

        {/* Dynamic Characters */}
        <PlayerCharacter />
        <NPCManager />

        {/* Chapter 1 Investigation Waypoint at Cafe Workstation */}
        <WaypointMarker position={[28, 2.5, 23.5]} label="Mama Bisi's Workstation" />
      </PhysicsWorld>

      {/* Cinematic Third-Person Camera with Occlusion Detection */}
      <ThirdPersonCamera />
    </>
  );
};
