"use client";

import { useCallback, useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { MessageList } from "@/features/messages/components/MessageList";
import { MessageComposer } from "@/features/messages/components/MessageComposer";
import { MessageSearch } from "@/features/messages/components/MessageSearch";
import { TypingIndicator } from "@/features/messages/components/TypingIndicator";
import { GroupDetails } from "@/features/groups/components/GroupDetails";
import { closeSearch, stopEdit, stopReply } from "@/features/messages/messageInteractionSlice";
import type { CopyFeedback } from "@/features/messages/components/MessageList";

const FEEDBACK_TIMEOUT_MS = 2000;

export function ChatPane({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const selectedConversation = useAppSelector((state) =>
    state.conversations.items.find(
      (conversation) =>
        conversation.id === state.conversations.selectedConversationId,
    ),
  );
  const isSearchOpen = useAppSelector(
    (state) => state.messageInteraction.isSearchOpen,
  );
  const [detailsOpenFor, setDetailsOpenFor] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);

  useEffect(() => {
    if (!copyFeedback) return;
    const timer = setTimeout(() => setCopyFeedback(null), FEEDBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [copyFeedback]);

  const handleCopyFeedback = useCallback(
    (feedback: CopyFeedback) => setCopyFeedback(feedback),
    [],
  );

  const conversationKey = selectedConversation?.id ?? null;

  useEffect(() => {
    dispatch(closeSearch());
    dispatch(stopReply());
    dispatch(stopEdit());
  }, [conversationKey, dispatch]);

  const isDetailsOpen = detailsOpenFor === selectedConversation?.id;
  const toggleDetails = () =>
    setDetailsOpenFor((current) =>
      current === selectedConversation?.id
        ? null
        : (selectedConversation?.id ?? null),
    );

  if (!selectedConversation) {
    return (
      <div className="hidden h-full flex-col items-center justify-center gap-3 bg-surface-muted p-8 text-center md:flex">
        <MessagesSquare size={56} className="text-text-muted" aria-hidden="true" />
        <p className="text-lg font-medium text-foreground">
          Select a conversation
        </p>
        <p className="max-w-sm text-sm text-text-muted">
          Choose a chat from the list to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-muted">
      <ChatHeader
        conversation={selectedConversation}
        onBack={onBack}
        onToggleDetails={toggleDetails}
        isDetailsOpen={isDetailsOpen}
      />
      {isSearchOpen ? <MessageSearch /> : null}
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <MessageList onCopyFeedback={handleCopyFeedback} />
          {copyFeedback ? (
            <div
              role="status"
              aria-live="polite"
              className={`pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full px-3 py-1 text-xs text-white shadow-md ${
                copyFeedback.tone === "success" ? "bg-accent" : "bg-red-600"
              }`}
            >
              {copyFeedback.text}
            </div>
          ) : null}
          <TypingIndicator conversationId={selectedConversation.id} />
        </div>
        {isDetailsOpen && selectedConversation.type === "group" ? (
          <GroupDetails
            conversation={selectedConversation}
            onClose={() => setDetailsOpenFor(null)}
          />
        ) : null}
      </div>
      <MessageComposer conversationId={selectedConversation.id} />
    </div>
  );
}
