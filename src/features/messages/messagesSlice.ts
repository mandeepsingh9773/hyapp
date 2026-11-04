import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  CURRENT_USER_ID,
  type Message,
  type MessageStatus,
} from "@/types/chat";
import { seedMessages } from "@/data/messages";
import { createMessageId } from "./utils/createMessageId";

export type MessagesByConversation = Record<string, Message[]>;
export type MessagesById = Record<string, Message>;

export interface MessagesState {
  byConversation: MessagesByConversation;
  byId: MessagesById;
}

function groupByConversation(messages: Message[]): MessagesByConversation {
  return messages.reduce<MessagesByConversation>((acc, message) => {
    (acc[message.conversationId] ??= []).push(message);
    return acc;
  }, {});
}

function indexById(messages: Message[]): MessagesById {
  return messages.reduce<MessagesById>((acc, message) => {
    acc[message.id] = message;
    return acc;
  }, {});
}

export function buildInitialMessagesState(messages: Message[]): MessagesState {
  return {
    byConversation: groupByConversation(messages),
    byId: indexById(messages),
  };
}

export const initialMessagesState: MessagesState =
  buildInitialMessagesState(seedMessages);

export const MAX_MESSAGE_LENGTH = 2000;

interface LocatedMessage {
  conversationId: string;
  message: Message;
}

function locateMessage(
  state: MessagesState,
  messageId: string,
): LocatedMessage | null {
  const indexed = state.byId[messageId];
  if (!indexed) return null;
  const list = state.byConversation[indexed.conversationId];
  const message = list?.find((item) => item.id === messageId);
  return message
    ? { conversationId: indexed.conversationId, message }
    : null;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
  replyToMessageId?: string;
  now?: number;
}

export interface EditMessagePayload {
  messageId: string;
  text: string;
  now?: number;
}

export interface DeleteMessagePayload {
  messageId: string;
  now?: number;
}

export interface ToggleReactionPayload {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface ReceiveMessagePayload {
  conversationId: string;
  senderId: string;
  text: string;
  id?: string;
  now?: number;
}

export interface UpdateMessageStatusPayload {
  messageId: string;
  status: MessageStatus;
}

export interface FailMessagePayload {
  messageId: string;
}

export interface MarkConversationReadPayload {
  conversationId: string;
  userId: string;
}

const messagesSlice = createSlice({
  name: "messages",
  initialState: initialMessagesState,
  reducers: {
    sendMessage(state, action: PayloadAction<SendMessagePayload>) {
      const text = action.payload.text.trim();
      if (!text || text.length > MAX_MESSAGE_LENGTH) return;

      const now = action.payload.now ?? Date.now();
      const createdAt = new Date(now).toISOString();
      const message: Message = {
        id: createMessageId(now),
        conversationId: action.payload.conversationId,
        senderId: CURRENT_USER_ID,
        text,
        createdAt,
        status: "sent",
        replyToMessageId: action.payload.replyToMessageId,
        reactions: [],
        readBy: [CURRENT_USER_ID],
      };

      state.byConversation[message.conversationId] ??= [];
      state.byConversation[message.conversationId].push(message);
      state.byId[message.id] = message;
    },
    editMessage(state, action: PayloadAction<EditMessagePayload>) {
      const located = locateMessage(state, action.payload.messageId);
      if (!located || located.message.deletedAt) return;
      if (located.message.senderId !== CURRENT_USER_ID) return;

      const text = action.payload.text.trim();
      if (!text || text.length > MAX_MESSAGE_LENGTH) return;

      located.message.text = text;
      located.message.updatedAt = new Date(
        action.payload.now ?? Date.now(),
      ).toISOString();
      state.byId[located.message.id] = located.message;
    },
    deleteMessage(state, action: PayloadAction<DeleteMessagePayload>) {
      const located = locateMessage(state, action.payload.messageId);
      if (!located || located.message.deletedAt) return;

      located.message.deletedAt = new Date(
        action.payload.now ?? Date.now(),
      ).toISOString();
      located.message.text = "";
      located.message.reactions = [];
      state.byId[located.message.id] = located.message;
    },
    toggleReaction(state, action: PayloadAction<ToggleReactionPayload>) {
      const located = locateMessage(state, action.payload.messageId);
      if (!located || located.message.deletedAt) return;

      const { emoji, userId } = action.payload;
      const reaction = located.message.reactions.find(
        (item) => item.emoji === emoji,
      );

      if (!reaction) {
        located.message.reactions.push({ emoji, userIds: [userId] });
      } else {
        reaction.userIds = reaction.userIds.includes(userId)
          ? reaction.userIds.filter((id) => id !== userId)
          : [...reaction.userIds, userId];

        if (reaction.userIds.length === 0) {
          located.message.reactions = located.message.reactions.filter(
            (item) => item.emoji !== emoji,
          );
        }
      }
      state.byId[located.message.id] = located.message;
    },
    receiveMessage(state, action: PayloadAction<ReceiveMessagePayload>) {
      const text = action.payload.text.trim();
      if (!text) return;

      const now = action.payload.now ?? Date.now();
      const message: Message = {
        id: action.payload.id ?? createMessageId(now),
        conversationId: action.payload.conversationId,
        senderId: action.payload.senderId,
        text,
        createdAt: new Date(now).toISOString(),
        status: "read",
        reactions: [],
        readBy: [action.payload.senderId],
      };

      state.byConversation[message.conversationId] ??= [];
      state.byConversation[message.conversationId].push(message);
      state.byId[message.id] = message;
    },
    updateMessageStatus(
      state,
      action: PayloadAction<UpdateMessageStatusPayload>,
    ) {
      const message = state.byId[action.payload.messageId];
      if (!message || message.deletedAt) return;
      message.status = action.payload.status;
      state.byId[message.id] = message;
    },
    failMessage(state, action: PayloadAction<FailMessagePayload>) {
      const located = locateMessage(state, action.payload.messageId);
      if (!located || located.message.deletedAt) return;
      located.message.status = "failed";
      state.byId[located.message.id] = located.message;
    },
    retryMessage(state, action: PayloadAction<FailMessagePayload>) {
      const located = locateMessage(state, action.payload.messageId);
      if (!located || located.message.deletedAt) return;
      if (located.message.status !== "failed") return;
      located.message.status = "sent";
      state.byId[located.message.id] = located.message;
    },
    markConversationRead(
      state,
      action: PayloadAction<MarkConversationReadPayload>,
    ) {
      const { conversationId, userId } = action.payload;
      const messages = state.byConversation[conversationId];
      if (!messages) return;

      for (const message of messages) {
        if (message.senderId === userId) continue;
        if (message.readBy.includes(userId)) continue;
        message.readBy = [...message.readBy, userId];
        state.byId[message.id] = message;
      }
    },
  },
});

export const {
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  receiveMessage,
  updateMessageStatus,
  failMessage,
  retryMessage,
  markConversationRead,
} = messagesSlice.actions;

export default messagesSlice.reducer;
