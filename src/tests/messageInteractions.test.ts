import { describe, expect, it } from "vitest";
import { makeStore } from "@/app/store";
import { CURRENT_USER_ID, type Message } from "@/types/chat";
import {
  deleteMessage,
  editMessage,
  sendMessage,
  toggleReaction,
} from "@/features/messages/messagesSlice";
import {
  closeSearch,
  openSearch,
  setSearchQuery,
  startEdit,
  startReply,
  stepMatch,
} from "@/features/messages/messageInteractionSlice";
import {
  buildSearchSegments,
  selectMessageListItems,
  selectSearchState,
} from "@/features/messages/selectors";
import { selectConversation } from "@/features/conversations/conversationsSlice";

function lastMessage(store: ReturnType<typeof makeStore>, id: string): Message {
  const messages = store.getState().messages.byConversation[id];
  return messages[messages.length - 1];
}

describe("reply", () => {
  it("stores the reply target id and surfaces the parent message", () => {
    const store = makeStore();
    store.dispatch(selectConversation("conv-maya"));

    store.dispatch(
      sendMessage({
        conversationId: "conv-maya",
        text: "Replying here",
        replyToMessageId: "msg-maya-4",
      }),
    );

    const sent = lastMessage(store, "conv-maya");
    expect(sent.replyToMessageId).toBe("msg-maya-4");

    const items = selectMessageListItems(store.getState());
    const bubble = items.find(
      (item) => item.kind === "message" && item.message.id === sent.id,
    );
    if (bubble?.kind !== "message") throw new Error("expected message item");
    expect(bubble.replyTo?.id).toBe("msg-maya-4");
  });
});

describe("edit", () => {
  it("updates text and updatedAt while preserving id and createdAt", () => {
    const store = makeStore();
    const before = lastMessage(store, "conv-liam");
    const createdAt = before.createdAt;
    const id = before.id;

    store.dispatch(
      editMessage({
        messageId: id,
        text: "Updated text",
        now: new Date("2026-02-01T00:00:00Z").getTime(),
      }),
    );

    const after = store.getState().messages.byId[id];
    expect(after.text).toBe("Updated text");
    expect(after.createdAt).toBe(createdAt);
    expect(after.updatedAt).toBe("2026-02-01T00:00:00.000Z");
  });

  it("refuses to edit another user's message", () => {
    const store = makeStore();
    store.dispatch(
      editMessage({ messageId: "msg-maya-1", text: "Hacked" }),
    );
    expect(store.getState().messages.byId["msg-maya-1"].text).not.toBe("Hacked");
  });

  it("rejects empty edits", () => {
    const store = makeStore();
    const before = lastMessage(store, "conv-liam").text;
    store.dispatch(editMessage({ messageId: lastMessage(store, "conv-liam").id, text: "   " }));
    expect(lastMessage(store, "conv-liam").text).toBe(before);
  });
});

describe("delete", () => {
  it("soft deletes: clears text, drops reactions, keeps reply targets valid", () => {
    const store = makeStore();
    store.dispatch(deleteMessage({ messageId: "msg-design-3" }));

    const deleted = store.getState().messages.byId["msg-design-3"];
    expect(deleted.deletedAt).toBeTruthy();
    expect(deleted.text).toBe("");
    expect(deleted.reactions).toEqual([]);

    store.dispatch(selectConversation("conv-design-team"));
    const items = selectMessageListItems(store.getState());
    const reply = items.find(
      (item) => item.kind === "message" && item.message.id === "msg-design-4",
    );
    if (reply?.kind !== "message") throw new Error("expected message item");
    expect(reply.replyTo?.id).toBe("msg-design-3");
  });

  it("allows deleting any message (own or others)", () => {
    const store = makeStore();
    store.dispatch(deleteMessage({ messageId: "msg-maya-1" }));
    expect(store.getState().messages.byId["msg-maya-1"].deletedAt).toBeTruthy();
  });

  it("blocks edits and reactions on deleted messages", () => {
    const store = makeStore();
    store.dispatch(deleteMessage({ messageId: "msg-liam-2" }));
    store.dispatch(editMessage({ messageId: "msg-liam-2", text: "nope" }));
    store.dispatch(
      toggleReaction({
        messageId: "msg-liam-2",
        emoji: "👍",
        userId: CURRENT_USER_ID,
      }),
    );

    const message = store.getState().messages.byId["msg-liam-2"];
    expect(message.text).toBe("");
    expect(message.reactions).toEqual([]);
  });
});

describe("reactions", () => {
  it("adds then removes a reaction for the same user", () => {
    const store = makeStore();
    const id = "msg-liam-1";

    store.dispatch(toggleReaction({ messageId: id, emoji: "❤️", userId: CURRENT_USER_ID }));
    let reaction = store
      .getState()
      .messages.byId[id].reactions.find((item) => item.emoji === "❤️");
    expect(reaction?.userIds).toContain(CURRENT_USER_ID);

    store.dispatch(toggleReaction({ messageId: id, emoji: "❤️", userId: CURRENT_USER_ID }));
    reaction = store
      .getState()
      .messages.byId[id].reactions.find((item) => item.emoji === "❤️");
    expect(reaction).toBeUndefined();
  });

  it("keeps other users while removing the current one", () => {
    const store = makeStore();
    const id = "msg-maya-2";

    store.dispatch(toggleReaction({ messageId: id, emoji: "👍", userId: CURRENT_USER_ID }));
    let reaction = store
      .getState()
      .messages.byId[id].reactions.find((item) => item.emoji === "👍");
    expect(reaction?.userIds).toEqual(["user-maya", CURRENT_USER_ID]);

    store.dispatch(toggleReaction({ messageId: id, emoji: "👍", userId: CURRENT_USER_ID }));
    reaction = store
      .getState()
      .messages.byId[id].reactions.find((item) => item.emoji === "👍");
    expect(reaction?.userIds).toEqual(["user-maya"]);
  });
});

describe("message search", () => {
  it("splits text into highlighted segments case-insensitively", () => {
    const segments = buildSearchSegments("Hello hello world", "hello");
    expect(segments.filter((segment) => segment.isMatch)).toHaveLength(2);
    expect(segments.map((segment) => segment.text).join("")).toBe(
      "Hello hello world",
    );
  });

  it("returns one non-match segment for an empty query", () => {
    expect(buildSearchSegments("text", "  ")).toEqual([
      { text: "text", isMatch: false },
    ]);
  });

  it("ranks matches and wraps next/prev navigation", () => {
    const store = makeStore();
    store.dispatch(selectConversation("conv-maya"));
    store.dispatch(openSearch());
    store.dispatch(setSearchQuery("color"));

    let result = selectSearchState(store.getState());
    expect(result.matchCount).toBe(1);
    expect(result.activeMessageId).toBe("msg-maya-4");

    store.dispatch(stepMatch({ matchCount: result.matchCount, delta: 1 }));
    result = selectSearchState(store.getState());
    expect(result.activeMatchIndex).toBe(0);

    store.dispatch(closeSearch());
    expect(selectSearchState(store.getState()).matchCount).toBe(0);
  });
});

describe("interaction slice", () => {
  it("keeps reply and edit mutually exclusive", () => {
    const store = makeStore();
    store.dispatch(startReply("m1"));
    store.dispatch(startEdit("m2"));
    const state = store.getState().messageInteraction;
    expect(state.editingMessageId).toBe("m2");
    expect(state.replyToMessageId).toBeNull();
  });
});
