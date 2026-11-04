export function MessageListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading messages"
      className="flex flex-1 flex-col gap-3 overflow-hidden px-3 py-3 md:px-6"
    >
      <span className="sr-only">Loading messages</span>
      {[
        { own: false, width: "w-2/3" },
        { own: true, width: "w-1/2" },
        { own: false, width: "w-3/5" },
        { own: true, width: "w-2/5" },
      ].map((row, index) => (
        <div
          key={index}
          className={`flex ${row.own ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`h-12 animate-pulse rounded-lg bg-surface-muted ${row.width}`}
          />
        </div>
      ))}
    </div>
  );
}
