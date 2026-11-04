import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { User } from "@/types/chat";
import { getUserById } from "@/services/userDirectory";

const selectTypersByConversation = (state: RootState) =>
  state.typing.typersByConversation;

export const selectTypersForConversation = createSelector(
  [
    selectTypersByConversation,
    (_state: RootState, conversationId: string) => conversationId,
  ],
  (typersByConversation, conversationId): User[] =>
    (typersByConversation[conversationId] ?? [])
      .map((id) => getUserById(id))
      .filter((user): user is User => Boolean(user)),
);

export const selectTypingLabel = createSelector(
  [selectTypersForConversation],
  (typers): string | null => {
    if (typers.length === 0) return null;
    if (typers.length === 1) return `${typers[0].displayName} is typing...`;
    if (typers.length === 2) {
      return `${typers[0].displayName} and ${typers[1].displayName} are typing...`;
    }
    return "Several people are typing...";
  },
);
