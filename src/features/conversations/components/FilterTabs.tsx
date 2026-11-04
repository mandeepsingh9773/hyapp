"use client";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { ConversationFilter } from "@/types/chat";
import { setActiveFilter } from "../conversationsSlice";

const FILTERS: { value: ConversationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "groups", label: "Groups" },
];

export function FilterTabs() {
  const dispatch = useAppDispatch();
  const activeFilter = useAppSelector(
    (state) => state.conversations.activeFilter,
  );

  return (
    <div
      role="tablist"
      aria-label="Filter conversations"
      className="flex shrink-0 gap-2 border-b border-border-subtle px-3 py-2"
    >
      {FILTERS.map(({ value, label }) => {
        const isActive = activeFilter === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => dispatch(setActiveFilter(value))}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActive
                ? "bg-accent text-white"
                : "bg-surface-muted text-text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
