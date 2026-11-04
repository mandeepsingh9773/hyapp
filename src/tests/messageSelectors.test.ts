import { describe, expect, it } from "vitest";
import { makeStore } from "@/app/store";
import { selectConversation } from "@/features/conversations/conversationsSlice";
import {
  sendMessage,
  MAX_MESSAGE_LENGTH,
} from "@/features/messages/messagesSlice";
import {
  selectMessageListItems,
  selectMessagesForConversation,
} from "@/features/messages/selectors";
import type { Message } from "@/types/chat";

function setupSelected(conversationId: string) {
  const store = makeStore();
  store.dispatch(selectConversation(conversationId));
  return store;
}

describe("message selectors", () => {
  it("sorts messages ascending and interleaves date separators", () => {
    const store = setupSelected("conv-design-team");
    const items = selectMessageListItems(store.getState());

    expect(items[0].kind).toBe("date");

    const messages = items.filter(
      (item): item is Extract<typeof item, { kind: "message" }> =>
        item.kind === "message",
    );
    const dates = messages.map((item) => item.message.createdAt);
    expect([...dates].sort()).toEqual(dates);
  });

  it("inserts exactly one separator per calendar day", () => {
    const store = setupSelected("conv-design-team");
    const items = selectMessageListItems(store.getState());
    const dateKeys = items
      .filter((item) => item.kind === "date")
      .map((item) => item.dateKey);

    expect(dateKeys).toHaveLength(2);
    expect(new Set(dateKeys).size).toBe(dateKeys.length);
  });

  it("attaches the referenced parent message to replies", () => {
    const store = setupSelected("conv-design-team");
    const items = selectMessageListItems(store.getState());
    const reply = items.find(
      (item) => item.kind === "message" && item.message.id === "msg-design-4",
    );

    expect(reply?.kind).toBe("message");
    if (reply?.kind === "message") {
      expect(reply.replyTo?.id).toBe("msg-design-3");
    }
  });

  it("clears unread flags once the conversation is opened", () => {
    const store = makeStore();
    store.dispatch(selectConversation("conv-maya"));

    const items = selectMessageListItems(store.getState());
    const unread = items.filter(
      (item) => item.kind === "message" && item.countsForUnread,
    );

    expect(unread).toHaveLength(0);
  });

  it("returns an empty list when nothing is selected", () => {
    const store = makeStore();
    expect(selectMessageListItems(store.getState())).toEqual([]);
  });

  it("reads messages for an explicit conversation id", () => {
    const store = makeStore();
    const messages = selectMessagesForConversation(
      store.getState(),
      "conv-maya",
    );
    expect(messages).toHaveLength(4);
  });
});

describe("messages slice", () => {
  it("appends a trimmed outgoing message and indexes it", () => {
    const store = makeStore();
    store.dispatch(
      sendMessage({
        conversationId: "conv-liam",
        text: "  Hello there  ",
        now: new Date("2026-01-02T10:00:00Z").getTime(),
      }),
    );

    const state = store.getState();
    const messages = state.messages.byConversation["conv-liam"];
    const added: Message = messages[messages.length - 1];

    expect(added.text).toBe("Hello there");
    expect(added.status).toBe("sent");
    expect(state.messages.byId[added.id]).toBe(added);
  });

  it("ignores whitespace-only messages", () => {
    const store = makeStore();
    const before = store.getState().messages.byConversation["conv-liam"].length;
    store.dispatch(
      sendMessage({ conversationId: "conv-liam", text: "   \n " }),
    );
    expect(store.getState().messages.byConversation["conv-liam"]).toHaveLength(
      before,
    );
  });

  it("rejects messages over the length limit", () => {
    const store = makeStore();
    const before = store.getState().messages.byConversation["conv-liam"].length;
    store.dispatch(
      sendMessage({
        conversationId: "conv-liam",
        text: "a".repeat(MAX_MESSAGE_LENGTH + 1),
      }),
    );
    expect(store.getState().messages.byConversation["conv-liam"]).toHaveLength(
      before,
    );
  });

  it("bumps conversation ordering through the listener", () => {
    const store = makeStore();
    const now = Date.now() + 60_000;
    store.dispatch(
      sendMessage({ conversationId: "conv-priya", text: "newest", now }),
    );

    const conversation = store
      .getState()
      .conversations.items.find((item) => item.id === "conv-priya");

    expect(conversation?.updatedAt).toBe(new Date(now).toISOString());
  });
});
