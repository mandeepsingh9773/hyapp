"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  closeSearch,
  setSearchQuery,
  stepMatch,
} from "../messageInteractionSlice";
import { selectSearchState } from "../selectors";

export function MessageSearch() {
  const dispatch = useAppDispatch();
  const { query, matchCount, activeMatchIndex } = useAppSelector(selectSearchState);

  const position = matchCount === 0 ? 0 : activeMatchIndex + 1;

  return (
    <div className="flex items-center gap-1 border-b border-border-subtle bg-sidebar px-2 py-1.5">
      <label htmlFor="message-search" className="sr-only">
        Search messages
      </label>
      <input
        id="message-search"
        type="search"
        autoFocus
        value={query}
        onChange={(event) => dispatch(setSearchQuery(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            dispatch(stepMatch({ matchCount, delta: event.shiftKey ? -1 : 1 }));
          }
          if (event.key === "Escape") dispatch(closeSearch());
        }}
        placeholder="Search in conversation"
        className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
      />
      <span
        role="status"
        aria-live="polite"
        className="min-w-14 text-center text-xs text-text-muted"
      >
        {query.trim() !== "" && matchCount === 0
          ? "No results"
          : matchCount > 0
            ? `${position} of ${matchCount}`
            : ""}
      </span>
      <button
        type="button"
        aria-label="Previous match"
        disabled={matchCount === 0}
        onClick={() => dispatch(stepMatch({ matchCount, delta: -1 }))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-40"
      >
        <ChevronUp size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Next match"
        disabled={matchCount === 0}
        onClick={() => dispatch(stepMatch({ matchCount, delta: 1 }))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-40"
      >
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Close search"
        onClick={() => dispatch(closeSearch())}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
