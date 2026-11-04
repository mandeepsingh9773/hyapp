import { Moon, Radio, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  toggleSimulateActivity,
  toggleTheme,
} from "@/features/settings/settingsSlice";
import { currentUser } from "@/services/userDirectory";

export function SidebarHeader() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.settings.theme);
  const simulateActivity = useAppSelector(
    (state) => state.settings.simulateActivity,
  );
  const isDark = theme === "dark";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-sidebar px-4">
      <div className="flex min-w-0 items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUser.avatarUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full bg-surface-muted"
        />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            Chats
          </h1>
          <p className="truncate text-xs text-text-muted">
            {currentUser.displayName}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => dispatch(toggleSimulateActivity())}
          aria-label={
            simulateActivity
              ? "Turn off simulated activity"
              : "Turn on simulated activity"
          }
          aria-pressed={simulateActivity}
          title="Simulate incoming activity"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            simulateActivity ? "text-accent" : "text-text-muted hover:text-foreground"
          }`}
        >
          <Radio size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          aria-pressed={isDark}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
