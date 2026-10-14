'use client';

import React, { useMemo } from 'react';

export const CitySkyline: React.FC = () => {
  // Generate a perimeter of 32 skyscrapers of varied dimensions & neon accents
  const towers = useMemo(() => {
    const list: {
      x: number;
      z: number;
      width: number;
      depth: number;
      height: number;
      color: string;
      glowColor: string;
    }[] = [];

    const radius = 95;
    const count = 36;
    const colors = ['#0B0F19', '#111827', '#0F172A', '#0D1424', '#0A101D'];
    const glows = ['#00F2FE', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = radius + (i % 3) * 15;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const width = 16 + (i % 4) * 6;
      const depth = 16 + ((i * 3) % 4) * 6;
      const height = 45 + (i % 7) * 14;
      const color = colors[i % colors.length];
      const glowColor = glows[i % glows.length];

      list.push({ x, z, width, depth, height, color, glowColor });
    }
    return list;
  }, []);

  return (
    <group>
      {towers.map((t, idx) => (
        <group key={idx} position={[t.x, 0, t.z]}>
          {/* Main Skyscraper Body */}
          <mesh position={[0, t.height / 2, 0]}>
            <boxGeometry args={[t.width, t.height, t.depth]} />
            <meshStandardMaterial color={t.color} roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Glowing Vertical Architectural Light Strip */}
          <mesh position={[0, t.height / 2, t.depth / 2 + 0.1]}>
            <planeGeometry args={[0.8, t.height * 0.9]} />
            <meshBasicMaterial color={t.glowColor} />
          </mesh>

          {/* Rooftop Antenna Spire */}
          <mesh position={[0, t.height + 6, 0]}>
            <cylinderGeometry args={[0.08, 0.4, 12, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>

          {/* Red Aviation Warning Beacon on Roof */}
          <mesh position={[0, t.height + 12.1, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
