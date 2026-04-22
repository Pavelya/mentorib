"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_TIMEZONE, detectClientTimezone } from "@/lib/datetime/timezone";

const TIMEZONE_RESYNC_INTERVAL_MS = 15 * 60 * 1000;

export function useDetectedTimezone(fallbackTimezone = DEFAULT_TIMEZONE) {
  return useSyncExternalStore(
    subscribeToTimezoneChanges,
    detectClientTimezone,
    () => fallbackTimezone,
  );
}

function subscribeToTimezoneChanges(onStoreChange: () => void) {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      onStoreChange();
    }
  };

  window.addEventListener("focus", onStoreChange);
  window.addEventListener("online", onStoreChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  const intervalId = window.setInterval(
    onStoreChange,
    TIMEZONE_RESYNC_INTERVAL_MS,
  );

  return () => {
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener("online", onStoreChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.clearInterval(intervalId);
  };
}

