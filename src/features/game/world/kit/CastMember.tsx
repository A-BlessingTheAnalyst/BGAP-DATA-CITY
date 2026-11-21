'use client';
import { Suspense, useMemo } from 'react';
import { CharacterModel, Clothing } from './CharacterModel';
import { CharacterDef, HeadPiece, Headwear } from './characters';

// One member of the cast: the rigged Quaternius character with our headwear on top,
// shown only once the model has loaded (no blocky stand-in body in between).

const HATS: Headwear[] = ['gele', 'cap', 'kufi', 'beret', 'helmet', 'chefHat'];

/** Maps the procedural outfit description onto generated clothing for the rigged body. */
export function clothingFor(def: CharacterDef): Clothing {
  const o = def.outfit;
  const g = o.garment;
  const top = g === 'hiVis' ? '#E8F23A' : g === 'apron' ? (o.accent ?? '#F3F1EC') : o.top;
  return {
    top,
    bottom: o.bottom,
    shoes: o.shoes ?? '#1B1C20',
    longSleeves: g === 'suit' || g === 'uniform' || g === 'boubou' || g === 'kaftan',
    dress: g === 'boubou' || g === 'kaftan',
    shorts: g === 'schoolUniform' && (o.height ?? 1) < 0.8,
  };
}

export function CastMember({ def, action, walking, speedScaleRef, actionRef }: { def: CharacterDef; action?: string; walking?: boolean; speedScaleRef?: { current: number }; actionRef?: { current: string } }) {
  const pose = action ?? (walking || def.pose === 'walk' ? 'Walk' : def.pose === 'talk' ? 'Talk' : 'Idle');
  const hat = HATS.includes(def.outfit.head) ? <HeadPiece head={def.outfit.head} color={def.outfit.headColor} /> : undefined;
  const clothing = useMemo(() => clothingFor(def), [def]);
  const look = useMemo(() => ({ ...def.look, skin: def.look.skin ?? def.outfit.skin, hairColor: def.look.hairColor ?? '#2A201C' }), [def]);
  // Remount (fresh mixer + bindings) whenever the look changes. Rebuilding the body in place left
  // the animation bound to the *old* skeleton, so e.g. the player stood in a T-pose after their
  // saved cadet loaded a moment after the first frame.
  const lookKey = useMemo(() => JSON.stringify([look, clothing, def.outfit.head]), [look, clothing, def.outfit.head]);
  return (
    // No placeholder body while the rigged model streams in (the old blocky stand-in read as a
    // caricature robot on first load); the models are preloaded at startup (CharacterModel.tsx).
    <Suspense fallback={null}>
      <CharacterModel key={lookKey} look={look} clothing={clothing} action={pose} headwear={hat} speedScaleRef={speedScaleRef} actionRef={actionRef} />
    </Suspense>
  );
}
