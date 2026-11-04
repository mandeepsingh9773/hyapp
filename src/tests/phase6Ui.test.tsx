import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/app/store";
import { App } from "@/app/App";
import { selectConversation } from "@/features/conversations/conversationsSlice";
import { setTyping } from "@/features/messages/typingSlice";

function renderApp(selectGroupId?: string) {
  const store = makeStore();
  if (selectGroupId) store.dispatch(selectConversation(selectGroupId));
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  return store;
}

describe("typing indicator", () => {
  it("shows and hides the typing label for the active conversation", () => {
    const store = renderApp("conv-maya");

    act(() => {
      store.dispatch(setTyping({ conversationId: "conv-maya", userId: "user-maya" }));
    });
    expect(screen.getByText("Maya Chen is typing...")).toBeInTheDocument();
  });
});

describe("group details", () => {
  it("opens the panel, adds and removes members", async () => {
    const user = userEvent.setup();
    const store = renderApp("conv-design-team");

    await user.click(
      screen.getByRole("button", { name: "Show group details" }),
    );

    const panel = screen.getByRole("complementary", { name: "Group details" });
    expect(within(panel).getByText("Maya Chen")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Add Noah Kim" }));
    expect(
      store.getState().groups.addedMembers["conv-design-team"],
    ).toContain("user-noah");

    await user.click(
      within(panel).getByRole("button", { name: "Remove Sofia Rossi" }),
    );
    expect(
      store.getState().groups.removedMembers["conv-design-team"],
    ).toContain("user-sofia");
  });

  it("only shows the info button for groups", () => {
    renderApp("conv-maya");
    expect(
      screen.queryByRole("button", { name: "Show group details" }),
    ).not.toBeInTheDocument();
  });
});
