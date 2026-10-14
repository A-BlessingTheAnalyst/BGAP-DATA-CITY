import { create } from 'zustand';
import { CameraMode, GraphicsQuality, InteractionTarget } from '@/shared/types/game';
import { MissionState } from '@/shared/types/mission';

interface GameStateStore {
  // Player & Transform
  playerPosition: [number, number, number];
  playerRotationY: number;
  setPlayerTransform: (pos: [number, number, number], rotY: number) => void;

  // Camera
  cameraMode: CameraMode;
  cameraTarget: [number, number, number] | null;
  setCameraMode: (mode: CameraMode, target?: [number, number, number] | null) => void;

  // Interactions & Proximity
  activeTarget: InteractionTarget | null;
  setActiveTarget: (target: InteractionTarget | null) => void;

  // Active Dialogue
  isDialogueActive: boolean;
  activeNpcId: string | null;
  openDialogue: (npcId: string) => void;
  closeDialogue: () => void;

  // Active Workstation (SQL Terminal)
  isWorkstationActive: boolean;
  activeWorkstationId: string | null;
  openWorkstation: (id: string) => void;
  closeWorkstation: () => void;

  // Mission State
  missionState: MissionState;
  activeMissionId: string;
  setMissionState: (state: MissionState) => void;

  // Settings & Graphics
  graphicsQuality: GraphicsQuality;
  isMuted: boolean;
  isPaused: boolean;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  toggleMute: () => void;
  togglePause: () => void;
}

export const useGameState = create<GameStateStore>((set) => ({
  playerPosition: [0, 0.9, 0],
  playerRotationY: 0,
  setPlayerTransform: (pos, rotY) => set({ playerPosition: pos, playerRotationY: rotY }),

  cameraMode: 'follow',
  cameraTarget: null,
  setCameraMode: (mode, target = null) => set({ cameraMode: mode, cameraTarget: target }),

  activeTarget: null,
  setActiveTarget: (target) => set({ activeTarget: target }),

  isDialogueActive: false,
  activeNpcId: null,
  openDialogue: (npcId) =>
    set({
      isDialogueActive: true,
      activeNpcId: npcId,
      cameraMode: 'conversation',
    }),
  closeDialogue: () =>
    set({
      isDialogueActive: false,
      activeNpcId: null,
      cameraMode: 'follow',
    }),

  isWorkstationActive: false,
  activeWorkstationId: null,
  openWorkstation: (id) =>
    set({
      isWorkstationActive: true,
      activeWorkstationId: id,
      cameraMode: 'interaction',
    }),
  closeWorkstation: () =>
    set({
      isWorkstationActive: false,
      activeWorkstationId: null,
      cameraMode: 'follow',
    }),

  missionState: 'available',
  activeMissionId: 'ch1_cafe_revenue_mystery',
  setMissionState: (state) => set({ missionState: state }),

  graphicsQuality: 'balanced',
  isMuted: false,
  isPaused: false,
  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
