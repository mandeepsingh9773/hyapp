"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Clock, AlertCircle, Ban } from "lucide-react";
import type { Message, MessageStatus } from "@/types/chat";
import { getUserById } from "@/services/userDirectory";
import { formatMessageTime } from "../utils/formatDate";
import { displayTextOf } from "../utils/displayText";
import type { SearchSegment } from "../selectors";
import {
  MessageActions,
  type MessageActionHandlers,
} from "./MessageActions";
import { MessageReactions } from "./MessageReactions";

const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE = 10;
const MOBILE_MAX_WIDTH = 768;
const SHOW_ACTIONS_EVENT = "message-bubble:show-actions";

function StatusIcon({ status }: { status: MessageStatus }) {
  const label =
    status === "failed"
      ? "Not sent"
      : status === "read"
        ? "Read"
        : status === "delivered"
          ? "Delivered"
          : status === "sent"
            ? "Sent"
            : "Sending";

  const Icon =
    status === "failed"
      ? AlertCircle
      : status === "sending"
        ? Clock
        : status === "sent"
          ? Check
          : CheckCheck;

  return (
    <span aria-label={label} title={label} className={status === "read" ? "text-sky-500" : ""}>
      <Icon size={14} aria-hidden="true" />
    </span>
  );
}

function HighlightedText({ segments }: { segments: SearchSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <mark
            key={index}
            className="rounded-sm bg-yellow-300 text-inherit dark:bg-yellow-500/70"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function ReplyQuote({ replyTo }: { replyTo: Message }) {
  const name = getUserById(replyTo.senderId)?.displayName ?? "Unknown";
  return (
    <blockquote className="mb-1 rounded border-l-2 border-accent/70 bg-black/5 px-2 py-1 text-xs dark:bg-white/5">
      <span className="block font-medium text-accent">{name}</span>
      <span className="line-clamp-2 text-text-muted">{displayTextOf(replyTo)}</span>
    </blockquote>
  );
}

function ReactionRow({
  message,
  currentUserId,
  onReact,
}: {
  message: Message;
  currentUserId: string;
  onReact: (emoji: string) => void;
}) {
  if (message.reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {message.reactions.map((reaction) => {
        const isMine = reaction.userIds.includes(currentUserId);
        return (
          <button
            key={reaction.emoji}
            type="button"
            aria-label={`${reaction.emoji} ${reaction.userIds.length}`}
            aria-pressed={isMine}
            onClick={() => onReact(reaction.emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] ${
              isMine
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border-subtle bg-sidebar text-text-muted"
            }`}
          >
            <span aria-hidden="true">{reaction.emoji}</span>
            <span>{reaction.userIds.length}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MessageBubble({
  message,
  replyTo,
  isOwn,
  isUnread,
  searchSegments,
  isActiveMatch,
  currentUserId,
  handlers,
}: {
  message: Message;
  replyTo: Message | null;
  isOwn: boolean;
  isUnread: boolean;
  searchSegments: SearchSegment[];
  isActiveMatch: boolean;
  currentUserId: string;
  handlers: MessageActionHandlers;
}) {
  const sender = getUserById(message.senderId);
  const isDeleted = Boolean(message.deletedAt);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    pressOrigin.current = null;
  }, []);

  useEffect(() => {
    function onShowActions(event: Event) {
      const detail = (event as CustomEvent<{ messageId: string }>).detail;
      if (detail?.messageId !== message.id) setActionsVisible(false);
    }

    function onDocumentPointerDown(event: PointerEvent) {
      if (bubbleRef.current?.contains(event.target as Node)) return;
      setActionsVisible(false);
    }

    window.addEventListener(SHOW_ACTIONS_EVENT, onShowActions);
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () => {
      window.removeEventListener(SHOW_ACTIONS_EVENT, onShowActions);
      document.removeEventListener("pointerdown", onDocumentPointerDown);
    };
  }, [message.id]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      if (isDeleted) return;
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, textarea, [role='button']")) return;
      if (window.innerWidth >= MOBILE_MAX_WIDTH) return;

      pressOrigin.current = { x: event.clientX, y: event.clientY };
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        window.dispatchEvent(
          new CustomEvent<{ messageId: string }>(SHOW_ACTIONS_EVENT, {
            detail: { messageId: message.id },
          }),
        );
        setActionsVisible(true);
        if (navigator.vibrate) navigator.vibrate(10);
      }, LONG_PRESS_MS);
    },
    [isDeleted, message.id],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const origin = pressOrigin.current;
      if (!origin) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) cancelLongPress();
    },
    [cancelLongPress],
  );

  return (
    <li
      className="group flex w-full items-start"
      data-message-id={message.id}
      data-unread={isUnread ? "true" : undefined}
      data-active-match={isActiveMatch ? "true" : undefined}
    >
      <div
        className={`flex min-w-0 flex-1 flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        <div
          ref={bubbleRef}
          className={`relative flex w-full min-w-0 ${isOwn ? "justify-end" : "justify-start"}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onContextMenu={(event) => {
            if (isDeleted) return;
            event.preventDefault();
          }}
        >
          <div
            className={`relative min-w-0 max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm sm:max-w-[70%] ${
              isDeleted
                ? "border border-dashed border-border-subtle bg-transparent text-text-muted"
                : isOwn
                  ? "rounded-tr-none bg-bubble-outgoing text-foreground"
                  : `rounded-tl-none text-foreground ${
                      isUnread ? "bg-sky-100 dark:bg-sky-950" : "bg-bubble-incoming"
                    }`
            } ${isActiveMatch ? "ring-2 ring-yellow-500" : ""}`}
          >
            {!isOwn ? (
              <p className="text-xs font-semibold text-accent">
                {sender?.displayName ?? "Unknown"}
              </p>
            ) : null}

            {replyTo ? <ReplyQuote replyTo={replyTo} /> : null}

            {isDeleted ? (
              <p className="flex items-center gap-1.5 italic text-text-muted">
                <Ban size={13} aria-hidden="true" />
                {"This message was deleted"}
              </p>
            ) : (
              <p className="whitespace-pre-wrap break-words">
                <HighlightedText segments={searchSegments} />
              </p>
            )}

            <div className="mt-0.5 flex items-center justify-end gap-1">
              {message.updatedAt && !isDeleted ? (
                <span className="text-[11px] italic text-text-muted">edited</span>
              ) : null}
              <time dateTime={message.createdAt} className="text-[11px] text-text-muted">
                {formatMessageTime(message.createdAt)}
              </time>
              {isOwn ? <StatusIcon status={message.status} /> : null}
            </div>

            {isOwn && message.status === "failed" ? (
              <div
                role="alert"
                className="mt-1 flex items-center justify-end gap-1 text-[11px] text-red-600 dark:text-red-400"
              >
                <span>Not sent</span>
                <button
                  type="button"
                  onClick={() => handlers.onRetry(message)}
                  className="font-medium underline underline-offset-2 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent dark:hover:text-red-300"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div
              className={`absolute top-1/2 flex shrink-0 -translate-y-1/2 items-center gap-0.5 transition-opacity focus-within:opacity-100 group-hover:opacity-100 ${
                actionsVisible ? "opacity-100" : "opacity-0 max-md:hidden"
              } ${
                isOwn
                  ? "right-full mr-1.5 flex-row-reverse"
                  : "left-full ml-1.5 flex-row"
              }`}
            >
              {!isDeleted ? (
                <MessageReactions
                  message={message}
                  onReact={handlers.onReact}
                />
              ) : null}
              <MessageActions message={message} isOwn={isOwn} handlers={handlers} />
            </div>
          </div>
        </div>

        {!isDeleted ? (
          <ReactionRow
            message={message}
            currentUserId={currentUserId}
            onReact={(emoji) => handlers.onReact(message, emoji)}
          />
        ) : null}
      </div>
    </li>
  );
}
