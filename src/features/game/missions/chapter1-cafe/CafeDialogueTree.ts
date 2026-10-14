export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  options: {
    text: string;
    nextNodeId?: string;
    action?: 'open_terminal' | 'complete_mission' | 'close';
  }[];
}

export const CAFE_DIALOGUE_TREE: Record<string, DialogueNode> = {
  root: {
    id: 'root',
    speaker: 'Mama Bisi',
    text: "Welcome to BGAP City, Cadet! Thank goodness you're here. Look around—every table is occupied, yet my weekly financial printout says my revenue crashed by 40%! Can you check my laptop over there?",
    options: [
      { text: "I'll investigate your transaction logs right now.", nextNodeId: 'investigate' },
      { text: 'Could you give me a brief overview of your business model?', nextNodeId: 'explain_business' },
    ],
  },
  explain_business: {
    id: 'explain_business',
    speaker: 'Mama Bisi',
    text: "We sell coffees, sandwiches, and large corporate catering platters. We record POS card swipes, direct bank transfers, and cash. But lately, our POS device had network glitches...",
    options: [{ text: "Network glitches? That's a vital clue. Let me inspect the data.", nextNodeId: 'investigate' }],
  },
  investigate: {
    id: 'investigate',
    speaker: 'Mama Bisi',
    text: "Head over to the laptop on the patio table. Run a query that totals sales grouped by date, and make sure you verify the payment_status of each order!",
    options: [{ text: 'Access Analytics Terminal', action: 'open_terminal' }],
  },
  debrief_success: {
    id: 'debrief_success',
    speaker: 'Mama Bisi',
    text: "Aha! You showed that gross sales included duplicate orders and unissued refunds! Our real customer sales are as solid as ever. Here is your fee and first professional commendation!",
    options: [{ text: 'Claim Certification & Badges', action: 'complete_mission' }],
  },
};
