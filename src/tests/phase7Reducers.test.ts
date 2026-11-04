import { describe, expect, it } from "vitest";
import { makeStore } from "@/app/store";
import { sendMessage, failMessage, retryMessage } from "@/features/messages/messagesSlice";
import {
  loadFailed,
  loadSucceeded,
  startLoading,
} from "@/features/conversations/conversationsSlice";
import { seedConversations } from "@/data/conversations";

function sentMessageId(store: ReturnType<typeof makeStore>) {
  store.dispatch(
    sendMessage({
      conversationId: "conv-liam",
      text: "hello there",
      now: Date.now(),
    }),
  );
  const messages = store.getState().messages.byConversation["conv-liam"];
  return messages[messages.length - 1].id;
}

describe("send failure reducers", () => {
  it("marks a message as failed", () => {
    const store = makeStore();
    const id = sentMessageId(store);

    store.dispatch(failMessage({ messageId: id }));
    expect(store.getState().messages.byId[id].status).toBe("failed");
  });

  it("retries a failed message back to sent", () => {
    const store = makeStore();
    const id = sentMessageId(store);

    store.dispatch(failMessage({ messageId: id }));
    store.dispatch(retryMessage({ messageId: id }));
    expect(store.getState().messages.byId[id].status).toBe("sent");
  });

  it("ignores retry when the message is not failed", () => {
    const store = makeStore();
    const id = sentMessageId(store);

    store.dispatch(retryMessage({ messageId: id }));
    expect(store.getState().messages.byId[id].status).toBe("sent");
  });
});

describe("conversation loading reducers", () => {
  it("cycles through loading, ready, and error states", () => {
    const store = makeStore();

    store.dispatch(startLoading());
    expect(store.getState().conversations.status).toBe("loading");

    store.dispatch(loadSucceeded(seedConversations));
    expect(store.getState().conversations.status).toBe("ready");
    expect(store.getState().conversations.items).toHaveLength(
      seedConversations.length,
    );

    store.dispatch(loadFailed());
    expect(store.getState().conversations.status).toBe("error");
  });
});
