export type User = {
  id: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeenAt?: string;
};

export type ConversationType = "direct" | "group";

export type Conversation = {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl: string;
  participantIds: string[];
  updatedAt: string;
};

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type Reaction = {
  emoji: string;
  userIds: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  status: MessageStatus;
  replyToMessageId?: string;
  reactions: Reaction[];
  readBy: string[];
};

export const DELETED_MESSAGE_TEXT = "This message was deleted";

export type QuickReaction = "👍" | "❤️" | "😂" | "😮" | "😢" | "🙏";

export const QUICK_REACTIONS: readonly QuickReaction[] = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
];

export type ConversationFilter = "all" | "unread" | "groups";

export type ConversationPreview = {
  text: string;
  senderId: string;
  createdAt: string;
};

export type ConversationListItem = {
  conversation: Conversation;
  preview: ConversationPreview | null;
  unreadCount: number;
  isOnline: boolean;
};

export type Theme = "light" | "dark";

export const CURRENT_USER_ID = "user-current";
