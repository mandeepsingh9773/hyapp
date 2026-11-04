import { describe, expect, it } from "vitest";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { renderApp, screen } from "./renderApp";
import { loadFailed } from "@/features/conversations/conversationsSlice";

describe("loading and error states", () => {
  it("shows a sidebar skeleton while conversations hydrate", async () => {
    renderApp();
    expect(
      screen.getByRole("status", { name: "Loading conversations" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("list", { name: "Conversation list" }),
    ).toBeInTheDocument();
  });

  it("shows an error state with a retry action", () => {
    const store = renderApp();
    act(() => {
      store.dispatch(loadFailed());
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load conversations",
    );
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });

  it("returns to the loading state when retry is triggered", async () => {
    const user = userEvent.setup();
    const store = renderApp();

    act(() => {
      store.dispatch(loadFailed());
    });

    await user.click(screen.getByRole("button", { name: /Retry/ }));
    expect(store.getState().conversations.status).toBe("loading");
    expect(
      screen.getByRole("status", { name: "Loading conversations" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("list", { name: "Conversation list" }),
    ).toBeInTheDocument();
  });
});
