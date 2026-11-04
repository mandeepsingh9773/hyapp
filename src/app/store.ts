import { configureStore } from "@reduxjs/toolkit";
import conversationsReducer from "@/features/conversations/conversationsSlice";
import messagesReducer from "@/features/messages/messagesSlice";
import messageInteractionReducer from "@/features/messages/messageInteractionSlice";
import typingReducer from "@/features/messages/typingSlice";
import groupsReducer from "@/features/groups/groupsSlice";
import settingsReducer from "@/features/settings/settingsSlice";
import { chatListenerMiddleware } from "./chatListeners";

export const makeStore = () =>
  configureStore({
    reducer: {
      conversations: conversationsReducer,
      messages: messagesReducer,
      messageInteraction: messageInteractionReducer,
      typing: typingReducer,
      groups: groupsReducer,
      settings: settingsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(chatListenerMiddleware.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
