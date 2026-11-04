import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import { CURRENT_USER_ID } from "@/types/chat";
import type { Message } from "@/types/chat";
import { displayTextOf } from "./utils/displayText";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_ITEMS: MessageListItem[] = [];

export type MessageListItem =
  | { kind: "date"; dateKey: string; countsForUnread: boolean }
  | {
      kind: "message";
      message: Message;
      replyTo: Message | null;
      isOwn: boolean;
      countsForUnread: boolean;
      searchSegments: SearchSegment[];
    };

export type SearchSegment = { text: string; isMatch: boolean };

export const selectSelectedConversationId = (state: RootState) =>
  state.conversations.selectedConversationId;

const selectMessagesByConversation = (state: RootState) =>
  state.messages.byConversation;

export const selectMessagesForSelectedConversation = createSelector(
  [selectSelectedConversationId, selectMessagesByConversation],
  (conversationId, byConversation) =>
    conversationId
      ? (byConversation[conversationId] ?? EMPTY_MESSAGES)
      : EMPTY_MESSAGES,
);

export const selectMessagesForConversation = createSelector(
  [selectMessagesByConversation, (state: RootState, id: string) => id],
  (byConversation, conversationId) =>
    byConversation[conversationId] ?? EMPTY_MESSAGES,
);

function isUnread(message: Message): boolean {
  return (
    message.senderId !== CURRENT_USER_ID &&
    !message.readBy.includes(CURRENT_USER_ID)
  );
}

function sortAscending(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const byDate = a.createdAt.localeCompare(b.createdAt);
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  });
}

function dateKeyOf(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const selectActiveSearchQuery = (state: RootState): string =>
  state.messageInteraction.isSearchOpen
    ? state.messageInteraction.searchQuery
    : "";

export function buildSearchSegments(
  text: string,
  query: string,
): SearchSegment[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [{ text, isMatch: false }];

  const haystack = text.toLowerCase();
  const segments: SearchSegment[] = [];
  let cursor = 0;
  let index = haystack.indexOf(needle, cursor);

  while (index !== -1) {
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), isMatch: false });
    }
    segments.push({
      text: text.slice(index, index + needle.length),
      isMatch: true,
    });
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

export const selectMessageListItems = createSelector(
  [selectMessagesForSelectedConversation, selectActiveSearchQuery],
  (messages, searchQuery): MessageListItem[] => {
    if (messages.length === 0) return EMPTY_ITEMS;

    const sorted = sortAscending(messages);
    const messageMap = sorted.reduce<Record<string, Message>>(
      (acc, message) => {
        acc[message.id] = message;
        return acc;
      },
      {},
    );

    const unreadDateKeys = new Set(
      sorted.filter(isUnread).map((message) => dateKeyOf(message.createdAt)),
    );

    const items: MessageListItem[] = [];
    let currentDateKey: string | null = null;

    for (const message of sorted) {
      const dateKey = dateKeyOf(message.createdAt);
      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        items.push({
          kind: "date",
          dateKey,
          countsForUnread: unreadDateKeys.has(dateKey),
        });
      }

      items.push({
        kind: "message",
        message,
        replyTo: message.replyToMessageId
          ? (messageMap[message.replyToMessageId] ?? null)
          : null,
        isOwn: message.senderId === CURRENT_USER_ID,
        countsForUnread: isUnread(message),
        searchSegments: buildSearchSegments(displayTextOf(message), searchQuery),
      });
    }

    return items;
  },
);

export const selectSearchResultIds = createSelector(
  [selectMessageListItems],
  (items): string[] =>
    items.flatMap((item) =>
      item.kind === "message" &&
      item.searchSegments.some((segment) => segment.isMatch)
        ? [item.message.id]
        : [],
    ),
);

export const selectSearchState = createSelector(
  [
    selectSearchResultIds,
    (state: RootState) => state.messageInteraction.searchQuery,
    (state: RootState) => state.messageInteraction.activeMatchIndex,
    (state: RootState) => state.messageInteraction.isSearchOpen,
  ],
  (resultIds, query, activeMatchIndex, isSearchOpen) => ({
    isSearchOpen,
    query,
    matchCount: resultIds.length,
    activeMatchIndex:
      resultIds.length > 0 ? activeMatchIndex % resultIds.length : 0,
    activeMessageId: resultIds[activeMatchIndex % Math.max(resultIds.length, 1)] ?? null,
  }),
);
