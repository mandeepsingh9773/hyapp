import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface GroupMembersState {
  addedMembers: Record<string, string[]>;
  removedMembers: Record<string, string[]>;
}

export const initialGroupsState: GroupMembersState = {
  addedMembers: {},
  removedMembers: {},
};

export interface GroupMemberPayload {
  conversationId: string;
  userId: string;
}

const groupsSlice = createSlice({
  name: "groups",
  initialState: initialGroupsState,
  reducers: {
    addGroupMember(state, action: PayloadAction<GroupMemberPayload>) {
      const { conversationId, userId } = action.payload;
      const removed = state.removedMembers[conversationId];
      if (removed) {
        state.removedMembers[conversationId] = removed.filter(
          (id) => id !== userId,
        );
      }
      const added = (state.addedMembers[conversationId] ??= []);
      if (!added.includes(userId)) added.push(userId);
    },
    removeGroupMember(state, action: PayloadAction<GroupMemberPayload>) {
      const { conversationId, userId } = action.payload;
      const added = state.addedMembers[conversationId];
      if (added) {
        state.addedMembers[conversationId] = added.filter(
          (id) => id !== userId,
        );
      }
      const removed = (state.removedMembers[conversationId] ??= []);
      if (!removed.includes(userId)) removed.push(userId);
    },
  },
});

export const { addGroupMember, removeGroupMember } = groupsSlice.actions;

export default groupsSlice.reducer;
