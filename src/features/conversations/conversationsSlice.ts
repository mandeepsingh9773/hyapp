import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Conversation, ConversationFilter } from "@/types/chat";
import { seedConversations } from "@/data/conversations";

export type ConversationsStatus = "idle" | "loading" | "ready" | "error";

export interface ConversationsState {
  items: Conversation[];
  status: ConversationsStatus;
  selectedConversationId: string | null;
  searchQuery: string;
  activeFilter: ConversationFilter;
}

export const initialConversationsState: ConversationsState = {
  items: seedConversations,
  status: "idle",
  selectedConversationId: null,
  searchQuery: "",
  activeFilter: "all",
};

const conversationsSlice = createSlice({
  name: "conversations",
  initialState: initialConversationsState,
  reducers: {
    startLoading(state) {
      state.status = "loading";
    },
    loadFailed(state) {
      state.status = "error";
    },
    loadSucceeded(state, action: PayloadAction<Conversation[]>) {
      state.status = "ready";
      state.items = action.payload;
    },
    selectConversation(state, action: PayloadAction<string | null>) {
      state.selectedConversationId = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setActiveFilter(state, action: PayloadAction<ConversationFilter>) {
      state.activeFilter = action.payload;
    },
    touchConversation(
      state,
      action: PayloadAction<{ conversationId: string; updatedAt: string }>,
    ) {
      const conversation = state.items.find(
        (item) => item.id === action.payload.conversationId,
      );
      if (conversation) conversation.updatedAt = action.payload.updatedAt;
    },
  },
});

export const {
  startLoading,
  loadFailed,
  loadSucceeded,
  selectConversation,
  setSearchQuery,
  setActiveFilter,
  touchConversation,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
