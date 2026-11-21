'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { PALETTE } from './palette';
import type { CharacterLook } from './CharacterModel';

// Data City's people. One articulated body, dressed through an Outfit.
// Stands about 1.75 m tall, faces +Z, feet at y = 0. All characters are original.

export type Garment = 'shirt' | 'suit' | 'kaftan' | 'boubou' | 'uniform' | 'apron' | 'schoolUniform' | 'hiVis';
export type Headwear = 'short' | 'puff' | 'braids' | 'gele' | 'cap' | 'kufi' | 'beret' | 'helmet' | 'bald' | 'chefHat';
export type Accessory = 'glasses' | 'tie' | 'bag' | 'tablet' | 'badge' | 'headTray' | 'lanyard' | 'satchel' | 'clipboard' | 'phone';

export interface Outfit {
  skin: string;
  top: string;
  bottom: string;
  garment: Garment;
  head: Headwear;
  headColor?: string;
  shoes?: string;
  accent?: string;
  accessories?: Accessory[];
  build?: 'slim' | 'average' | 'broad';
  height?: number; // scale, 1 = 1.75 m
}

const HAIR = '#1E1714';

function M({ color, rough = 0.85, metal = 0 }: { color: string; rough?: number; metal?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} />;
}

export function HeadPiece({ head, color }: { head: Headwear; color?: string }) {
  switch (head) {
    case 'short':
      return <mesh position={[0, 0.05, -0.01]}><sphereGeometry args={[0.175, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.1]} /><M color={color ?? HAIR} /></mesh>;
    case 'puff':
      return <mesh position={[0, 0.16, -0.03]}><sphereGeometry args={[0.2, 14, 10]} /><M color={color ?? HAIR} rough={1} /></mesh>;
    case 'braids':
      return (
        <group>
          <mesh position={[0, 0.05, -0.01]}><sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><M color={color ?? HAIR} /></mesh>
          {Array.from({ length: 7 }).map((_, i) => <mesh key={i} position={[-0.12 + i * 0.04, -0.12, -0.13]}><capsuleGeometry args={[0.016, 0.3, 3, 6]} /><M color={color ?? HAIR} /></mesh>)}
        </group>
      );
    case 'gele':
      // Tall pleated headwrap worn for occasions and by market women
      return (
        <group position={[0, 0.12, -0.02]}>
          <mesh rotation={[0.25, 0, 0]}><torusGeometry args={[0.17, 0.08, 8, 18]} /><M color={color ?? PALETTE.fabric.ankaraYellow} /></mesh>
          <mesh position={[0, 0.12, -0.04]} rotation={[-0.5, 0, 0]}><coneGeometry args={[0.2, 0.28, 8]} /><M color={color ?? PALETTE.fabric.ankaraYellow} /></mesh>
          <mesh position={[0.16, 0.08, -0.08]} rotation={[0, 0, -0.8]}><boxGeometry args={[0.2, 0.12, 0.02]} /><M color={color ?? PALETTE.fabric.ankaraYellow} /></mesh>
        </group>
      );
    case 'cap':
      return (
        <group position={[0, 0.07, 0]}>
          <mesh><sphereGeometry args={[0.178, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><M color={color ?? PALETTE.fabric.navy} /></mesh>
          <mesh position={[0, 0, 0.17]} rotation={[0.15, 0, 0]}><boxGeometry args={[0.24, 0.02, 0.14]} /><M color={color ?? PALETTE.fabric.navy} /></mesh>
        </group>
      );
    case 'kufi':
      return <mesh position={[0, 0.11, 0]}><cylinderGeometry args={[0.16, 0.175, 0.13, 16]} /><M color={color ?? PALETTE.fabric.white} /></mesh>;
    case 'beret':
      return <mesh position={[0.03, 0.12, 0]} rotation={[0, 0, -0.25]}><cylinderGeometry args={[0.2, 0.18, 0.06, 16]} /><M color={color ?? PALETTE.fabric.navy} /></mesh>;
    case 'helmet':
      return (
        <group position={[0, 0.05, 0]}>
          <mesh><sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} /><M color={color ?? '#F2B705'} rough={0.4} /></mesh>
          <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.24, 0.24, 0.015, 18]} /><M color={color ?? '#F2B705'} rough={0.4} /></mesh>
        </group>
      );
    case 'chefHat':
      return <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.17, 0.15, 0.26, 14]} /><M color="#FAFAFA" /></mesh>;
    default:
      return null;
  }
}

