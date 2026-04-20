import { createHmac, timingSafeEqual } from "node:crypto";

import {
  getStripeWebhookSecret,
  getStripeWebhookSignatureToleranceSeconds,
} from "@/lib/jobs/env";

export type StripeWebhookEnvelope = {
  account?: string;
  api_version?: string | null;
  created?: number;
  data?: {
    object?: Record<string, unknown>;
  };
  id: string;
  type: string;
};

export class StripeWebhookSignatureError extends Error {}

export function verifyAndParseStripeWebhook(
  rawBody: string,
  signatureHeader: string,
  now = Date.now(),
): StripeWebhookEnvelope {
  const parsedHeader = parseStripeSignatureHeader(signatureHeader);
  const toleranceWindowMs = getStripeWebhookSignatureToleranceSeconds() * 1000;
  const signedPayload = `${parsedHeader.timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", getStripeWebhookSecret())
    .update(signedPayload, "utf8")
    .digest("hex");

  if (Math.abs(now - parsedHeader.timestamp * 1000) > toleranceWindowMs) {
    throw new StripeWebhookSignatureError("Stripe webhook signature timestamp is outside the allowed tolerance.");
  }

  const isValidSignature = parsedHeader.signatures.some((signature) =>
    safeCompareHex(signature, expectedSignature),
  );

  if (!isValidSignature) {
    throw new StripeWebhookSignatureError("Stripe webhook signature verification failed.");
  }

  const parsedPayload = parseWebhookPayload(rawBody);

  if (!parsedPayload.id || !parsedPayload.type) {
    throw new StripeWebhookSignatureError(
      "Stripe webhook payload is missing the required event envelope.",
    );
  }

  return parsedPayload;
}

function parseStripeSignatureHeader(signatureHeader: string) {
  const signatures: string[] = [];
  let timestamp: number | null = null;

  signatureHeader.split(",").forEach((part) => {
    const [rawKey, rawValue] = part.split("=", 2);
    const key = rawKey?.trim();
    const value = rawValue?.trim();

    if (!key || !value) {
      return;
    }

    if (key === "t") {
      const parsedTimestamp = Number.parseInt(value, 10);

      if (Number.isFinite(parsedTimestamp)) {
        timestamp = parsedTimestamp;
      }
    }

    if (key === "v1") {
      signatures.push(value);
    }
  });

  if (!timestamp || signatures.length === 0) {
    throw new StripeWebhookSignatureError(
      "Stripe webhook signature header is missing a timestamp or v1 signature.",
    );
  }

  return {
    signatures,
    timestamp,
  };
}

function parseWebhookPayload(rawBody: string): StripeWebhookEnvelope {
  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(rawBody);
  } catch {
    throw new StripeWebhookSignatureError("Stripe webhook payload is not valid JSON.");
  }

  if (!parsedPayload || typeof parsedPayload !== "object") {
    throw new StripeWebhookSignatureError("Stripe webhook payload must be a JSON object.");
  }

  const eventId = "id" in parsedPayload ? parsedPayload.id : null;
  const eventType = "type" in parsedPayload ? parsedPayload.type : null;

  if (typeof eventId !== "string" || typeof eventType !== "string") {
    throw new StripeWebhookSignatureError(
      "Stripe webhook payload is missing a string event id or type.",
    );
  }

  return parsedPayload as StripeWebhookEnvelope;
}

function safeCompareHex(left: string, right: string) {
  if (!isHexDigest(left) || !isHexDigest(right) || left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function isHexDigest(value: string) {
  return /^[0-9a-f]+$/i.test(value);
}
