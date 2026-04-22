"use client";

import { useEffect, useRef } from "react";

import { persistDetectedTimezoneAction } from "@/lib/datetime/actions";
import {
  TIMEZONE_COOKIE_NAME,
  detectClientTimezone,
} from "@/lib/datetime/timezone";

const TIMEZONE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const RESYNC_INTERVAL_MS = 15 * 60 * 1000;

export function TimezoneSync() {
  const lastSyncedTimezone = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncTimezone = () => {
      const timezone = detectClientTimezone();

      if (!timezone || timezone === lastSyncedTimezone.current) {
        return;
      }

      lastSyncedTimezone.current = timezone;
      document.cookie = `${TIMEZONE_COOKIE_NAME}=${encodeURIComponent(
        timezone,
      )}; path=/; max-age=${TIMEZONE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;

      void persistDetectedTimezoneAction(timezone).then((result) => {
        if (!isMounted || result.ok) {
          return;
        }

        lastSyncedTimezone.current = null;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncTimezone();
      }
    };

    syncTimezone();

    window.addEventListener("focus", syncTimezone);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(syncTimezone, RESYNC_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncTimezone);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
