import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TypingState {
  typersByConversation: Record<string, string[]>;
}

export const initialTypingState: TypingState = {
  typersByConversation: {},
};

export interface TypingPayload {
  conversationId: string;
  userId: string;
}

const typingSlice = createSlice({
  name: "typing",
  initialState: initialTypingState,
  reducers: {
    setTyping(state, action: PayloadAction<TypingPayload>) {
      const { conversationId, userId } = action.payload;
      const typers = (state.typersByConversation[conversationId] ??= []);
      if (!typers.includes(userId)) typers.push(userId);
    },
    clearTyping(state, action: PayloadAction<TypingPayload>) {
      const { conversationId, userId } = action.payload;
      const typers = state.typersByConversation[conversationId];
      if (!typers) return;
      state.typersByConversation[conversationId] = typers.filter(
        (id) => id !== userId,
      );
    },
    clearTypingForConversation(state, action: PayloadAction<string>) {
      delete state.typersByConversation[action.payload];
    },
    clearAllTyping(state) {
      state.typersByConversation = {};
    },
  },
});

export const {
  setTyping,
  clearTyping,
  clearTypingForConversation,
  clearAllTyping,
} = typingSlice.actions;

export default typingSlice.reducer;
