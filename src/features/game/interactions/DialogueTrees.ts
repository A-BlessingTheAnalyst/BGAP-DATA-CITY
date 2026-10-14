export interface DialogueOption {
  text: string;
  nextNodeId?: string;
  action?: 'open_terminal' | 'close';
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  options: DialogueOption[];
}

export const GUARD_DIALOGUE_TREE: Record<string, DialogueNode> = {
  root: {
    id: 'root',
    speaker: 'Officer Danladi (Academy Security)',
    text: "Welcome to BGAP City, Cadet! You are standing in the Academy Plaza. As an analyst in training, your mission is to explore business districts and solve real operational data cases.",
    options: [
      { text: "How do I navigate around the city?", nextNodeId: 'controls' },
      { text: "Where should I begin my first assignment?", nextNodeId: 'directions' },
      { text: "Thank you Officer, I'll explore on my own.", nextNodeId: 'close' },
    ],
  },
  controls: {
    id: 'controls',
    speaker: 'Officer Danladi',
    text: "Use [W, A, S, D] or the Arrow keys to walk. Hold [Shift] to sprint. On mobile devices, use the virtual analog joystick on the bottom left. When near a citizen or workstation, press [E] to interact.",
    options: [
      { text: "Got it! Where is my first case?", nextNodeId: 'directions' },
      { text: "Understood, thank you.", nextNodeId: 'close' },
    ],
  },
  directions: {
    id: 'directions',
    speaker: 'Officer Danladi',
    text: "Follow the cyan neon street markings east toward Commercial Boulevard. Mama Bisi at the Gourmet Café is having serious ledger reconciliation discrepancies and requested our best analytics cadet.",
    options: [
      { text: "I'll head to Mama Bisi's Café right now.", nextNodeId: 'close' },
    ],
  },
  close: {
    id: 'close',
    speaker: 'Officer Danladi',
    text: "Stay sharp, Cadet. Good luck with your analysis!",
    options: [{ text: "Goodbye", action: 'close' }],
  },
};

export const CAFE_DIALOGUE_TREE: Record<string, DialogueNode> = {
  root: {
    id: 'root',
    speaker: 'Mama Bisi',
    text: "Welcome to BGAP City, Cadet! Thank goodness the Academy sent someone. Look around—every single table on my patio is occupied, yet my weekly financial printout says my revenue crashed by 40%! Can you check my laptop over there?",
    options: [
      { text: "I'll investigate your transaction logs right now.", nextNodeId: 'investigate' },
      { text: "Could you give me an overview of how orders are processed?", nextNodeId: 'explain_business' },
    ],
  },
  explain_business: {
    id: 'explain_business',
    speaker: 'Mama Bisi',
    text: "We sell coffees, wraps, and large corporate catering platters. We accept POS card swipes, bank transfers, and cash. But our POS terminal had network timeouts recently, and baristas had to re-swipe or cancel orders.",
    options: [
      { text: "POS network timeouts? That's a huge clue. Let me inspect the data.", nextNodeId: 'investigate' },
    ],
  },
  investigate: {
    id: 'investigate',
    speaker: 'Mama Bisi',
    text: "The laptop is right here on the patio table. Write a SQL query that calculates daily recognized revenue. Make sure you check the payment_status of each order!",
    options: [
      { text: "Access Analytics Workstation [E]", action: 'open_terminal' },
    ],
  },
  waiting_analysis: {
    id: 'waiting_analysis',
    speaker: 'Mama Bisi',
    text: "Have you uncovered why the revenue dropped? Head back to the laptop workstation on the table whenever you are ready to test your query.",
    options: [
      { text: "Open Analytics Workstation", action: 'open_terminal' },
      { text: "Still reviewing the figures, Mama Bisi.", action: 'close' },
    ],
  },
  debrief_success: {
    id: 'debrief_success',
    speaker: 'Mama Bisi',
    text: "Aha! Look at those numbers! You demonstrated that our true customer sales are as healthy as ever—it was accidental duplicate orders and pending refund charges distorting the gross balance! Here is your fee and your first professional certification badge!",
    options: [
      { text: "Thank you Mama Bisi! It was an honor to investigate.", action: 'close' },
    ],
  },
};
