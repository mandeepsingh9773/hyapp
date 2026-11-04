import { describe, expect, it } from "vitest";
import { renderApp, screen, within, userEvent } from "./renderApp";

describe("Conversation sidebar", () => {
  it("lists conversations with previews ordered by activity", async () => {
    renderApp();
    const list = await screen.findByRole("list", { name: "Conversation list" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent("Maya Chen");
    expect(items[0]).toHaveTextContent("color tokens");
  });

  it("shows an unread badge derived from read state", async () => {
    renderApp();
    expect(await screen.findByLabelText("2 unread")).toBeInTheDocument();
    expect(screen.getByLabelText("1 unread")).toBeInTheDocument();
  });

  it("filters conversations by search query", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("list", { name: "Conversation list" });

    await user.type(
      screen.getByRole("searchbox", { name: "Search conversations" }),
      "liam",
    );

    const list = screen.getByRole("list", { name: "Conversation list" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(within(list).getByText("Liam Patel")).toBeInTheDocument();
  });

  it("switches between All, Unread, and Groups filters", async () => {
    const user = userEvent.setup();
    const store = renderApp();
    await screen.findByRole("list", { name: "Conversation list" });
    const list = () => screen.getByRole("list", { name: "Conversation list" });

    await user.click(screen.getByRole("tab", { name: "Groups" }));
    expect(store.getState().conversations.activeFilter).toBe("groups");
    expect(within(list()).queryByText("Maya Chen")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Unread" }));
    expect(
      within(list()).queryByText("Weekend Hike"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "All" }));
    expect(within(list()).getAllByRole("listitem")).toHaveLength(5);
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("list", { name: "Conversation list" });

    await user.type(
      screen.getByRole("searchbox", { name: "Search conversations" }),
      "zzzz",
    );

    expect(screen.getByText("No conversations found")).toBeInTheDocument();
  });

  it("highlights the selected conversation", async () => {
    const user = userEvent.setup();
    const store = renderApp();

    const list = await screen.findByRole("list", { name: "Conversation list" });
    await user.click(within(list).getByText("Liam Patel"));

    expect(store.getState().conversations.selectedConversationId).toBe(
      "conv-liam",
    );
    expect(
      within(list)
        .getByText("Liam Patel")
        .closest("button"),
    ).toHaveAttribute("aria-current", "true");
  });
});
