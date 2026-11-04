"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/app/hooks";
import { CURRENT_USER_ID, type Message } from "@/types/chat";
import { deleteMessage, retryMessage, toggleReaction } from "../messagesSlice";
import { startEdit, startReply } from "../messageInteractionSlice";
import {
  selectMessageListItems,
  selectSearchState,
  selectSelectedConversationId,
} from "../selectors";
import { copyTextToClipboard } from "@/services/clipboardService";
import {
  isNearBottom,
  scrollToBottom,
} from "../utils/scroll";
import { DateSeparator } from "./DateSeparator";
import { MessageBubble } from "./MessageBubble";
import type { MessageActionHandlers } from "./MessageActions";

export type CopyFeedback = { text: string; tone: "success" | "error" };

export function MessageList({
  onCopyFeedback,
}: {
  onCopyFeedback: (feedback: CopyFeedback) => void;
}) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const conversationId = useAppSelector(selectSelectedConversationId);
  const items = useAppSelector(selectMessageListItems);
  const { activeMessageId } = useAppSelector(selectSearchState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(conversationId);
  const previousCountRef = useRef(0);
  const isPinnedRef = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const messageCount = items.filter((item) => item.kind === "message").length;

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const pinned = isNearBottom({
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
    });
    isPinnedRef.current = pinned;
    if (pinned) setHasNewMessages(false);
  }, []);

  const jumpToLatest = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    scrollToBottom(node, "smooth");
    isPinnedRef.current = true;
    setHasNewMessages(false);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const previousConversationId = conversationIdRef.current;
    const previousCount = previousCountRef.current;
    const conversationChanged =
      previousConversationId !== null &&
      previousConversationId !== conversationId;

    conversationIdRef.current = conversationId;
    previousCountRef.current = messageCount;

    if (conversationChanged || previousConversationId === null) {
      scrollToBottom(node);
      isPinnedRef.current = true;
      setHasNewMessages(false);
      return;
    }

    if (messageCount <= previousCount) return;

    const conversationMessages = conversationId
      ? store.getState().messages.byConversation[conversationId]
      : undefined;
    const latest = conversationMessages?.[conversationMessages.length - 1];
    const isOwnMessage = latest?.senderId === CURRENT_USER_ID;

    if (isOwnMessage || isPinnedRef.current) {
      scrollToBottom(node, isOwnMessage ? "smooth" : "auto");
      isPinnedRef.current = true;
      setHasNewMessages(false);
    } else {
      setHasNewMessages(true);
    }
  }, [conversationId, messageCount, store]);

  useEffect(() => {
    if (!activeMessageId || !scrollRef.current) return;
    const target = scrollRef.current.querySelector<HTMLElement>(
      `[data-message-id="${activeMessageId}"]`,
    );
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ block: "center" });
    }
  }, [activeMessageId]);

  const handleReply = useCallback(
    (message: Message) => dispatch(startReply(message.id)),
    [dispatch],
  );

  const handleEdit = useCallback(
    (message: Message) => dispatch(startEdit(message.id)),
    [dispatch],
  );

  const handleDelete = useCallback(
    (message: Message) => dispatch(deleteMessage({ messageId: message.id })),
    [dispatch],
  );

  const handleCopy = useCallback(
    async (message: Message) => {
      const result = await copyTextToClipboard(message.text);
      onCopyFeedback(
        result === "copied"
          ? { text: "Message copied", tone: "success" }
          : { text: "Could not copy message", tone: "error" },
      );
    },
    [onCopyFeedback],
  );

  const handleReact = useCallback(
    (message: Message, emoji: string) =>
      dispatch(
        toggleReaction({
          messageId: message.id,
          emoji,
          userId: CURRENT_USER_ID,
        }),
      ),
    [dispatch],
  );

  const handleRetry = useCallback(
    (message: Message) => dispatch(retryMessage({ messageId: message.id })),
    [dispatch],
  );

  const handlers: MessageActionHandlers = {
    onReply: handleReply,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCopy: (message) => void handleCopy(message),
    onReact: handleReact,
    onRetry: handleRetry,
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No messages yet</p>
        <p className="max-w-xs text-sm text-text-muted">
          Send the first message to start this conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Messages"
        className="h-full overflow-y-auto px-3 py-3 md:px-6"
      >
        <ul className="flex flex-col gap-1.5">
          {items.map((item) =>
            item.kind === "date" ? (
              <DateSeparator key={`date-${item.dateKey}`} dateKey={item.dateKey} />
            ) : (
              <MessageBubble
                key={item.message.id}
                message={item.message}
                replyTo={item.replyTo}
                isOwn={item.isOwn}
                isUnread={item.countsForUnread}
                searchSegments={item.searchSegments}
                isActiveMatch={item.message.id === activeMessageId}
                currentUserId={CURRENT_USER_ID}
                handlers={handlers}
              />
            ),
          )}
        </ul>
      </div>
      {hasNewMessages ? (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowDown size={14} aria-hidden="true" />
          New messages
        </button>
      ) : null}
    </div>
  );
}