/** `outfit` drives the procedural far-LOD figure; `look` drives the rigged Quaternius character. */
export interface CharacterDef { id: string; name: string; role: string; district: string; story: string; outfit: Outfit; look: CharacterLook; pose?: 'walk' | 'talk' | 'idle' }

/** The cast: named story characters first, then the crowd archetypes. */
export const CHARACTERS: CharacterDef[] = [
  { id: 'player_analyst', name: 'Cadet Analyst', role: 'You', district: 'Academy Quarter', story: 'A new BGAP cadet who solves the city’s business mysteries with data.', pose: 'idle',
    look: { body: 'female', hair: 'Hair_Buns', skinTone: 1.05, tint: '#9FE3DA' },
    outfit: { skin: PALETTE.skin[3], top: '#13837A', bottom: PALETTE.fabric.navy, garment: 'shirt', head: 'short', accessories: ['lanyard', 'tablet', 'satchel'], accent: '#22313F' } },
  { id: 'mama_bisi', name: 'Mama Bisi', role: 'Café owner', district: 'Market Boulevard', story: 'Runs the busiest café on the boulevard. Her takings look wrong, and she wants to know why.', pose: 'talk',
    look: { body: 'female', hair: 'none', skinTone: 0.95, tint: '#F08A7A', height: 0.97 },
    outfit: { skin: PALETTE.skin[2], top: PALETTE.fabric.ankaraRed, bottom: PALETTE.fabric.ankaraRed, garment: 'boubou', head: 'gele', headColor: PALETTE.fabric.ankaraYellow, accessories: [], build: 'broad' } },
  { id: 'officer_tunde', name: 'Officer Tunde', role: 'Academy guard', district: 'Academy Quarter', story: 'Knows everyone on campus. Your first guide to the city.', pose: 'idle',
    look: { body: 'male', hair: 'Hair_Buzzed', skinTone: 0.85, tint: '#8FA3C8', height: 1.04 },
    outfit: { skin: PALETTE.skin[1], top: '#2D3A4F', bottom: '#1D2B45', garment: 'uniform', head: 'beret', headColor: '#1D2B45', accessories: ['badge'], build: 'broad', height: 1.05 } },
  { id: 'dr_ifeoma', name: 'Dr. Ifeoma Nwosu', role: 'Lead lecturer', district: 'Academy Quarter', story: 'Teaches SQL at the Academy and sends cadets their first assignments.', pose: 'talk',
    look: { body: 'female', hair: 'Hair_Long', skinTone: 1.1, tint: '#C9B3F0' },
    outfit: { skin: PALETTE.skin[4], top: PALETTE.fabric.purple, bottom: '#2B2F36', garment: 'suit', head: 'braids', accessories: ['glasses', 'clipboard'], build: 'slim' } },
  { id: 'mr_adeyemi', name: 'Mr. Kunle Adeyemi', role: 'Branch manager, Meridian Capital', district: 'Finance Row', story: 'Chapter 2. Loan defaults are climbing and he swears the numbers are fine.', pose: 'idle',
    look: { body: 'male', hair: 'none', skinTone: 0.95, tint: '#8C929C' },
    outfit: { skin: PALETTE.skin[2], top: '#1F2A38', bottom: '#1F2A38', garment: 'suit', head: 'bald', accessories: ['tie', 'glasses'], accent: PALETTE.brand.meridianGold } },
  { id: 'kemi', name: 'Kemi Bello', role: 'Fellow cadet', district: 'Academy Quarter', story: 'Your rival and friend. Always one query ahead, or so she says.', pose: 'walk',
    look: { body: 'female', hair: 'Hair_BuzzedFemale', skinTone: 1.2, tint: '#F7D27A' },
    outfit: { skin: PALETTE.skin[5], top: '#F2B134', bottom: '#2D3A6B', garment: 'shirt', head: 'puff', accessories: ['satchel', 'phone'], build: 'slim', accent: '#7B3FE4' } },
  { id: 'baba_sola', name: 'Baba Sola', role: 'Kiosk owner', district: 'Market Boulevard', story: 'Sells airtime and runs a POS stand. Hears every rumour first.', pose: 'talk',
    look: { body: 'male', hair: 'Hair_Beard', skinTone: 0.8, tint: '#F3F1EC', height: 0.97 },
    outfit: { skin: PALETTE.skin[0], top: PALETTE.fabric.white, bottom: PALETTE.fabric.white, garment: 'kaftan', head: 'kufi', headColor: PALETTE.fabric.maroon, accessories: [], build: 'average', height: 0.97 } },
  { id: 'chidi', name: 'Chidi Okafor', role: 'Systems engineer, Datacore', district: 'Tech Park', story: 'Keeps the servers running. Later chapters: logs, outages and Python.', pose: 'idle',
    look: { body: 'male', hair: 'Hair_Buzzed', skinTone: 1.05, tint: '#E8F23A' },
    outfit: { skin: PALETTE.skin[3], top: '#2A3340', bottom: '#3A4450', garment: 'hiVis', head: 'helmet', headColor: '#F4F4F2', accessories: ['tablet'] } },
  { id: 'chef_amaka', name: 'Chef Amaka', role: 'Café cook', district: 'Market Boulevard', story: 'Mama Bisi’s cook. Knows exactly how many plates really left the kitchen.', pose: 'idle',
    look: { body: 'female', hair: 'Hair_Buns', skinTone: 1.1, tint: '#FFFFFF' },
    outfit: { skin: PALETTE.skin[4], top: '#F3F1EC', bottom: '#2B2F36', garment: 'apron', head: 'chefHat', accent: '#F3F1EC' } },
  { id: 'zee_owner', name: 'Aunty Zainab', role: 'Owner, Zee Fabrics', district: 'Market Boulevard', story: 'Sells ankara, lace and aso-oke. Wants to stock up for the festive season without tying up cash.', pose: 'talk',
    look: { body: 'female', hair: 'none', skinTone: 1.0 },
    outfit: { skin: PALETTE.skin[3], top: PALETTE.fabric.ankaraBlue, bottom: PALETTE.fabric.ankaraBlue, garment: 'boubou', head: 'gele', headColor: PALETTE.fabric.ankaraGreen, accessories: [], build: 'average' } },
  { id: 'sunrise_bursar', name: 'Mrs. Adaeze Chukwu', role: 'Bursar, Sunrise Primary', district: 'Ilé Gardens', story: 'Chapter: The Half-Paid Term. Keeps the school accounts straight and wants every family’s balance right before reports go out.', pose: 'talk',
    look: { body: 'female', hair: 'Hair_SimpleParted', skinTone: 1.0, height: 0.98 },
    outfit: { skin: PALETTE.skin[3], top: PALETTE.fabric.maroon, bottom: '#2B2F36', garment: 'suit', head: 'short', accessories: ['glasses', 'clipboard'], accent: PALETTE.trim.gold, build: 'average', height: 0.98 } },
  { id: 'keke_owner', name: 'Alhaji Musa', role: 'Keke fleet owner', district: 'Ilé Gardens', story: 'Chapter: Running on Empty. Runs six tricycle taxis out of Ilé Gardens and can’t work out which ones are actually making money.', pose: 'talk',
    look: { body: 'male', hair: 'Hair_Beard', skinTone: 0.9, height: 1.03 },
    outfit: { skin: PALETTE.skin[2], top: PALETTE.fabric.indigo, bottom: PALETTE.fabric.khaki, garment: 'kaftan', head: 'cap', headColor: PALETTE.fabric.indigo, accessories: ['phone'], build: 'broad', height: 1.03 } },
  { id: 'funke_station', name: 'Mrs. Funke Alabi', role: 'Manager, Atlas Fuel', district: 'City Gateway', story: 'Runs the pumps and the forecourt shop. Keeps a sharp eye on margins, not just which tank empties fastest.', pose: 'talk',
    look: { body: 'female', hair: 'Hair_SimpleParted', skinTone: 1.0 },
    outfit: { skin: PALETTE.skin[4], top: PALETTE.fabric.ankaraYellow, bottom: '#2A3340', garment: 'hiVis', head: 'cap', headColor: '#2A3340', accessories: ['clipboard'], build: 'average' } },
  // Crowd archetypes
  { id: 'crowd_trader', name: 'Market trader', role: 'Crowd', district: 'Market Boulevard', story: 'Carries produce on a head tray between the stalls.', pose: 'walk',
    look: { body: 'female', hair: 'none', skinTone: 0.9, tint: '#7FC79A' },
    outfit: { skin: PALETTE.skin[1], top: PALETTE.fabric.ankaraGreen, bottom: PALETTE.fabric.ankaraBlue, garment: 'boubou', head: 'gele', headColor: PALETTE.fabric.ankaraBlue, accessories: ['headTray'] } },
  { id: 'crowd_office', name: 'Office worker', role: 'Crowd', district: 'Finance Row', story: 'Rushes between towers with a laptop bag.', pose: 'walk',
    look: { body: 'male', hair: 'Hair_SimpleParted', skinTone: 1.15, tint: '#DCE6F0' },
    outfit: { skin: PALETTE.skin[5], top: '#DCE6F0', bottom: '#2B2F36', garment: 'shirt', head: 'short', accessories: ['bag', 'lanyard'], accent: '#22262B' } },
  { id: 'crowd_student', name: 'Primary pupil', role: 'Crowd', district: 'Ilé Gardens', story: 'Walks home from Sunrise Primary in uniform.', pose: 'walk',
    look: { body: 'male', hair: 'Hair_Buzzed', skinTone: 1.05, tint: '#F3F1EC', height: 0.75 },
    outfit: { skin: PALETTE.skin[3], top: '#F3F1EC', bottom: '#1D5A3A', garment: 'schoolUniform', head: 'short', accessories: ['satchel'], accent: '#1D5A3A', height: 0.72, build: 'slim' } },
  { id: 'crowd_rider', name: 'Bike rider', role: 'Crowd', district: 'Everywhere', story: 'Waits at junctions for passengers.', pose: 'idle',
    look: { body: 'male', hair: 'none', skinTone: 0.9, tint: '#C26A75' },
    outfit: { skin: PALETTE.skin[2], top: '#7A1F2B', bottom: '#3A4450', garment: 'shirt', head: 'helmet', headColor: '#1B1C20' } },
  { id: 'crowd_elder', name: 'Neighbourhood elder', role: 'Crowd', district: 'Ilé Gardens', story: 'Sits under shade trees and comments on everything.', pose: 'talk',
    look: { body: 'male', hair: 'Hair_Beard', skinTone: 0.8, tint: '#8C9BD1', height: 0.96 },
    outfit: { skin: PALETTE.skin[0], top: PALETTE.fabric.indigo, bottom: PALETTE.fabric.indigo, garment: 'kaftan', head: 'cap', headColor: PALETTE.fabric.indigo, height: 0.96 } },
];
