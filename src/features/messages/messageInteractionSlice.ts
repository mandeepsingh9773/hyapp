import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface MessageInteractionState {
  replyToMessageId: string | null;
  editingMessageId: string | null;
  isSearchOpen: boolean;
  searchQuery: string;
  activeMatchIndex: number;
}

export const initialMessageInteractionState: MessageInteractionState = {
  replyToMessageId: null,
  editingMessageId: null,
  isSearchOpen: false,
  searchQuery: "",
  activeMatchIndex: 0,
};

const messageInteractionSlice = createSlice({
  name: "messageInteraction",
  initialState: initialMessageInteractionState,
  reducers: {
    startReply(state, action: PayloadAction<string>) {
      state.replyToMessageId = action.payload;
      state.editingMessageId = null;
    },
    stopReply(state) {
      state.replyToMessageId = null;
    },
    startEdit(state, action: PayloadAction<string>) {
      state.editingMessageId = action.payload;
      state.replyToMessageId = null;
    },
    stopEdit(state) {
      state.editingMessageId = null;
    },
    openSearch(state) {
      state.isSearchOpen = true;
    },
    closeSearch(state) {
      state.isSearchOpen = false;
      state.searchQuery = "";
      state.activeMatchIndex = 0;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.activeMatchIndex = 0;
    },
    setActiveMatchIndex(state, action: PayloadAction<number>) {
      state.activeMatchIndex = action.payload;
    },
    stepMatch(state, action: PayloadAction<{ matchCount: number; delta: 1 | -1 }>) {
      const { matchCount, delta } = action.payload;
      if (matchCount <= 0) {
        state.activeMatchIndex = 0;
        return;
      }
      const next = state.activeMatchIndex + delta;
      state.activeMatchIndex = (next + matchCount) % matchCount;
    },
  },
});

export const {
  startReply,
  stopReply,
  startEdit,
  stopEdit,
  openSearch,
  closeSearch,
  setSearchQuery,
  setActiveMatchIndex,
  stepMatch,
} = messageInteractionSlice.actions;

export default messageInteractionSlice.reducer;
