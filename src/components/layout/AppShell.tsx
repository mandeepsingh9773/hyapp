"use client";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectConversation } from "@/features/conversations/conversationsSlice";
import { ConversationPane } from "./ConversationPane";
import { ChatPane } from "./ChatPane";

export function AppShell() {
  const dispatch = useAppDispatch();
  const isMobileChatOpen = useAppSelector(
    (state) => state.conversations.selectedConversationId !== null,
  );

  const handleBack = () => dispatch(selectConversation(null));

  return (
    <div className="flex h-full min-h-0 w-full bg-background text-foreground md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl overflow-hidden bg-sidebar md:rounded-xl md:shadow-lg">
        <section
          aria-label="Conversations"
          className={`${isMobileChatOpen ? "hidden md:flex" : "flex"} h-full min-h-0 w-full flex-col border-border-subtle md:w-[340px] md:shrink-0 md:border-r lg:w-[380px]`}
        >
          <ConversationPane />
        </section>
        <section
          aria-label="Chat"
          className={`${isMobileChatOpen ? "flex" : "hidden md:flex"} h-full min-h-0 min-w-0 flex-1 flex-col`}
        >
          <ChatPane onBack={handleBack} />
        </section>
      </div>
    </div>
  );
}
