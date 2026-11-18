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
  /** Which mission the terminal is working on. */
  terminalMissionId: string | null;
  openWorkstation: (id: string, missionId?: string) => void;
  closeWorkstation: () => void;

  // Career (mirrors server state; the server decides money)
  completedMissions: string[];
  markMissionCompleted: (id: string) => void;
  walletBalance: number | null;
  setWalletBalance: (balance: number) => void;
  /** Mission shown on the minimap and waypoint. */
  trackedMissionId: string | null;
  trackMission: (id: string | null) => void;
  /** Missions whose client you've spoken to this session. */
  talkedTo: string[];
  markTalkedTo: (missionId: string) => void;

  // DataPhone
  isPhoneOpen: boolean;
  setPhoneOpen: (open: boolean) => void;

  // City map (M) and the player's own map pin
  isMapOpen: boolean;
  setMapOpen: (open: boolean) => void;
  customWaypoint: [number, number] | null;
  setCustomWaypoint: (p: [number, number] | null) => void;

  // Field evidence: keys are "<missionId>:<evidenceId>"; remembered in this browser.
  foundEvidence: string[];
  openEvidence: { missionId: string; evidenceId: string } | null;
  pickUpEvidence: (missionId: string, evidenceId: string) => void;
  closeEvidence: () => void;

  // Phase B: the character creator (edit mode) and the tailor shop
  isCreatorOpen: boolean;
  setCreatorOpen: (open: boolean) => void;
  isShopOpen: boolean;
  setShopOpen: (open: boolean) => void;

  // Phase D: driving
  isDriving: boolean;
  drivingVehicleId: string | null;
  setDriving: (vehicleId: string | null) => void;

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

const EVIDENCE_KEY = 'datacity.foundEvidence';
function loadFoundEvidence(): string[] {
  try {
    const v = typeof window === 'undefined' ? null : JSON.parse(window.localStorage.getItem(EVIDENCE_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const useGameState = create<GameStateStore>((set) => ({
  playerPosition: [-7, 0.9, -14],
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
  terminalMissionId: null,
  openWorkstation: (id, missionId) =>
    set({
      isWorkstationActive: true,
      activeWorkstationId: id,
      terminalMissionId: missionId ?? (id.startsWith('ws:') ? id.slice(3) : 'ch1_cafe_revenue_mystery'),
      isPhoneOpen: false,
      cameraMode: 'interaction',
    }),
  closeWorkstation: () =>
    set({
      isWorkstationActive: false,
      activeWorkstationId: null,
      cameraMode: 'follow',
    }),

  completedMissions: [],
  markMissionCompleted: (id) => set((st) => (st.completedMissions.includes(id) ? st : { completedMissions: [...st.completedMissions, id] })),
  walletBalance: null,
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  trackedMissionId: 'ch1_cafe_revenue_mystery',
  trackMission: (id) => set({ trackedMissionId: id }),
  talkedTo: [],
  markTalkedTo: (id) => set((st) => (st.talkedTo.includes(id) ? st : { talkedTo: [...st.talkedTo, id] })),

  isPhoneOpen: false,
  setPhoneOpen: (open) => set({ isPhoneOpen: open }),

  isMapOpen: false,
  setMapOpen: (open) => set({ isMapOpen: open }),
  customWaypoint: null,
  setCustomWaypoint: (p) => set({ customWaypoint: p }),

  foundEvidence: loadFoundEvidence(),
  openEvidence: null,
  pickUpEvidence: (missionId, evidenceId) => set((st) => {
    const key = `${missionId}:${evidenceId}`;
    const foundEvidence = st.foundEvidence.includes(key) ? st.foundEvidence : [...st.foundEvidence, key];
    try { window.localStorage.setItem(EVIDENCE_KEY, JSON.stringify(foundEvidence)); } catch { /* storage blocked: keep it for this session */ }
    return { foundEvidence, openEvidence: { missionId, evidenceId } };
  }),
  closeEvidence: () => set({ openEvidence: null }),

  isCreatorOpen: false,
  setCreatorOpen: (open) => set({ isCreatorOpen: open, isPhoneOpen: false }),
  isShopOpen: false,
  setShopOpen: (open) => set({ isShopOpen: open, isPhoneOpen: false }),

  isDriving: false,
  drivingVehicleId: null,
  setDriving: (vehicleId) => set({ isDriving: vehicleId !== null, drivingVehicleId: vehicleId, isPhoneOpen: false }),

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
