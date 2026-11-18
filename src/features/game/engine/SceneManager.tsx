'use client';

import React from 'react';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { EnvironmentLighting } from '../world/EnvironmentLighting';
import { Skybox } from '../world/Skybox';
import { WorkstationDesk } from '../world/Buildings/WorkstationDesk';
import { MarketBoulevard } from '../world/kit/district';
import { City } from '../world/kit/City';
import { Pedestrians, Traffic } from '../world/kit/streetLife';
import { CITY_LANES, CITY_WALKWAYS } from '../world/kit/cityPlan';
import { PlayerCharacter, playerRuntime } from '../characters/PlayerCharacter';
import { CafeOwnerNPC } from '../characters/NPCs/CafeOwnerNPC';
import { InteractiveGuard } from '../characters/NPCs/InteractiveGuard';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { MissionClients } from '../world/MissionClients';
import { CustomWaypoint } from '../world/CustomWaypoint';
import { TailorCounter } from '../world/TailorCounter';
import { CityAudio } from '../audio/CityAudio';
import { MARKET_LAYOUT } from '@/shared/constants/marketLayout';

// The game world: the whole city from the master plan (world/kit/cityPlan.ts), the hand-dressed
// Market Boulevard core on top, city-wide traffic and a crowd that follows the player,
// then the story characters, the player and the camera (inside physics, for occlusion rays).
export const SceneManager: React.FC = () => {
  const { laptop, owner } = MARKET_LAYOUT.cafe;
  return (
    <>
      <EnvironmentLighting />
      <Skybox />

      <PhysicsWorld>
        {/* Ground slab under the whole city */}
        <City physics />
        <MarketBoulevard physics streets={false} life={false} />
        <Traffic lanes={CITY_LANES} />
        <Pedestrians walkways={CITY_WALKWAYS} count={22} focus={playerRuntime.position} />

        {/* Chapter 1 story points */}
        <WorkstationDesk position={laptop} workstationId="ws_cafe_laptop" />
        <CafeOwnerNPC position={owner} />
        <InteractiveGuard position={MARKET_LAYOUT.guard} />
        {/* Clients from the mission files, plus the waypoint for the tracked job */}
        <MissionClients />
        <CustomWaypoint />
        <TailorCounter />

        <PlayerCharacter />
        <ThirdPersonCamera />
      </PhysicsWorld>

      <CityAudio />
    </>
  );
};
