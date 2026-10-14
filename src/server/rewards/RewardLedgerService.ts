const grantedIdempotencyKeys = new Set<string>();

export class RewardLedgerService {
  static async grantReward(params: {
    userId: string;
    xp: number;
    credits: number;
    reason: string;
    idempotencyKey: string;
  }) {
    // Prevent duplicate reward claims using deterministic idempotency key
    if (grantedIdempotencyKeys.has(params.idempotencyKey)) {
      console.log('[REWARD LEDGER] Reward already claimed for key:', params.idempotencyKey);
      return {
        success: true,
        alreadyClaimed: true,
        idempotencyKey: params.idempotencyKey,
        appliedXp: 0,
        appliedCredits: 0,
      };
    }

    grantedIdempotencyKeys.add(params.idempotencyKey);
    console.log('[REWARD LEDGER] Credited rewards:', params);

    return {
      success: true,
      alreadyClaimed: false,
      idempotencyKey: params.idempotencyKey,
      appliedXp: params.xp,
      appliedCredits: params.credits,
    };
  }
}
