'use client';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Bone, BufferAttribute, BufferGeometry, Color, Group, Material, Mesh, MeshStandardMaterial, Object3D, Skeleton, SkinnedMesh, Vector3 } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { kitInfo, KitRef } from './KitModel';

// Rigged characters on Quaternius' Universal Base Characters (CC0). Bodies, hair and
// the Universal Animation Library all share one 65-bone UE-style skeleton, so any clip
// plays on any body with no retargeting. Hair meshes are re-bound to the body's bones.

export type Body = 'female' | 'male';
export type Hair = 'Hair_Buns' | 'Hair_Buzzed' | 'Hair_BuzzedFemale' | 'Hair_Long' | 'Hair_SimpleParted' | 'Hair_Beard' | 'none';

/** Our gameplay animation names → clips in the Universal Animation Library. */
export const CLIP: Record<string, string> = {
  Idle: 'Idle_Loop',
  Talk: 'Idle_Talking_Loop',
  Wave: 'Interact',
  Walk: 'Walk_Loop',
  WalkFormal: 'Walk_Formal_Loop',
  Run: 'Jog_Fwd_Loop',
  Sprint: 'Sprint_Loop',
  Type: 'Interact',
  Sit: 'Sitting_Idle_Loop',
  SitTalk: 'Sitting_Talking_Loop',
  Direct: 'Interact',
  Crouch: 'Crouch_Idle_Loop',
  Fix: 'Fixing_Kneeling',
  Dance: 'Dance_Loop',
  Drive: 'Driving_Loop',
};

const BODY: Record<Body, KitRef> = {
  female: 'quaternius-characters/Superhero_Female_FullBody',
  male: 'quaternius-characters/Superhero_Male_FullBody',
};
const ANIM: KitRef = 'quaternius-anim/UAL1_Standard';
/** The base bodies are ~1.95 m superhero proportions; scale to an everyday 1.75 m. */
const BASE_SCALE = 0.9;
/** Head bone sits at the base of the skull; hats are authored around the head's centre. */
const HEAD_CENTRE = 0.11;

export interface CharacterLook {
  body: Body;
  hair?: Hair;
  /** Fine adjustment on top of `skin`: <1 darker, >1 lighter. */
  skinTone?: number;
  /** Skin colour multiplied over the (light, neutral) base skin texture. */
  skin?: string;
  /** Hair and eyebrow colour (the hair textures are neutral grey, made to be tinted). */
  hairColor?: string;
  /** Legacy: unused now that clothing is generated (kept so older looks still type-check). */
  tint?: string;
  height?: number;
}

/** Clothing generated from the body mesh: colours per region, sleeve and leg length. */
export interface Clothing {
  top: string;
  bottom: string;
  shoes: string;
  longSleeves?: boolean;
  /** One garment from shoulders to ankles (boubou, kaftan). */
  dress?: boolean;
  shorts?: boolean;
}

type Region = 'top' | 'sleeve' | 'bottom' | 'calf' | 'shoes' | null;
function regionOf(bone: string): Region {
  if (/^(spine|clavicle|upperarm)/.test(bone)) return 'top';
  if (/^lowerarm/.test(bone)) return 'sleeve';
  if (/^(pelvis|thigh|root)/.test(bone)) return 'bottom';
  if (/^calf/.test(bone)) return 'calf';
  if (/^(foot|ball)/.test(bone)) return 'shoes';
  return null; // head, neck, hands: bare skin
}

/**
 * Builds a skinned clothing layer from the body: every triangle whose vertices are driven
 * by clothed bones is copied, pushed slightly out along its normals and vertex-coloured by
 * region. It shares the body's skeleton, so it deforms with every animation clip.
 */
