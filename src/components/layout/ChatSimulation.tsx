"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/app/hooks";
import { receiveMessage } from "@/features/messages/messagesSlice";
import { setTyping, clearTyping } from "@/features/messages/typingSlice";
import { chooseIncomingSimulation } from "@/services/mockChatService";
import {
  SimulationTimers,
  TYPING_DURATION_MS,
  nextIncomingDelay,
} from "@/services/chatSimulation";

export function ChatSimulation() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const simulateActivity = useAppSelector(
    (state) => state.settings.simulateActivity,
  );
  const isReady = useAppSelector(
    (state) => state.conversations.status === "ready",
  );

  useEffect(() => {
    if (!simulateActivity || !isReady) return;

    const timers = new SimulationTimers();

    const scheduleNext = () => {
      timers.schedule(() => {
        const plan = chooseIncomingSimulation(
          store.getState().conversations.items,
        );
        if (!plan) {
          scheduleNext();
          return;
        }

        dispatch(
          setTyping({
            conversationId: plan.conversationId,
            userId: plan.senderId,
          }),
        );

        timers.schedule(() => {
          dispatch(
            clearTyping({
              conversationId: plan.conversationId,
              userId: plan.senderId,
            }),
          );
          dispatch(
            receiveMessage({
              conversationId: plan.conversationId,
              senderId: plan.senderId,
              text: plan.text,
            }),
          );
          scheduleNext();
        }, TYPING_DURATION_MS);
      }, nextIncomingDelay());
    };

    scheduleNext();

    return () => timers.clear();
  }, [dispatch, simulateActivity, isReady, store]);

  return null;
}
