"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { SmilePlus } from "lucide-react";
import { QUICK_REACTIONS, type Message } from "@/types/chat";
import {
  computeMenuGeometry,
  type MenuPlacement,
} from "../utils/menuGeometry";
import { OPEN_MENU_EVENT } from "./MessageActions";

const PICKER_WIDTH = 232;

export function MessageReactions({
  message,
  onReact,
}: {
  message: Message;
  onReact: (message: Message, emoji: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement>("bottom");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const instanceId = useRef(Symbol("message-reactions"));

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
      const pickerHeight = pickerRef.current?.offsetHeight ?? 0;
      const geometry = computeMenuGeometry(
        { top: rect.top, bottom: rect.bottom, left: rect.left },
        pickerHeight,
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
        pickerRef.current?.contains(target) ||
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
      const detail = (event as CustomEvent<symbol>).detail;
      if (detail !== instanceId.current) close();
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
      new CustomEvent<symbol>(OPEN_MENU_EVENT, { detail: instanceId.current }),
    );
    setIsOpen(true);
  }

  function pick(emoji: string) {
    onReact(message, emoji);
    close();
  }

  const picker = isOpen
    ? createPortal(
        <div
          ref={pickerRef}
          role="menu"
          aria-label="Pick a reaction"
          data-placement={placement}
          style={{
            position: "fixed",
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            width: PICKER_WIDTH,
            visibility: position ? "visible" : "hidden",
          }}
          className="z-50 flex items-center justify-between gap-0.5 rounded-full border border-border-subtle bg-sidebar px-1.5 py-1 shadow-xl"
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              aria-label={`React with ${emoji}`}
              onClick={() => pick(emoji)}
              className="rounded-full p-1 text-lg leading-none transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              {emoji}
            </button>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="React to message"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <SmilePlus size={16} aria-hidden="true" />
      </button>
      {picker}
    </>
  );
}