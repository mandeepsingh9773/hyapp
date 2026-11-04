"use client";

import { ArrowLeft, Info, Search, Users } from "lucide-react";
import type { Conversation } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { getUserById } from "@/services/userDirectory";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { closeSearch, openSearch } from "../messageInteractionSlice";
import { selectGroupMemberCount } from "@/features/groups/selectors";

function formatLastSeen(iso: string | undefined): string {
  if (!iso) return "Offline";
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return "last seen just now";
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `last seen ${hours}h ago`;
  return "offline";
}

function statusText(conversation: Conversation, memberCount: number): string {
  if (conversation.type === "group") {
    return `${memberCount} members`;
  }

  const other = getUserById(
    conversation.participantIds.find((id) => id !== CURRENT_USER_ID) ?? "",
  );
  if (!other) return "";
  return other.isOnline ? "online" : formatLastSeen(other.lastSeenAt);
}

export function ChatHeader({
  conversation,
  onBack,
  onToggleDetails,
  isDetailsOpen,
}: {
  conversation: Conversation;
  onBack: () => void;
  onToggleDetails: () => void;
  isDetailsOpen: boolean;
}) {
  const dispatch = useAppDispatch();
  const isSearchOpen = useAppSelector(
    (state) => state.messageInteraction.isSearchOpen,
  );
  const memberCount = useAppSelector((state) =>
    selectGroupMemberCount(state, conversation.id),
  );
  const isGroup = conversation.type === "group";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-sidebar px-3 md:px-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to conversations"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={conversation.avatarUrl}
          alt=""
          className="h-10 w-10 rounded-full bg-surface-muted"
        />
        {isGroup ? (
          <span className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-sidebar text-text-muted ring-1 ring-sidebar">
            <Users size={10} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold text-foreground">
          {conversation.title}
        </h2>
        <p className="truncate text-xs text-text-muted">
          {statusText(conversation, memberCount)}
        </p>
      </div>

      <button
        type="button"
        aria-label={isSearchOpen ? "Close message search" : "Search messages"}
        aria-pressed={isSearchOpen}
        onClick={() =>
          dispatch(isSearchOpen ? closeSearch() : openSearch())
        }
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Search size={18} aria-hidden="true" />
      </button>

      {isGroup ? (
        <button
          type="button"
          aria-label={
            isDetailsOpen ? "Hide group details" : "Show group details"
          }
          aria-pressed={isDetailsOpen}
          onClick={onToggleDetails}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Info size={18} aria-hidden="true" />
        </button>
      ) : null}
    </header>
  );
}
