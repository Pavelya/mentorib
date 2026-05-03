// Analytics is opt-in: when the public PostHog key is unset, the analytics
// boundary becomes a no-op. This keeps local development quiet by default and
// matches the environment-separation rule in
// docs/architecture/analytics-and-product-telemetry-architecture-v1.md.

const DEFAULT_HOST = "https://us.i.posthog.com";

export function getPostHogPublicKey(): string | null {
  const value = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export function getPostHogHost(): string {
  const value = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  return value && value.length > 0 ? value : DEFAULT_HOST;
}

export function isAnalyticsEnabled(): boolean {
  return getPostHogPublicKey() !== null && process.env.NODE_ENV !== "test";
}
