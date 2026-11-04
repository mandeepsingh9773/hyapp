import { describe, expect, it } from "vitest";
import { act } from "react";
import { renderApp, screen, within, openConversation } from "./renderApp";
import { receiveMessage } from "@/features/messages/messagesSlice";

function messageLog(): HTMLElement {
  return screen.getByRole("log", { name: "Messages" });
}

function setMetrics(
  node: HTMLElement,
  metrics: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
  Object.defineProperty(node, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(node, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  node.scrollTop = metrics.scrollTop;
}

describe("scroll behavior", () => {
  it("follows an incoming message when the user is at the bottom", async () => {
    const store = renderApp();
    await openConversation("Maya Chen");
    const log = messageLog();
    setMetrics(log, { scrollTop: 500, scrollHeight: 800, clientHeight: 300 });

    act(() => {
      store.dispatch(
        receiveMessage({
          conversationId: "conv-maya",
          senderId: "user-maya",
          text: "New at the bottom",
        }),
      );
    });

    expect(within(log).getByText("New at the bottom")).toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
    expect(
      screen.queryByRole("button", { name: /New messages/ }),
    ).not.toBeInTheDocument();
  });

  it("preserves position and shows a jump pill when reading older messages", async () => {
    const store = renderApp();
    await openConversation("Maya Chen");
    const log = messageLog();
    setMetrics(log, { scrollTop: 0, scrollHeight: 1200, clientHeight: 300 });

    act(() => {
      log.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    act(() => {
      store.dispatch(
        receiveMessage({
          conversationId: "conv-maya",
          senderId: "user-maya",
          text: "While you were reading",
        }),
      );
    });

    expect(log.scrollTop).toBe(0);
    expect(
      await screen.findByRole("button", { name: /New messages/ }),
    ).toBeInTheDocument();
  });

  it("clears the jump pill when clicked", async () => {
    const store = renderApp();
    const user = await openConversation("Maya Chen");
    const log = messageLog();
    setMetrics(log, { scrollTop: 0, scrollHeight: 1200, clientHeight: 300 });

    act(() => {
      log.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    act(() => {
      store.dispatch(
        receiveMessage({
          conversationId: "conv-maya",
          senderId: "user-maya",
          text: "Jump target",
        }),
      );
    });

    const pill = await screen.findByRole("button", { name: /New messages/ });
    await user.click(pill);

    expect(
      screen.queryByRole("button", { name: /New messages/ }),
    ).not.toBeInTheDocument();
  });

  it("scrolls to the bottom after the user sends a message", async () => {
    renderApp();
    const user = await openConversation("Liam Patel");
    const log = messageLog();
    setMetrics(log, { scrollTop: 0, scrollHeight: 1200, clientHeight: 300 });

    act(() => {
      log.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await user.type(screen.getByLabelText("Message"), "My own message");
    await user.keyboard("{Enter}");

    expect(log.scrollTop).toBe(log.scrollHeight);
  });
});
