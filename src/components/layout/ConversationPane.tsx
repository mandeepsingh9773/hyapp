"use client";

import { SidebarHeader } from "@/features/conversations/components/SidebarHeader";
import { ConversationSearch } from "@/features/conversations/components/ConversationSearch";
import { FilterTabs } from "@/features/conversations/components/FilterTabs";
import { ConversationList } from "@/features/conversations/components/ConversationList";

export function ConversationPane() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <SidebarHeader />
      <ConversationSearch />
      <FilterTabs />
      <ConversationList />
    </div>
  );
}
