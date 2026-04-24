"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 4000;
const MAX_REFRESH_ATTEMPTS = 6;

export function QueuedResultsRefresh() {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;

    const intervalId = window.setInterval(() => {
      attempts += 1;
      router.refresh();

      if (attempts >= MAX_REFRESH_ATTEMPTS) {
        window.clearInterval(intervalId);
      }
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [router]);

  return null;
}
