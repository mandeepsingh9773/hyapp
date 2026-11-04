"use client";

import { useAppSelector } from "@/app/hooks";
import { selectTypingLabel } from "../typingSelectors";

export function TypingIndicator({ conversationId }: { conversationId: string }) {
  const label = useAppSelector((state) => selectTypingLabel(state, conversationId));

  return (
    <p
      aria-live="polite"
      className="h-4 px-1 text-xs italic text-text-muted"
    >
      {label ?? ""}
    </p>
  );
}
