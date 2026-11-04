"use client";

import { Plus, X } from "lucide-react";
import type { Conversation } from "@/types/chat";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { addGroupMember, removeGroupMember } from "../groupsSlice";
import { selectAddableUsers, selectGroupMembers } from "../selectors";

function statusText(isOnline: boolean): string {
  return isOnline ? "online" : "offline";
}

export function GroupDetails({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const members = useAppSelector((state) =>
    selectGroupMembers(state, conversation.id),
  );
  const addableUsers = useAppSelector((state) =>
    selectAddableUsers(state, conversation.id),
  );

  return (
    <aside
      aria-label="Group details"
      className="flex w-full flex-col gap-4 border-l border-border-subtle bg-sidebar p-4 md:w-72 md:shrink-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {conversation.title}
          </h3>
          <p className="text-xs text-text-muted">{members.length} members</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close group details"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <section aria-label="Members" className="flex flex-col gap-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Members
        </h4>
        <ul className="flex flex-col">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded-lg px-1 py-1.5"
            >
              <span className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full bg-surface-muted"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar ${
                    member.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {member.displayName}
                </p>
                <p className="text-[11px] text-text-muted">
                  {statusText(member.isOnline)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${member.displayName}`}
                onClick={() =>
                  dispatch(
                    removeGroupMember({
                      conversationId: conversation.id,
                      userId: member.id,
                    }),
                  )
                }
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {addableUsers.length > 0 ? (
        <section aria-label="Add members" className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Add members
          </h4>
          <ul className="flex flex-col">
            {addableUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-2 rounded-lg px-1 py-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full bg-surface-muted"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {statusText(user.isOnline)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Add ${user.displayName}`}
                  onClick={() =>
                    dispatch(
                      addGroupMember({
                        conversationId: conversation.id,
                        userId: user.id,
                      }),
                    )
                  }
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-accent/10 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-xs text-text-muted">Everyone is already a member.</p>
      )}
    </aside>
  );
}
