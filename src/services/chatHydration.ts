import type { Conversation } from "@/types/chat";
import { seedConversations } from "@/data/conversations";

export const HYDRATION_DELAY_MS = 500;

export interface HydrationResult {
  conversations: Conversation[];
}

export type HydrationOutcome =
  | { status: "success"; data: HydrationResult }
  | { status: "error"; message: string };

export function loadInitialData(): Promise<HydrationOutcome> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        if (seedConversations.length === 0) {
          resolve({ status: "error", message: "No conversations available." });
          return;
        }
        resolve({
          status: "success",
          data: { conversations: seedConversations },
        });
      } catch {
        resolve({
          status: "error",
          message: "Could not load conversations.",
        });
      }
    }, HYDRATION_DELAY_MS);
  });
}
