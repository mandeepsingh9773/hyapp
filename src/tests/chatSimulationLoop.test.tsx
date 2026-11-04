import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "@/app/store";
import { ChatSimulation } from "@/components/layout/ChatSimulation";
import { setSimulateActivity } from "@/features/settings/settingsSlice";
import { loadSucceeded } from "@/features/conversations/conversationsSlice";
import { seedConversations } from "@/data/conversations";
import {
  INCOMING_MAX_DELAY_MS,
  INCOMING_MIN_DELAY_MS,
  TYPING_DURATION_MS,
} from "@/services/chatSimulation";

describe("ChatSimulation loop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function readyStore() {
    const store = makeStore();
    store.dispatch(loadSucceeded(seedConversations));
    return store;
  }

  it("emits a typing indicator then an incoming message, and stops on unmount", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const store = readyStore();
    store.dispatch(setSimulateActivity(true));

    const { unmount } = render(
      <Provider store={store}>
        <ChatSimulation />
      </Provider>,
    );

    const messageCountBefore = Object.keys(
      store.getState().messages.byId,
    ).length;

    vi.advanceTimersByTime(INCOMING_MIN_DELAY_MS);

    const typingEntries = Object.values(
      store.getState().typing.typersByConversation,
    ).flat();
    expect(typingEntries.length).toBeGreaterThan(0);

    vi.advanceTimersByTime(TYPING_DURATION_MS);

    const messageCountAfter = Object.keys(store.getState().messages.byId).length;
    expect(messageCountAfter).toBe(messageCountBefore + 1);

    unmount();
    const frozenCount = Object.keys(store.getState().messages.byId).length;
    vi.advanceTimersByTime(INCOMING_MAX_DELAY_MS * 3);
    expect(Object.keys(store.getState().messages.byId).length).toBe(frozenCount);
  });

  it("does not run when the toggle is off", () => {
    const store = readyStore();
    render(
      <Provider store={store}>
        <ChatSimulation />
      </Provider>,
    );
    vi.advanceTimersByTime(INCOMING_MAX_DELAY_MS * 3);
    expect(vi.getTimerCount()).toBe(0);
  });
});
