import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { makeStore } from "@/app/store";
import { App } from "@/app/App";
import { selectConversation } from "@/features/conversations/conversationsSlice";

export function renderApp(selectConversationId?: string) {
  const store = makeStore();
  if (selectConversationId) {
    store.dispatch(selectConversation(selectConversationId));
  }
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  return store;
}

export async function openConversation(name: string) {
  const user = userEvent.setup();
  const list = await screen.findByRole("list", { name: "Conversation list" });
  await user.click(within(list).getByText(name));
  return user;
}

export { screen, within, userEvent };
