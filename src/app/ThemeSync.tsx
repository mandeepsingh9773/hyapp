"use client";

import { useEffect } from "react";
import { useAppSelector } from "./hooks";

export function ThemeSync() {
  const theme = useAppSelector((state) => state.settings.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
