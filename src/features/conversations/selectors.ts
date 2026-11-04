import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import { CURRENT_USER_ID } from "@/types/chat";
import type {
  Conversation,
  ConversationListItem,
  ConversationPreview,
  Message,
} from "@/types/chat";
import { getUserById, currentUser } from "@/services/userDirectory";
import { displayTextOf } from "@/features/messages/utils/displayText";

const selectConversationItems = (state: RootState) => state.conversations.items;
const selectSearchQuery = (state: RootState) => state.conversations.searchQuery;
const selectActiveFilter = (state: RootState) =>
  state.conversations.activeFilter;
const selectMessagesByConversation = (state: RootState) =>
  state.messages.byConversation;

export const selectConversationsState = (state: RootState) =>
  state.conversations;

function latestMessage(messages: Message[] | undefined): Message | null {
  if (!messages || messages.length === 0) return null;
  return messages.reduce((latest, message) =>
    message.createdAt > latest.createdAt ? message : latest,
  );
}

function unreadCountFor(
  conversation: Conversation,
  messages: Message[] | undefined,
): number {
  if (!messages) return 0;
  return messages.filter(
    (message) =>
      message.senderId !== CURRENT_USER_ID &&
      !message.readBy.includes(CURRENT_USER_ID),
  ).length;
}

const toPreview = (message: Message | null): ConversationPreview | null => {
  if (!message) return null;
  return {
    text: displayTextOf(message),
    senderId: message.senderId,
    createdAt: message.createdAt,
  };
};

export const selectConversationListItems = createSelector(
  [selectConversationItems, selectMessagesByConversation],
  (items, messagesByConversation): ConversationListItem[] =>
    items
      .map((conversation) => {
        const messages = messagesByConversation[conversation.id];
        const otherParticipant =
          conversation.type === "direct"
            ? getUserById(
                conversation.participantIds.find(
                  (id) => id !== CURRENT_USER_ID,
                ) ?? "",
              )
            : undefined;

        return {
          conversation,
          preview: toPreview(latestMessage(messages)),
          unreadCount: unreadCountFor(conversation, messages),
          isOnline:
            conversation.type === "direct" && !!otherParticipant?.isOnline,
        };
      })
      .sort((a, b) =>
        b.conversation.updatedAt.localeCompare(a.conversation.updatedAt),
      ),
);

export const selectFilteredConversationListItems = createSelector(
  [selectConversationListItems, selectSearchQuery, selectActiveFilter],
  (items, searchQuery, activeFilter) => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      if (activeFilter === "unread" && item.unreadCount === 0) return false;
      if (activeFilter === "groups" && item.conversation.type !== "group") {
        return false;
      }
      if (query && !item.conversation.title.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  },
);

export const selectCurrentUser = () => currentUser;

export const selectUserById = (_state: RootState, userId: string) =>
  getUserById(userId);
