import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { CURRENT_USER_ID } from "@/types/chat";
import {
  sendMessage,
  receiveMessage,
  updateMessageStatus,
  failMessage,
  retryMessage,
  markConversationRead,
} from "@/features/messages/messagesSlice";
import { clearTyping } from "@/features/messages/typingSlice";
import {
  selectConversation,
  touchConversation,
} from "@/features/conversations/conversationsSlice";
import {
  FAILURE_DELAY_MS,
  STATUS_DELAYS_MS,
  STATUS_SEQUENCE,
  SimulationTimers,
  shouldFailSend,
} from "@/services/chatSimulation";

export const chatListenerMiddleware = createListenerMiddleware();

const startListening = chatListenerMiddleware.startListening.withTypes<
  RootState
>();

const statusTimers = new SimulationTimers();

function scheduleStatusSequence(
  dispatch: (action: ReturnType<typeof updateMessageStatus>) => void,
  messageId: string,
) {
  for (const status of STATUS_SEQUENCE) {
    statusTimers.schedule(
      () => dispatch(updateMessageStatus({ messageId, status })),
      STATUS_DELAYS_MS[status],
    );
  }
}

startListening({
  actionCreator: sendMessage,
  effect: (action, listenerApi) => {
    const conversationId = action.payload.conversationId;
    const messages =
      listenerApi.getState().messages.byConversation[conversationId];
    const message = messages?.[messages.length - 1];
    if (!message) return;

    listenerApi.dispatch(
      touchConversation({ conversationId, updatedAt: message.createdAt }),
    );

    if (shouldFailSend(action.payload.text)) {
      statusTimers.schedule(
        () => listenerApi.dispatch(failMessage({ messageId: message.id })),
        FAILURE_DELAY_MS,
      );
      return;
    }

    scheduleStatusSequence(
      (statusAction) => listenerApi.dispatch(statusAction),
      message.id,
    );
  },
});

startListening({
  actionCreator: retryMessage,
  effect: (action, listenerApi) => {
    scheduleStatusSequence(
      (statusAction) => listenerApi.dispatch(statusAction),
      action.payload.messageId,
    );
  },
});

startListening({
  actionCreator: receiveMessage,
  effect: (action, listenerApi) => {
    const conversationId = action.payload.conversationId;
    const messages =
      listenerApi.getState().messages.byConversation[conversationId];
    const message = messages?.[messages.length - 1];
    if (!message) return;

    listenerApi.dispatch(
      clearTyping({ conversationId, userId: message.senderId }),
    );
    listenerApi.dispatch(
      touchConversation({ conversationId, updatedAt: message.createdAt }),
    );

    if (
      listenerApi.getState().conversations.selectedConversationId ===
      conversationId
    ) {
      listenerApi.dispatch(
        markConversationRead({
          conversationId,
          userId: CURRENT_USER_ID,
        }),
      );
    }
  },
});

startListening({
  actionCreator: selectConversation,
  effect: (action, listenerApi) => {
    const conversationId = action.payload;
    if (!conversationId) return;
    listenerApi.dispatch(
      markConversationRead({ conversationId, userId: CURRENT_USER_ID }),
    );
  },
});
