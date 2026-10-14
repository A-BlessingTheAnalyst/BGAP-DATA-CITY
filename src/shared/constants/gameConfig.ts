export const GAME_CONFIG = {
  player: {
    walkSpeed: 4.5,
    runSpeed: 8.5,
    turnSpeed: 10.0,
    jumpImpulse: 5.0,
    capsuleHeight: 1.8,
    capsuleRadius: 0.4,
    interactionRadius: 2.5,
  },
  camera: {
    followOffset: [0, 2.8, -4.5] as [number, number, number],
    followLookAtOffset: [0, 1.4, 0] as [number, number, number],
    conversationDistance: 2.2,
    conversationHeight: 1.5,
    smoothingTime: 0.15,
    fov: 55,
  },
  physics: {
    gravity: [0, -9.81, 0] as [number, number, number],
    timeStep: 1 / 60,
  },
  graphics: {
    low: {
      shadows: false,
      bloom: false,
      pixelRatio: 1.0,
      targetFps: 30,
      drawDistance: 45,
    },
    balanced: {
      shadows: true,
      bloom: true,
      pixelRatio: 1.5,
      targetFps: 60,
      drawDistance: 80,
    },
    high: {
      shadows: true,
      bloom: true,
      pixelRatio: 2.0,
      targetFps: 60,
      drawDistance: 130,
    },
  },
};
