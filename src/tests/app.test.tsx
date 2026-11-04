import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "@/app/store";
import { App } from "@/app/App";
import { selectConversation } from "@/features/conversations/conversationsSlice";

function renderApp(selectFirst = false) {
  const store = makeStore();
  if (selectFirst) {
    store.dispatch(selectConversation(store.getState().conversations.items[0].id));
  }
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  return store;
}

describe("App shell", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("renders the conversation and chat regions", () => {
    renderApp();
    expect(
      screen.getByRole("region", { name: "Conversations" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Chat" })).toBeInTheDocument();
  });

  it("shows the empty chat placeholder when nothing is selected", () => {
    renderApp();
    expect(screen.getByText("Select a conversation")).toBeInTheDocument();
  });

  it("shows the chat header with a back button once a conversation is selected", () => {
    renderApp(true);
    const chat = screen.getByRole("region", { name: "Chat" });
    expect(
      within(chat).getByRole("button", { name: "Back to conversations" }),
    ).toBeInTheDocument();
  });

  it("clears the selection when back navigation is used", async () => {
    const user = userEvent.setup();
    const store = renderApp(true);

    await user.click(
      screen.getByRole("button", { name: "Back to conversations" }),
    );

    expect(store.getState().conversations.selectedConversationId).toBeNull();
  });

  it("toggles the theme class on the document element", async () => {
    const user = userEvent.setup();
    const store = renderApp();
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(store.getState().settings.theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});
