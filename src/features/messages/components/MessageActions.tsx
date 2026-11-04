"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Copy, MoreVertical, Pencil, Reply, Trash2 } from "lucide-react";
import type { Message } from "@/types/chat";
import {
  computeMenuGeometry,
  MENU_WIDTH,
  type MenuPlacement,
} from "../utils/menuGeometry";

export type MessageActionHandlers = {
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onCopy: (message: Message) => void;
  onReact: (message: Message, emoji: string) => void;
  onRetry: (message: Message) => void;
};

export const OPEN_MENU_EVENT = "message-actions:open";

type MenuOpenEventDetail = {
  source: symbol;
};

export function MessageActions({
  message,
  isOwn,
  handlers,
}: {
  message: Message;
  isOwn: boolean;
  handlers: MessageActionHandlers;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement>("bottom");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const instanceId = useRef(Symbol("message-actions"));

  const close = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const geometry = computeMenuGeometry(
        { top: rect.top, bottom: rect.bottom, left: rect.left },
        menuHeight,
        { width: window.innerWidth, height: window.innerHeight },
      );

      setPlacement(geometry.placement);
      setPosition((current) =>
        current &&
        current.top === geometry.top &&
        current.left === geometry.left
          ? current
          : { top: geometry.top, left: geometry.left },
      );
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    function onExternalOpen(event: Event) {
      const detail = (event as CustomEvent<MenuOpenEventDetail>).detail;
      if (detail?.source !== instanceId.current) close();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_MENU_EVENT, onExternalOpen);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_MENU_EVENT, onExternalOpen);
    };
  }, [isOpen, close]);

  function toggle() {
    if (isOpen) {
      close();
      return;
    }
    window.dispatchEvent(
      new CustomEvent<MenuOpenEventDetail>(OPEN_MENU_EVENT, {
        detail: { source: instanceId.current },
      }),
    );
    setIsOpen(true);
  }

  function run(action: () => void) {
    action();
    close();
  }

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Message actions"
          data-placement={placement}
          style={{
            position: "fixed",
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            width: MENU_WIDTH,
            visibility: position ? "visible" : "hidden",
          }}
          className="z-50 rounded-lg border border-border-subtle bg-sidebar p-1 shadow-xl"
        >
          <MenuItem
            icon={<Reply size={15} />}
            label="Reply"
            onClick={() => run(() => handlers.onReply(message))}
          />
          <MenuItem
            icon={<Copy size={15} />}
            label="Copy"
            onClick={() => run(() => handlers.onCopy(message))}
          />
          {isOwn ? (
            <MenuItem
              icon={<Pencil size={15} />}
              label="Edit"
              onClick={() => run(() => handlers.onEdit(message))}
            />
          ) : null}
          <MenuItem
            icon={<Trash2 size={15} />}
            label="Delete"
            destructive
            onClick={() => run(() => handlers.onDelete(message))}
          />
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      {menu}
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
        destructive ? "text-red-600 dark:text-red-400" : "text-foreground"
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
