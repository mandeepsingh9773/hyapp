import { formatDateSeparator } from "../utils/formatDate";

export function DateSeparator({ dateKey }: { dateKey: string }) {
  return (
    <li className="flex justify-center py-2">
      <span className="rounded-md bg-surface px-3 py-1 text-xs font-medium text-text-muted shadow-sm">
        {formatDateSeparator(dateKey)}
      </span>
    </li>
  );
}
