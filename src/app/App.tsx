"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ChatHydration } from "@/components/layout/ChatHydration";
import { ChatSimulation } from "@/components/layout/ChatSimulation";
import { ThemeSync } from "./ThemeSync";
import { ViewportSync } from "./ViewportSync";

export function App() {
  return (
    <>
      <ThemeSync />
      <ViewportSync />
      <ChatHydration />
      <ChatSimulation />
      <AppShell />
    </>
  );
}
