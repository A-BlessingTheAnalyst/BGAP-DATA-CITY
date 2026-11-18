'use client';
import { EffectComposer, N8AO, Bloom, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, NoToneMapping } from 'three';
import type { GraphicsQuality } from '@/shared/types/game';

// Post-processing stack, tiered by quality:
//  low       → none (phones keep their frame budget)
//  balanced  → half-res ambient occlusion, soft bloom on lit signs, SMAA, ACES tone mapping
//  high      → full-res AO and a light vignette
export function PostFX({ quality }: { quality: GraphicsQuality }) {
  const gl = useThree((s) => s.gl);
  // With the composer active, ACES runs as an effect; otherwise the renderer tone-maps with ACES.
  useEffect(() => {
    gl.toneMapping = quality === 'low' ? ACESFilmicToneMapping : NoToneMapping;
  }, [gl, quality]);
  if (quality === 'low') return null;
  const high = quality === 'high';
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO halfRes={!high} aoRadius={2.5} intensity={high ? 2.2 : 1.6} distanceFalloff={1} color="#2a1a10" />
      <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.45} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {high ? <Vignette eskil={false} offset={0.25} darkness={0.45} /> : <></>}
      <SMAA />
    </EffectComposer>
  );
}
