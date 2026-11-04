import { Users } from "lucide-react";
import type { ConversationListItem } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { getUserById } from "@/services/userDirectory";

const formatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function formatTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessage = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startOfDay.getTime() - startOfMessage.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayDiff === 0) {
    return formatter.format(date);
  }
  if (dayDiff === 1) {
    return "Yesterday";
  }
  if (dayDiff < 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
      date,
    );
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export function ConversationItem({
  item,
  isSelected,
  onSelect,
}: {
  item: ConversationListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { conversation, preview, unreadCount, isOnline } = item;
  const isGroup = conversation.type === "group";
  const senderName =
    preview && preview.senderId === CURRENT_USER_ID
      ? "You"
      : preview
        ? (getUserById(preview.senderId)?.displayName ?? "")
        : "";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected ? "true" : undefined}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
          isSelected ? "bg-surface-muted" : "hover:bg-surface-muted"
        }`}
      >
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={conversation.avatarUrl}
            alt=""
            className="h-12 w-12 rounded-full bg-surface-muted"
          />
          {isGroup ? (
            <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sidebar text-text-muted ring-2 ring-sidebar">
              <Users size={12} aria-hidden="true" />
            </span>
          ) : isOnline ? (
            <span
              aria-label="Online"
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-sidebar"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {conversation.title}
            </p>
            {preview ? (
              <time
                dateTime={preview.createdAt}
                className="shrink-0 text-xs text-text-muted"
              >
                {formatTimestamp(preview.createdAt)}
              </time>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm text-text-muted">
              {preview ? (
                <>
                  {isGroup && senderName ? `${senderName}: ` : null}
                  {preview.text}
                </>
              ) : (
                "No messages yet"
              )}
            </p>
            {unreadCount > 0 ? (
              <span
                aria-label={`${unreadCount} unread`}
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white"
              >
                {unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}
