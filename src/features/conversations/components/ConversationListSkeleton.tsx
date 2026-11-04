export function ConversationListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading conversations"
      className="flex flex-1 flex-col gap-1 overflow-hidden p-2"
    >
      <span className="sr-only">Loading conversations</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg px-2 py-2.5"
        >
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-muted" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