function buildClothing(body: SkinnedMesh, c: Clothing): SkinnedMesh {
  const g = body.geometry;
  const pos = g.getAttribute('position'), nor = g.getAttribute('normal');
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const index = g.getIndex();
  g.computeBoundingBox();
  const lift = (g.boundingBox!.max.y - g.boundingBox!.min.y) * 0.0045;
  const colours: Record<Exclude<Region, null>, Color> = {
    top: new Color(c.top),
    sleeve: new Color(c.top),
    bottom: new Color(c.dress ? c.top : c.bottom),
    calf: new Color(c.dress ? c.top : c.bottom),
    shoes: new Color(c.shoes),
  };
  const clothed = (r: Region) => r !== null && (r !== 'sleeve' || !!(c.longSleeves || c.dress)) && (r !== 'calf' || !c.shorts);
  const regions: Region[] = [];
  for (let v = 0; v < pos.count; v++) {
    let best = 0, bi = 0;
    const ws = [sw.getX(v), sw.getY(v), sw.getZ(v), sw.getW(v)], is = [si.getX(v), si.getY(v), si.getZ(v), si.getW(v)];
    for (let k = 0; k < 4; k++) if (ws[k] > best) { best = ws[k]; bi = is[k]; }
    regions.push(regionOf(body.skeleton.bones[bi]?.name ?? ''));
  }
  const tris = index ? index.array : Array.from({ length: pos.count }, (_, i) => i);
  const keep: number[] = [];
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t], b = tris[t + 1], d = tris[t + 2];
    if (clothed(regions[a]) && clothed(regions[b]) && clothed(regions[d])) keep.push(a, b, d);
  }
  const out = new BufferGeometry();
  const p = new Float32Array(pos.count * 3), col = new Float32Array(pos.count * 3);
  for (let v = 0; v < pos.count; v++) {
    p[v * 3] = pos.getX(v) + nor.getX(v) * lift;
    p[v * 3 + 1] = pos.getY(v) + nor.getY(v) * lift;
    p[v * 3 + 2] = pos.getZ(v) + nor.getZ(v) * lift;
    const r = regions[v];
    const cc = r ? colours[r] : colours.top;
    col[v * 3] = cc.r; col[v * 3 + 1] = cc.g; col[v * 3 + 2] = cc.b;
  }
  out.setAttribute('position', new BufferAttribute(p, 3));
  out.setAttribute('normal', nor.clone());
  out.setAttribute('color', new BufferAttribute(col, 3));
  out.setAttribute('skinIndex', si.clone());
  out.setAttribute('skinWeight', sw.clone());
  out.setIndex(keep);
  const mat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });
  const mesh = new SkinnedMesh(out, mat);
  mesh.name = 'Clothing';
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
  mesh.scale.copy(body.scale);
  mesh.bind(body.skeleton, body.bindMatrix);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function rebindToSkeleton(mesh: SkinnedMesh, bonesByName: Map<string, Bone>) {
  const bones = mesh.skeleton.bones.map((b) => bonesByName.get(b.name) ?? b);
  mesh.bind(new Skeleton(bones, mesh.skeleton.boneInverses), mesh.bindMatrix);
}

