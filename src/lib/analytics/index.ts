// Server-only and client-only entry points are intentionally separate.
// Import from "@/lib/analytics/server" inside server actions and route
// handlers, and from "@/lib/analytics/client" only inside client components.
export type { ProductEvent, ProductEventName } from "@/lib/analytics/events";
export type { AnalyticsIdentity } from "@/lib/analytics/identity";
export { buildAnalyticsIdentity } from "@/lib/analytics/identity";
