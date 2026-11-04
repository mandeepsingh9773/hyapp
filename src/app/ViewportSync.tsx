"use client";

import { useEffect } from "react";

export function ViewportSync() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${viewport.height}px`,
      );
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);

    return () => {
      document.documentElement.style.removeProperty("--app-height");
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  return null;
}
