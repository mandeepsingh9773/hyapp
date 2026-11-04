import { describe, expect, it } from "vitest";
import { makeStore } from "@/app/store";
import { CURRENT_USER_ID } from "@/types/chat";
import {
  markConversationRead,
  receiveMessage,
  sendMessage,
  updateMessageStatus,
} from "@/features/messages/messagesSlice";
import { selectConversation } from "@/features/conversations/conversationsSlice";
import {
  addGroupMember,
  removeGroupMember,
} from "@/features/groups/groupsSlice";
import {
  resolveGroupMemberIds,
  selectGroupMemberIds,
  selectGroupMembers,
} from "@/features/groups/selectors";
import { clearTyping, setTyping } from "@/features/messages/typingSlice";
import { selectTypingLabel } from "@/features/messages/typingSelectors";
import { selectConversationListItems } from "@/features/conversations/selectors";
import {
  nextIncomingDelay,
  INCOMING_MAX_DELAY_MS,
  INCOMING_MIN_DELAY_MS,
} from "@/services/chatSimulation";

describe("receive message", () => {
  it("appends an incoming message and leaves it unread in inactive conversations", () => {
    const store = makeStore();
    store.dispatch(
      receiveMessage({
        conversationId: "conv-liam",
        senderId: "user-liam",
        text: "New ping",
        id: "msg-incoming-1",
      }),
    );

    const message = store.getState().messages.byId["msg-incoming-1"];
    expect(message.senderId).toBe("user-liam");
    expect(message.readBy).not.toContain(CURRENT_USER_ID);

    const item = selectConversationListItems(store.getState()).find(
      (entry) => entry.conversation.id === "conv-liam",
    );
    expect(item?.unreadCount).toBe(1);
  });

  it("marks an incoming message read when the conversation is active", () => {
    const store = makeStore();
    store.dispatch(selectConversation("conv-liam"));
    store.dispatch(
      receiveMessage({
        conversationId: "conv-liam",
        senderId: "user-liam",
        text: "While you watch",
        id: "msg-incoming-2",
      }),
    );

    const message = store.getState().messages.byId["msg-incoming-2"];
    expect(message.readBy).toContain(CURRENT_USER_ID);
  });

  it("bumps conversation ordering through the listener", () => {
    const store = makeStore();
    store.dispatch(
      receiveMessage({
        conversationId: "conv-priya",
        senderId: "user-priya",
        text: "Bump",
        id: "msg-incoming-3",
        now: Date.now() + 60_000,
      }),
    );

    const top = selectConversationListItems(store.getState())[0];
    expect(top.conversation.id).toBe("conv-priya");
  });
});

describe("outgoing status transitions", () => {
  it("starts at sent and advances through the simulation listener", async () => {
    const store = makeStore();
    store.dispatch(selectConversation("conv-maya"));
    store.dispatch(
      sendMessage({ conversationId: "conv-maya", text: "Status me" }),
    );

    const messages = store.getState().messages.byConversation["conv-maya"];
    const sent = messages[messages.length - 1];
    expect(sent.status).toBe("sent");

    store.dispatch(
      updateMessageStatus({ messageId: sent.id, status: "delivered" }),
    );
    expect(store.getState().messages.byId[sent.id].status).toBe("delivered");

    store.dispatch(updateMessageStatus({ messageId: sent.id, status: "read" }));
    expect(store.getState().messages.byId[sent.id].status).toBe("read");
  });

  it("ignores status updates for deleted messages", () => {
    const store = makeStore();
    store.dispatch(
      updateMessageStatus({ messageId: "msg-maya-3", status: "read" }),
    );
    expect(store.getState().messages.byId["msg-maya-3"].status).toBe("read");

    store.dispatch(
      updateMessageStatus({ messageId: "missing", status: "delivered" }),
    );
    expect(store.getState().messages.byId["missing"]).toBeUndefined();
  });
});

describe("mark conversation read", () => {
  it("adds the current user to readBy on unread incoming messages", () => {
    const store = makeStore();
    store.dispatch(
      markConversationRead({
        conversationId: "conv-maya",
        userId: CURRENT_USER_ID,
      }),
    );

    const messages = store.getState().messages.byConversation["conv-maya"];
    const incoming = messages.filter(
      (message) => message.senderId !== CURRENT_USER_ID,
    );
    expect(incoming.every((message) => message.readBy.includes(CURRENT_USER_ID))).toBe(
      true,
    );
  });

  it("drives unread counts down to zero after opening", () => {
    const store = makeStore();
    store.dispatch(
      receiveMessage({
        conversationId: "conv-priya",
        senderId: "user-priya",
        text: "Unread one",
        id: "msg-priya-unread",
      }),
    );
    store.dispatch(selectConversation("conv-priya"));

    const item = selectConversationListItems(store.getState()).find(
      (entry) => entry.conversation.id === "conv-priya",
    );
    expect(item?.unreadCount).toBe(0);
  });
});

describe("typing state", () => {
  it("tracks and clears typers per conversation", () => {
    const store = makeStore();
    store.dispatch(setTyping({ conversationId: "conv-maya", userId: "user-maya" }));
    expect(selectTypingLabel(store.getState(), "conv-maya")).toBe(
      "Maya Chen is typing...",
    );

    store.dispatch(
      clearTyping({ conversationId: "conv-maya", userId: "user-maya" }),
    );
    expect(selectTypingLabel(store.getState(), "conv-maya")).toBeNull();
  });
});

describe("group member management", () => {
  it("adds and removes members through the groups slice", () => {
    const store = makeStore();
    store.dispatch(
      addGroupMember({ conversationId: "conv-design-team", userId: "user-noah" }),
    );
    expect(selectGroupMemberIds(store.getState())["conv-design-team"]).toContain(
      "user-noah",
    );

    store.dispatch(
      removeGroupMember({
        conversationId: "conv-design-team",
        userId: "user-sofia",
      }),
    );
    const members = selectGroupMembers(store.getState(), "conv-design-team");
    expect(members.map((member) => member.id)).not.toContain("user-sofia");
    expect(members.map((member) => member.id)).toContain("user-noah");
  });

  it("resolveGroupMemberIds reconciles additions and removals", () => {
    const conversation = {
      id: "g",
      type: "group" as const,
      title: "G",
      avatarUrl: "",
      participantIds: ["a", "b"],
      updatedAt: "",
    };
    expect(resolveGroupMemberIds(conversation, ["c", "a"], ["b"])).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("incoming simulation delay", () => {
  it("stays within the configured bounds", () => {
    expect(nextIncomingDelay(() => 0)).toBe(INCOMING_MIN_DELAY_MS);
    expect(nextIncomingDelay(() => 0.999999)).toBeLessThan(INCOMING_MAX_DELAY_MS);
  });
});
