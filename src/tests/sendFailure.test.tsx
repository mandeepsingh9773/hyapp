import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderApp, screen, within, openConversation } from "./renderApp";

describe("send failure and retry", () => {
  it("marks a failing message as not sent and offers a retry", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");
    await screen.findByRole("list", { name: "Conversation list" });

    await user.type(screen.getByLabelText("Message"), "please #fail now");
    await user.keyboard("{Enter}");

    const messages = screen.getByRole("log", { name: "Messages" });
    const retry = await within(messages).findByRole("button", { name: "Retry" });
    expect(retry).toBeInTheDocument();

    const list = store.getState().messages.byConversation["conv-liam"];
    const failed = list[list.length - 1];
    expect(failed.status).toBe("failed");
  });

  it("retries a failed message and returns it to sent", async () => {
    const store = renderApp();
    const user = await openConversation("Liam Patel");
    await screen.findByRole("list", { name: "Conversation list" });

    await user.type(screen.getByLabelText("Message"), "retry me #fail");
    await user.keyboard("{Enter}");

    const messages = screen.getByRole("log", { name: "Messages" });
    const retry = await within(messages).findByRole("button", { name: "Retry" });
    await user.click(retry);

    const list = store.getState().messages.byConversation["conv-liam"];
    const message = list[list.length - 1];
    expect(message.status).not.toBe("failed");

    await waitFor(() =>
      expect(
        within(messages).queryByRole("button", { name: "Retry" }),
      ).not.toBeInTheDocument(),
    );
  });
});
