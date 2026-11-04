import type { Conversation } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";

const INCOMING_LINES = [
  "Sounds good to me.",
  "Can you take a look when you get a minute?",
  "I just pushed an update, let me know what you think.",
  "Perfect, thanks!",
  "Quick question about the plan...",
  "That works for me.",
  "Let's sync on this later today.",
  "Nice work on this one.",
  "I'll follow up after the call.",
  "Got it, on it now.",
];

export interface IncomingSimulationPlan {
  conversationId: string;
  senderId: string;
  text: string;
}

function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function chooseIncomingSimulation(
  conversations: readonly Conversation[],
): IncomingSimulationPlan | null {
  if (conversations.length === 0) return null;

  const conversation = pickRandom(conversations);
  if (!conversation) return null;

  const peers = conversation.participantIds.filter(
    (id) => id !== CURRENT_USER_ID,
  );
  const senderId = pickRandom(peers);
  const text = pickRandom(INCOMING_LINES);
  if (!senderId || !text) return null;

  return { conversationId: conversation.id, senderId, text };
}

export const SIMULATION_LINES: readonly string[] = INCOMING_LINES;
