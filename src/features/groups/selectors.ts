import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { Conversation, User } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { getAllUsers, getUserById } from "@/services/userDirectory";

const selectConversationItems = (state: RootState) => state.conversations.items;
const selectAdded = (state: RootState) => state.groups.addedMembers;
const selectRemoved = (state: RootState) => state.groups.removedMembers;

export function resolveGroupMemberIds(
  conversation: Conversation,
  added: string[] | undefined,
  removed: string[] | undefined,
): string[] {
  const removedSet = new Set(removed ?? []);
  const base = conversation.participantIds.filter((id) => !removedSet.has(id));
  const additions = (added ?? []).filter((id) => !base.includes(id));
  return [...base, ...additions];
}

export const selectGroupMemberIds = createSelector(
  [selectConversationItems, selectAdded, selectRemoved],
  (conversations, added, removed) => {
    const result: Record<string, string[]> = {};
    for (const conversation of conversations) {
      if (conversation.type !== "group") continue;
      result[conversation.id] = resolveGroupMemberIds(
        conversation,
        added[conversation.id],
        removed[conversation.id],
      );
    }
    return result;
  },
);

export const selectGroupMembers = createSelector(
  [selectGroupMemberIds, (_state: RootState, conversationId: string) => conversationId],
  (memberIds, conversationId): User[] =>
    (memberIds[conversationId] ?? [])
      .map((id) => getUserById(id))
      .filter((user): user is User => Boolean(user)),
);

export const selectAddableUsers = createSelector(
  [selectGroupMemberIds, (_state: RootState, conversationId: string) => conversationId],
  (memberIds, conversationId): User[] => {
    const existing = new Set(memberIds[conversationId] ?? []);
    return getAllUsers().filter(
      (user) => user.id !== CURRENT_USER_ID && !existing.has(user.id),
    );
  },
);

export const selectGroupMemberCount = createSelector(
  [selectGroupMemberIds, (_state: RootState, conversationId: string) => conversationId],
  (memberIds, conversationId) => (memberIds[conversationId] ?? []).length,
);
