'use client';
import { Suspense, useMemo } from 'react';
import { CharacterModel, Clothing } from './CharacterModel';
import { CharacterDef, HeadPiece, Person, Headwear } from './characters';

// One member of the cast: the rigged Quaternius character with our headwear on top,
// falling back to the procedural figure while the model streams in.

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

export function CastMember({ def, action, walking }: { def: CharacterDef; action?: string; walking?: boolean }) {
  const pose = action ?? (walking || def.pose === 'walk' ? 'Walk' : def.pose === 'talk' ? 'Talk' : 'Idle');
  const hat = HATS.includes(def.outfit.head) ? <HeadPiece head={def.outfit.head} color={def.outfit.headColor} /> : undefined;
  const clothing = useMemo(() => clothingFor(def), [def]);
  const look = useMemo(() => ({ ...def.look, skin: def.look.skin ?? def.outfit.skin, hairColor: def.look.hairColor ?? '#2A201C' }), [def]);
  return (
    <Suspense fallback={<Person outfit={def.outfit} walking={pose === 'Walk'} talking={pose === 'Talk'} />}>
      <CharacterModel look={look} clothing={clothing} action={pose} headwear={hat} />
    </Suspense>
  );
}
