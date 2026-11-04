"use client";

import { Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setSearchQuery } from "../conversationsSlice";

export function ConversationSearch() {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(
    (state) => state.conversations.searchQuery,
  );

  return (
    <div className="shrink-0 border-b border-border-subtle px-3 py-2">
      <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 focus-within:ring-2 focus-within:ring-accent">
        <Search size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => dispatch(setSearchQuery(event.target.value))}
          placeholder="Search conversations"
          aria-label="Search conversations"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted"
        />
      </div>
    </div>
  );
}
