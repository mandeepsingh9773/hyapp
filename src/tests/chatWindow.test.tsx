import { describe, expect, it } from "vitest";
import { renderApp, screen, within, openConversation } from "./renderApp";

describe("Chat window", () => {
  it("renders history with a date separator when a conversation opens", async () => {
    renderApp();
    await openConversation("Maya Chen");

    const messages = screen.getByRole("log", { name: "Messages" });
    expect(messages).toBeInTheDocument();
    expect(
      within(messages).getByText(/color tokens/),
    ).toBeInTheDocument();
    expect(within(messages).getByText("Today")).toBeInTheDocument();
  });

  it("shows the chat header with participant status", async () => {
    renderApp();
    await openConversation("Maya Chen");

    expect(screen.getByRole("heading", { name: "Maya Chen" })).toBeInTheDocument();
    expect(screen.getByText("online")).toBeInTheDocument();
  });

  it("shows a member count for group conversations", async () => {
    renderApp();
    await openConversation("Design Team");

    expect(screen.getByText("4 members")).toBeInTheDocument();
  });

  it("sends a message and updates the sidebar preview", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");

    await user.type(
      screen.getByLabelText("Message"),
      "Sounds good to me",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const messages = screen.getByRole("log", { name: "Messages" });
    expect(within(messages).getByText("Sounds good to me")).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "Conversation list" });
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(
      "Sounds good to me",
    );
    expect(store.getState().conversations.selectedConversationId).toBe(
      "conv-liam",
    );
  });

  it("clears the composer after a successful send", async () => {
    renderApp();
    const user = await openConversation("Liam Patel");

    const input = screen.getByLabelText("Message");
    await user.type(input, "One more thing");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("");
  });

  it("rejects whitespace-only messages", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");
    const before = store.getState().messages.byConversation["conv-liam"].length;

    const input = screen.getByLabelText("Message");
    await user.type(input, "   ");
    await user.keyboard("{Enter}");

    expect(
      store.getState().messages.byConversation["conv-liam"],
    ).toHaveLength(before);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Message cannot be empty.",
    );
  });

  it("inserts a newline on Shift+Enter instead of sending", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");
    const before = store.getState().messages.byConversation["conv-liam"].length;

    const input = screen.getByLabelText("Message");
    await user.type(input, "line one{Shift>}{Enter}{/Shift}line two");

    expect(store.getState().messages.byConversation["conv-liam"]).toHaveLength(
      before,
    );
    expect(input).toHaveValue("line one\nline two");
  });
});