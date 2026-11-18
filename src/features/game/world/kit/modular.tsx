'use client';
import { useMemo } from 'react';
import { InstancedKit, Placement } from './InstancedKit';
import { KitRef } from './KitModel';
import { BAY, FLOOR, modularSize, type ModularSpec } from './kitData';

export { modularSize };
export type { ModularSpec };
import { Box, Sign, WaterTank, ACUnit, V3 } from './parts';

// Assembles buildings from Quaternius Downtown City MegaKit modules (CC0): 2 m wall bays,
// 3 m floors, shopfront ground floor, window floors above, corner columns, cornice and roof.
// Every piece type is drawn as one instanced mesh, so a whole block costs a few draw calls.

const P = (name: string) => `quaternius-downtown/${name}` as KitRef;
type Side = { origin: (i: number) => [number, number]; rot: number; count: number; front?: boolean };

export function ModularBuilding({ spec }: { spec: ModularSpec }) {
  const { bays, depth, floors } = spec;
  const W = bays * BAY, D = depth * BAY, H = floors * FLOOR;
  const win = spec.window ?? 'Brick_Window_Trim';
  const sideWin = spec.sideWindow ?? 'Brick_Window_Square_Single';
  const shop = spec.shopfront ?? 'Metal_FirstFloor_Window';
  const cornice = spec.cornice ?? 'Cornice_Brick_Center';

  const pieces = useMemo(() => {
    const out: Record<string, Placement[]> = {};
    const put = (name: string, position: V3, rotationY = 0) => (out[name] ??= []).push({ position, rotationY });
    // Each wall piece faces +Z with its back 0.2 m behind its origin.
    const sides: Side[] = [
      { origin: (i) => [-W / 2 + BAY / 2 + i * BAY, D / 2], rot: 0, count: bays, front: true },
      { origin: (i) => [W / 2 - BAY / 2 - i * BAY, -D / 2], rot: Math.PI, count: bays },
      { origin: (i) => [W / 2, D / 2 - BAY / 2 - i * BAY], rot: Math.PI / 2, count: depth },
      { origin: (i) => [-W / 2, -D / 2 + BAY / 2 + i * BAY], rot: -Math.PI / 2, count: depth },
    ];
    for (const side of sides) {
      for (let i = 0; i < side.count; i++) {
        const [x, z] = side.origin(i);
        const door = side.front && i === Math.floor(side.count / 2);
        put(side.front ? (door ? 'DoorFrame_Metal_Single' : shop) : 'Metal_FirstFloor_Wall', [x, 0, z], side.rot);
        if (door) put('Door_2', [x + 0.5, 0, z - 0.05], side.rot);
        for (let f = 1; f < floors; f++) {
          const piece = side.rot === 0 || side.rot === Math.PI ? win : (i + f) % 2 ? sideWin : 'Brick_Plain_3';
          put(piece, [x, f * FLOOR, z], side.rot);
        }
        put(cornice, [x, H, z], side.rot);
      }
    }
    // Corner columns hide the seams where walls meet.
    const corners: [number, number, number][] = [[W / 2, D / 2, 0], [-W / 2, D / 2, -Math.PI / 2], [-W / 2, -D / 2, Math.PI], [W / 2, -D / 2, Math.PI / 2]];
    for (const [x, z, r] of corners) {
      for (let f = 0; f < floors; f++) put(f === 0 ? 'Brick_CornerColumn_Bottom' : f === floors - 1 ? 'Brick_CornerColumn_Top' : 'Brick_CornerColumn_Center', [x, f * FLOOR, z], r);
      put('Brick_CornerColumn_Cap', [x, H - 2, z], r);
    }
    // Flat roof tiles.
    for (let x = -W / 2 + 2; x < W / 2; x += 4) for (let z = -D / 2 + 2; z < D / 2; z += 4) put('Roof_4x4', [x, H + 0.02, z]);
    return out;
  }, [W, D, H, bays, depth, floors, win, sideWin, shop, cornice]);

  return (
    <group>
      {/* Dark core behind the façade so windows never show daylight through the building. */}
      <Box size={[W - 0.5, H, D - 0.5]} position={[0, H / 2, 0]} color="#2B2B30" cast={false} />
      {Object.entries(pieces).map(([name, items]) => <InstancedKit key={name} kit={P(name)} items={items} />)}
      {spec.sign && <Sign text={spec.sign.text} sub={spec.sign.sub} w={Math.min(W * 0.7, 10)} h={1.2} position={[0, FLOOR + 0.25, D / 2 + 0.35]} bg={spec.sign.bg} fg={spec.sign.fg ?? '#FFFFFF'} lit />}
      <WaterTank position={[-W / 4, H + 0.05, -D / 4]} />
      <WaterTank position={[W / 4, H + 0.05, -D / 4]} />
      <ACUnit position={[W / 2 - 1.5, FLOOR * 1.6, D / 2 + 0.3]} />
    </group>
  );
}
