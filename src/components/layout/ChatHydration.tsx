"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  loadFailed,
  loadSucceeded,
  startLoading,
} from "@/features/conversations/conversationsSlice";
import { loadInitialData } from "@/services/chatHydration";

export function ChatHydration() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.conversations.status);

  useEffect(() => {
    if (status !== "idle") return;
    dispatch(startLoading());
  }, [dispatch, status]);

  useEffect(() => {
    if (status !== "loading") return;

    let cancelled = false;
    loadInitialData().then((outcome) => {
      if (cancelled) return;
      if (outcome.status === "success") {
        dispatch(loadSucceeded(outcome.data.conversations));
      } else {
        dispatch(loadFailed());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, status]);

  return null;
}