export function CharacterModel({ look, clothing, action = 'Idle', fade = 0.25, timeScale = 1, headwear }: {
  look: CharacterLook; clothing?: Clothing; action?: string; fade?: number; timeScale?: number;
  /** Rendered on the head (gele, cap, helmet…); follows the head bone every frame. */
  headwear?: ReactNode;
}) {
  const group = useRef<Group>(null);
  const body = useGLTF(kitInfo(BODY[look.body]).url, false, true);
  const hairRef = look.hair && look.hair !== 'none' ? (`quaternius-hair/${look.hair}` as KitRef) : null;
  const hair = useGLTF(hairRef ? kitInfo(hairRef).url : kitInfo(BODY[look.body]).url, false, true);
  const anim = useGLTF(kitInfo(ANIM).url, false, true);

  const object = useMemo(() => {
    const root = SkeletonUtils.clone(body.scene) as Group;
    const bones = new Map<string, Bone>();
    root.traverse((n) => { if ((n as Bone).isBone) bones.set(n.name, n as Bone); });

    const tone = look.skinTone ?? 1;
    root.traverse((n) => {
      const m = n as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false; // skinned bounds don't follow animation
      const mat = (m.material as Material).clone() as MeshStandardMaterial;
      if (/superhero/i.test(mat.name)) mat.color = new Color(look.skin ?? '#9C6A46').multiplyScalar(1.55 * tone);
      if (/hair/i.test(mat.name)) mat.color = new Color(look.hairColor ?? '#2A201C');
      m.material = mat;
    });

    if (clothing) {
      const bodies: SkinnedMesh[] = [];
      root.traverse((n) => {
        const sm = n as SkinnedMesh;
        if (sm.isSkinnedMesh && /superhero/i.test((sm.material as Material).name)) bodies.push(sm);
      });
      bodies.forEach((b) => b.parent?.add(buildClothing(b, clothing)));
    }

    if (hairRef) {
      const h = SkeletonUtils.clone(hair.scene);
      const meshes: SkinnedMesh[] = [];
      h.traverse((n) => { if ((n as SkinnedMesh).isSkinnedMesh) meshes.push(n as SkinnedMesh); });
      meshes.forEach((sm) => {
        rebindToSkeleton(sm, bones);
        const hm = (sm.material as Material).clone() as MeshStandardMaterial;
        hm.color = new Color(look.hairColor ?? '#2A201C');
        sm.material = hm;
        sm.castShadow = true;
        sm.frustumCulled = false;
        root.add(sm);
      });
    }
    return root;
  }, [body.scene, hair.scene, hairRef, look.skinTone, look.skin, look.hairColor, clothing]);

  const { actions, mixer } = useAnimations(anim.animations, group);
  const current = useRef<string>('');

  useEffect(() => {
    const clip = CLIP[action] ?? action;
    const next = actions[clip] ?? actions[CLIP.Idle];
    if (!next || current.current === clip) return;
    const prev = actions[current.current];
    next.reset().setEffectiveTimeScale(timeScale).fadeIn(fade).play();
    prev?.fadeOut(fade);
    current.current = clip;
  }, [action, actions, fade, timeScale]);

  useEffect(() => () => { mixer.stopAllAction(); }, [mixer]);

  // Headwear follows the head bone's position; it stays upright relative to the body.
  const head = useMemo(() => object.getObjectByName('Head') as Bone | undefined, [object]);
  const pelvis = useMemo(() => object.getObjectByName('pelvis') as Bone | undefined, [object]);
  const hat = useRef<Group>(null);
  const skirt = useRef<Group>(null);
  const tmp = useMemo(() => new Vector3(), []);
  useFrame(() => {
    if (!group.current) return;
    if (headwear && head && hat.current) {
      head.getWorldPosition(tmp);
      group.current.worldToLocal(tmp);
      hat.current.position.set(tmp.x, tmp.y + HEAD_CENTRE, tmp.z);
    }
    // A boubou/kaftan flares from the hips; keep it anchored to the pelvis as the body moves.
    if (skirt.current && pelvis) {
      pelvis.getWorldPosition(tmp);
      group.current.worldToLocal(tmp);
      skirt.current.position.set(tmp.x, tmp.y, tmp.z);
    }
  });
  const skirtLen = 0.92;

  const s = BASE_SCALE * (look.height ?? 1);
  return (
    <group ref={group} scale={s} dispose={null}>
      <primitive object={object as Object3D} />
      {headwear && <group ref={hat} scale={0.62}>{headwear}</group>}
      {clothing?.dress && (
        <group ref={skirt}>
          <mesh position={[0, 0.08 - skirtLen / 2, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.36, skirtLen, 18, 1, true]} />
            <meshStandardMaterial color={clothing.top} roughness={0.9} side={2} />
          </mesh>
        </group>
      )}
    </group>
  );
}
