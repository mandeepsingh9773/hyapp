"use client";

import { SearchX, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectConversation, startLoading } from "../conversationsSlice";
import { selectFilteredConversationListItems } from "../selectors";
import { ConversationItem } from "./ConversationItem";
import { ConversationListSkeleton } from "./ConversationListSkeleton";

export function ConversationList() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectFilteredConversationListItems);
  const status = useAppSelector((state) => state.conversations.status);
  const selectedConversationId = useAppSelector(
    (state) => state.conversations.selectedConversationId,
  );
  const searchQuery = useAppSelector((state) => state.conversations.searchQuery);
  const activeFilter = useAppSelector((state) => state.conversations.activeFilter);

  if (status === "loading") {
    return <ConversationListSkeleton />;
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <p className="text-sm font-medium text-foreground">
          Could not load conversations
        </p>
        <p className="max-w-xs text-sm text-text-muted">
          Something went wrong while loading your chats.
        </p>
        <button
          type="button"
          onClick={() => dispatch(startLoading())}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    const hasQuery = searchQuery.trim().length > 0;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <SearchX size={36} className="text-text-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          No conversations found
        </p>
        <p className="max-w-xs text-sm text-text-muted">
          {hasQuery
            ? `Nothing matches "${searchQuery.trim()}".`
            : activeFilter === "unread"
              ? "You are all caught up."
              : "No groups to show."}
        </p>
      </div>
    );
  }

  return (
    <ul
      role="list"
      aria-label="Conversation list"
      className="flex-1 overflow-y-auto"
    >
      {items.map((item) => (
        <ConversationItem
          key={item.conversation.id}
          item={item}
          isSelected={item.conversation.id === selectedConversationId}
          onSelect={() => dispatch(selectConversation(item.conversation.id))}
        />
      ))}
    </ul>
  );
}
