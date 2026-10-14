export type GraphicsQuality = 'low' | 'balanced' | 'high';

export type CameraMode = 'follow' | 'conversation' | 'interaction' | 'overview';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerSpawn {
  zoneId: string;
  position: [number, number, number];
  rotationY: number;
}

export interface InteractionTarget {
  id: string;
  type: 'npc' | 'workstation' | 'door' | 'item';
  label: string;
  actionText: string;
  position: [number, number, number];
  radius: number;
  metadata?: Record<string, any>;
}

export interface GraphicsSettings {
  quality: GraphicsQuality;
  shadows: boolean;
  bloom: boolean;
  pixelRatio: number;
  targetFps: number;
  drawDistance: number;
}
