import { describe, expect, it } from "vitest";
import { makeStore } from "@/app/store";
import {
  setActiveFilter,
  setSearchQuery,
} from "@/features/conversations/conversationsSlice";
import {
  selectConversationListItems,
  selectFilteredConversationListItems,
} from "@/features/conversations/selectors";

describe("conversation selectors", () => {
  it("derives latest-message previews and sorts by updatedAt desc", () => {
    const store = makeStore();
    const items = selectConversationListItems(store.getState());

    expect(items[0].conversation.id).toBe("conv-maya");
    expect(items[0].preview?.text).toContain("color tokens");
    const dates = items.map((item) => item.conversation.updatedAt);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it("counts unread incoming messages from read state", () => {
    const store = makeStore();
    const items = selectConversationListItems(store.getState());
    const maya = items.find((item) => item.conversation.id === "conv-maya");
    const design = items.find(
      (item) => item.conversation.id === "conv-design-team",
    );

    expect(maya?.unreadCount).toBe(2);
    expect(design?.unreadCount).toBe(1);
  });

  it("matches conversation titles case-insensitively", () => {
    const store = makeStore();
    store.dispatch(setSearchQuery("mAYA"));
    const items = selectFilteredConversationListItems(store.getState());
    expect(items.map((item) => item.conversation.id)).toEqual(["conv-maya"]);
  });

  it("filters unread conversations", () => {
    const store = makeStore();
    store.dispatch(setActiveFilter("unread"));
    const items = selectFilteredConversationListItems(store.getState());
    expect(items.every((item) => item.unreadCount > 0)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("filters group conversations", () => {
    const store = makeStore();
    store.dispatch(setActiveFilter("groups"));
    const items = selectFilteredConversationListItems(store.getState());
    expect(items.every((item) => item.conversation.type === "group")).toBe(true);
  });

  it("combines search with the active filter", () => {
    const store = makeStore();
    store.dispatch(setActiveFilter("groups"));
    store.dispatch(setSearchQuery("hike"));
    const items = selectFilteredConversationListItems(store.getState());
    expect(items.map((item) => item.conversation.id)).toEqual([
      "conv-weekend-hike",
    ]);
  });
});
