import "server-only";

import { after } from "next/server";
import { PostHog } from "posthog-node";

import {
  getPostHogHost,
  getPostHogPublicKey,
  isAnalyticsEnabled,
} from "@/lib/analytics/env";
import type { ProductEvent } from "@/lib/analytics/events";
import { logEvent } from "@/lib/observability/logger";

let cachedClient: PostHog | null = null;

function getClient(): PostHog | null {
  if (!isAnalyticsEnabled()) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const key = getPostHogPublicKey();
  if (!key) {
    return null;
  }

  cachedClient = new PostHog(key, {
    host: getPostHogHost(),
    // Serverless: send each event eagerly. We still rely on `after()` to keep
    // the request alive long enough for the network call to finish.
    flushAt: 1,
    flushInterval: 0,
  });

  return cachedClient;
}

export type CaptureServerEventInput = ProductEvent & {
  distinctId: string;
};

export function captureServerEvent(input: CaptureServerEventInput): void {
  const client = getClient();
  if (!client) {
    return;
  }

  client.capture({
    distinctId: input.distinctId,
    event: input.name,
    properties: input.properties as Record<string, unknown>,
  });

  try {
    after(async () => {
      try {
        await client.flush();
      } catch (error) {
        logEvent("analytics", "warn", "server_event_flush_failed", {
          event: input.name,
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  } catch {
    // Not running inside an after-able context (e.g. tests). Rely on
    // posthog-node's best-effort eager flush from the capture call above.
  }
}
