export class RewardLedgerService {
  static async grantReward(params: {
    userId: string;
    xp: number;
    credits: number;
    reason: string;
    idempotencyKey: string;
  }) {
    console.log('[REWARD LEDGER] Credited rewards:', params);
    return {
      success: true,
      idempotencyKey: params.idempotencyKey,
      appliedXp: params.xp,
      appliedCredits: params.credits,
    };
  }
}
