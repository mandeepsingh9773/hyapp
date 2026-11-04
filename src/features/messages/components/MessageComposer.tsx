"use client";

import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Pencil, Reply, SendHorizontal, X } from "lucide-react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/app/hooks";
import { getUserById } from "@/services/userDirectory";
import {
  editMessage,
  MAX_MESSAGE_LENGTH,
  sendMessage,
} from "@/features/messages/messagesSlice";
import {
  stopEdit,
  stopReply,
} from "@/features/messages/messageInteractionSlice";
import { displayTextOf } from "../utils/displayText";

type ComposerValues = {
  text: string;
};

function validateText(value: string): true | string {
  const trimmed = value.trim();
  if (!trimmed) return "Message cannot be empty.";
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }
  return true;
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const dispatch = useAppDispatch();
  const storeRef = useRef(useAppStore());
  const replyToMessageId = useAppSelector(
    (state) => state.messageInteraction.replyToMessageId,
  );
  const editingMessageId = useAppSelector(
    (state) => state.messageInteraction.editingMessageId,
  );
  const replyTarget = useAppSelector((state) =>
    replyToMessageId ? state.messages.byId[replyToMessageId] : undefined,
  );
  const editTarget = useAppSelector((state) =>
    editingMessageId ? state.messages.byId[editingMessageId] : undefined,
  );

  const isEditing = Boolean(editTarget);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setFocus,
    formState: { errors },
  } = useForm<ComposerValues>({
    defaultValues: { text: "" },
    mode: "onSubmit",
  });

  const text = useWatch({ control, name: "text" });

  useEffect(() => {
    const store = storeRef.current;
    const target = editingMessageId
      ? store?.getState().messages.byId[editingMessageId]
      : undefined;
    reset({ text: target ? target.text : "" });
    if (editingMessageId || replyToMessageId) setFocus("text");
  }, [editingMessageId, replyToMessageId, reset, setFocus, storeRef]);

  const onSubmit = handleSubmit((values) => {
    const trimmed = values.text.trim();
    if (!trimmed) return;

    if (editingMessageId) {
      dispatch(editMessage({ messageId: editingMessageId, text: trimmed }));
      dispatch(stopEdit());
    } else {
      dispatch(
        sendMessage({
          conversationId,
          text: trimmed,
          replyToMessageId: replyToMessageId ?? undefined,
        }),
      );
      if (replyToMessageId) dispatch(stopReply());
    }

    reset({ text: "" });
  });

  const cancelContext = () => {
    if (isEditing) dispatch(stopEdit());
    else dispatch(stopReply());
    reset({ text: "" });
  };

  useEffect(() => {
    if (!replyTarget && !editTarget) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target?.id === "message-search") return;
      if (target?.closest('[role="menu"]')) return;
      event.preventDefault();
      if (editTarget) dispatch(stopEdit());
      else dispatch(stopReply());
      reset({ text: "" });
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [replyTarget, editTarget, dispatch, reset]);

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-border-subtle bg-sidebar px-3 py-2.5 md:px-4"
    >
      {replyTarget && !isEditing ? (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-4 border-accent bg-surface-muted px-2 py-1.5">
          <Reply size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-accent">
              Replying to {getUserById(replyTarget.senderId)?.displayName ?? "Unknown"}
            </p>
            <p className="line-clamp-2 text-xs text-text-muted">
              {displayTextOf(replyTarget)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={() => dispatch(stopReply())}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-foreground"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {editTarget ? (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-4 border-yellow-500 bg-surface-muted px-2 py-1.5">
          <Pencil size={15} className="mt-0.5 shrink-0 text-yellow-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Editing message
            </p>
            <p className="line-clamp-2 text-xs text-text-muted">
              {editTarget.text}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel edit"
            onClick={cancelContext}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-foreground"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="message-input" className="sr-only">
            Message
          </label>
          <textarea
            id="message-input"
            rows={1}
            placeholder={isEditing ? "Edit message" : "Type a message"}
            aria-invalid={errors.text ? "true" : undefined}
            aria-describedby={errors.text ? "message-error" : undefined}
            className="max-h-32 w-full resize-none rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
            {...register("text", {
              validate: (value) => validateText(value ?? ""),
              onChange: (event) => {
                const target = event.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              },
              onBlur: (event) => {
                const target = event.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              },
            })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSubmit();
              }
            }}
          />
          {errors.text ? (
            <p id="message-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.text.message}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          aria-label={isEditing ? "Save edit" : "Send message"}
          disabled={!text?.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizontal size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
