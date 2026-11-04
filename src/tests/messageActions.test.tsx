import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "@/app/store";
import { App } from "@/app/App";

function renderApp() {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  return store;
}

async function openConversation(name: string) {
  const user = userEvent.setup();
  const list = await screen.findByRole("list", { name: "Conversation list" });
  await user.click(within(list).getByText(name));
  return user;
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

function messageItem(container: Element, messageId: string) {
  const element = container.querySelector(`[data-message-id="${messageId}"]`);
  if (!element) throw new Error(`message ${messageId} not found`);
  return element as HTMLElement;
}

async function openActions(user: ReturnType<typeof userEvent.setup>, item: HTMLElement) {
  await user.click(within(item).getByRole("button", { name: "Message actions" }));
}

describe("Message interactions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("replies to a message and shows reply context", async () => {
    const store = renderApp();
    const user = await openConversation("Maya Chen");
    const messages = screen.getByRole("log", { name: "Messages" });
    const target = messageItem(messages, "msg-maya-1");

    await openActions(user, target);
    await user.click(screen.getByRole("menuitem", { name: "Reply" }));

    expect(screen.getByText(/Replying to/)).toBeInTheDocument();

    const input = screen.getByLabelText("Message");
    await user.type(input, "My reply");
    await user.keyboard("{Enter}");

    const list = store.getState().messages.byConversation["conv-maya"];
    const sent = list[list.length - 1];
    expect(sent.replyToMessageId).toBe("msg-maya-1");
    expect(sent.text).toBe("My reply");
    expect(screen.queryByText(/Replying to/)).not.toBeInTheDocument();
  });

  it("edits the current user's message and marks it edited", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const own = messageItem(messages, "msg-liam-2");

    await openActions(user, own);
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    const input = screen.getByLabelText("Message");
    expect(input).toHaveValue("Yep, I'll bring the Redux draft.");

    await user.clear(input);
    await user.type(input, "See you at 3");
    await user.keyboard("{Enter}");

    const updated = store.getState().messages.byId["msg-liam-2"];
    expect(updated.text).toBe("See you at 3");
    expect(updated.updatedAt).toBeTruthy();
    expect(within(messages).getByText("edited")).toBeInTheDocument();
  });

  it("hides the edit action for messages from other users", async () => {
    renderApp();
    const user = await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    await openActions(user, messageItem(messages, "msg-liam-1"));

    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("deletes a message and renders a placeholder without breaking replies", async () => {
    const store = renderApp();
    const user = await openConversation("Design Team");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-design-3"));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(store.getState().messages.byId["msg-design-3"].deletedAt).toBeTruthy();
    expect(
      within(messages).getAllByText("This message was deleted").length,
    ).toBeGreaterThan(0);
    expect(
      within(messages).getByText("Not final — I'll share options today."),
    ).toBeInTheDocument();
  });

  it("copies message content and shows success feedback", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-1"));
    await user.click(screen.getByRole("menuitem", { name: "Copy" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "Hey! Did you get a chance to look at the new mockups?",
      ),
    );
    expect(await screen.findByText("Message copied")).toBeInTheDocument();
  });

  it("shows failure feedback when copying fails", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-1"));
    await user.click(screen.getByRole("menuitem", { name: "Copy" }));

    expect(
      await screen.findByText("Could not copy message"),
    ).toBeInTheDocument();
  });

  it("adds and removes an emoji reaction", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const item = messageItem(messages, "msg-liam-1");

    await user.click(
      within(item).getByRole("button", { name: "React to message" }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "React with ❤️" }),
    );

    let reaction = store
      .getState()
      .messages.byId["msg-liam-1"].reactions.find((r) => r.emoji === "❤️");
    expect(reaction?.userIds).toContain("user-current");

    const chip = await within(item).findByRole("button", { name: "❤️ 1" });
    await user.click(chip);

    reaction = store
      .getState()
      .messages.byId["msg-liam-1"].reactions.find((r) => r.emoji === "❤️");
    expect(reaction).toBeUndefined();
  });

  it("positions the reaction picker below the bubble", async () => {
    renderApp();
    const user = await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const item = messageItem(messages, "msg-liam-1");
    const bubble = item.querySelector("[data-message-bubble]") as HTMLElement;

    bubble.getBoundingClientRect = () =>
      ({
        top: 100,
        bottom: 150,
        left: 300,
        width: 200,
        right: 500,
        height: 50,
        x: 300,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;

    await user.click(
      within(item).getByRole("button", { name: "React to message" }),
    );

    const picker = screen.getByRole("menu", { name: "Pick a reaction" });
    expect(picker.style.top).toBe("156px");
    expect(picker.style.left).toBe("284px");
  });

  it("does not offer a React option in the actions menu", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-1"));
    expect(
      screen.queryByRole("menuitem", { name: "React" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Reply", "Copy", "Delete"]);
  });

  it("searches messages and highlights matches", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");

    await user.click(screen.getByRole("button", { name: "Search messages" }));
    await user.type(screen.getByLabelText("Search messages"), "color");

    expect(await screen.findByText("1 of 1")).toBeInTheDocument();
    const messages = screen.getByRole("log", { name: "Messages" });
    expect(within(messages).getByText("color").tagName).toBe("MARK");
  });

  it("shows no results for a query with no matches", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");

    await user.click(screen.getByRole("button", { name: "Search messages" }));
    await user.type(screen.getByLabelText("Search messages"), "zzzzz");

    expect(await screen.findByText("No results")).toBeInTheDocument();
  });

  it("cancels a reply with Escape", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-2"));
    await user.click(screen.getByRole("menuitem", { name: "Reply" }));
    expect(screen.getByText(/Replying to/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText(/Replying to/)).not.toBeInTheDocument();
  });

  it("opens only one message action menu at a time", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-1"));
    expect(screen.getAllByRole("menu", { name: "Message actions" })).toHaveLength(
      1,
    );

    await openActions(user, messageItem(messages, "msg-maya-2"));
    expect(screen.getAllByRole("menu", { name: "Message actions" })).toHaveLength(
      1,
    );
  });

  it("closes the menu when clicking outside", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-1"));
    expect(screen.getByRole("menu", { name: "Message actions" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Message"));
    expect(
      screen.queryByRole("menu", { name: "Message actions" }),
    ).not.toBeInTheDocument();
  });

  it("portals the menu outside the message log so it is not clipped", async () => {
    renderApp();
    const user = await openConversation("Maya Chen");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-maya-1"));
    const menu = screen.getByRole("menu", { name: "Message actions" });

    expect(messages.contains(menu)).toBe(false);
    expect(menu.style.position).toBe("fixed");
  });

  it("places actions beside the bubble and the react button on the outer side", async () => {
    renderApp();
    const user = await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });

    const incoming = messageItem(messages, "msg-liam-1");
    const incomingButtons = within(incoming).getAllByRole("button");
    expect(incomingButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "React to message",
      "Message actions",
    ]);

    const own = messageItem(messages, "msg-liam-2");
    const ownButtons = within(own).getAllByRole("button");
    expect(ownButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "React to message",
      "Message actions",
    ]);

    const ownCluster = ownButtons[0].parentElement;
    expect(ownCluster?.className).toContain("flex-row-reverse");
    expect(ownCluster?.className).toContain("right-full");
    const incomingCluster = incomingButtons[0].parentElement;
    expect(incomingCluster?.className).not.toContain("flex-row-reverse");
    expect(incomingCluster?.className).toContain("left-full");
    void user;
  });

  function actionsCluster(target: HTMLElement) {
    const cluster = within(target)
      .getByRole("button", { name: "React to message" })
      .parentElement;
    if (!cluster) throw new Error("actions cluster not found");
    return cluster as HTMLElement;
  }

  function hasClass(el: HTMLElement, token: string) {
    return el.className.split(/\s+/).includes(token);
  }

  it("reveals the inline action icons on long press below 768px", async () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(767);
    renderApp();
    await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const target = messageItem(messages, "msg-liam-1");
    const bubble = target.querySelector("p")?.parentElement as HTMLElement;
    const cluster = actionsCluster(target);

    expect(hasClass(cluster, "max-md:hidden")).toBe(true);
    expect(hasClass(cluster, "opacity-100")).toBe(false);

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(bubble, {
        pointerType: "touch",
        clientX: 10,
        clientY: 10,
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
    } finally {
      vi.useRealTimers();
    }

    expect(hasClass(cluster, "opacity-100")).toBe(true);
    expect(hasClass(cluster, "max-md:hidden")).toBe(false);
    expect(screen.queryByRole("menu", { name: "Pick a reaction" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menu", { name: "Message actions" })).not.toBeInTheDocument();
  });

  it("keeps the action icons hidden by default and on long press at 768px or wider", async () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1024);
    renderApp();
    await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const target = messageItem(messages, "msg-liam-1");
    const bubble = target.querySelector("p")?.parentElement as HTMLElement;
    const cluster = actionsCluster(target);

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(bubble, {
        pointerType: "touch",
        clientX: 10,
        clientY: 10,
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
    } finally {
      vi.useRealTimers();
    }

    expect(hasClass(cluster, "opacity-100")).toBe(false);
  });

  it("opens the reaction picker when tapping the revealed react icon", async () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(767);
    const store = renderApp();
    await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const target = messageItem(messages, "msg-liam-1");
    const bubble = target.querySelector("p")?.parentElement as HTMLElement;

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(bubble, {
        pointerType: "touch",
        clientX: 10,
        clientY: 10,
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
    } finally {
      vi.useRealTimers();
    }

    fireEvent.click(within(target).getByRole("button", { name: "React to message" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "React with ❤️" }));

    const reaction = store
      .getState()
      .messages.byId["msg-liam-1"].reactions.find((r) => r.emoji === "❤️");
    expect(reaction?.userIds).toContain("user-current");
  });

  it("keeps the action icons hidden on a short tap", async () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(767);
    renderApp();
    await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });
    const target = messageItem(messages, "msg-liam-1");
    const bubble = target.querySelector("p")?.parentElement as HTMLElement;
    const cluster = actionsCluster(target);

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(bubble, {
        pointerType: "touch",
        clientX: 10,
        clientY: 10,
      });
      fireEvent.pointerUp(bubble, { pointerType: "touch" });
      act(() => {
        vi.advanceTimersByTime(500);
      });
    } finally {
      vi.useRealTimers();
    }

    expect(hasClass(cluster, "max-md:hidden")).toBe(true);
    expect(hasClass(cluster, "opacity-100")).toBe(false);
  });

  it("offers Edit only for own messages in the actions menu", async () => {
    renderApp();
    const user = await openConversation("Liam Patel");
    const messages = screen.getByRole("log", { name: "Messages" });

    await openActions(user, messageItem(messages, "msg-liam-2"));
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Reply", "Copy", "Edit", "Delete"]);
  });
});
