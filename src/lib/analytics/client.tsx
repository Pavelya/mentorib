"use client";

import { Analytics as VercelWebAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import posthog from "posthog-js";
import { useEffect } from "react";

import { getPostHogHost, getPostHogPublicKey } from "@/lib/analytics/env";

let initialized = false;

function ensurePostHogInitialized() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const key = getPostHogPublicKey();
  if (!key) {
    return;
  }

  posthog.init(key, {
    api_host: getPostHogHost(),
    capture_pageview: true,
    capture_pageleave: true,
    // Mentor IB uses an explicit-event taxonomy. Autocapture is intentionally
    // off so the canonical event contract stays the source of product truth.
    autocapture: false,
    // Session replay is off for the MVP because the product handles minors,
    // private messaging, lessons, payments, and tutor credentials.
    disable_session_recording: true,
    persistence: "localStorage+cookie",
  });

  initialized = true;
}

export function AnalyticsProvider() {
  useEffect(() => {
    ensurePostHogInitialized();
  }, []);

  return (
    <>
      <VercelWebAnalytics />
      <SpeedInsights />
    </>
  );
}
