import { GameRepository } from './GameRepository';

export class CheckpointService {
  static async savePlayerLocation(
    userId: string,
    zoneId: string,
    coords: [number, number, number],
    rotationY: number
  ) {
    return await GameRepository.updateCheckpoint(userId, zoneId, coords, rotationY);
  }
}
