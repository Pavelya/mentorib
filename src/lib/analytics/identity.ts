import type { ResolvedAuthAccount } from "@/lib/auth/account-service";

// Identity properties allowed on the analytics boundary. Email, full name,
// avatar URL, and other PII must not flow into analytics destinations — see
// section 9 of docs/architecture/analytics-and-product-telemetry-architecture-v1.md.
export type AnalyticsIdentity = {
  distinctId: string;
  properties: {
    primary_role_context: string | null;
    role_modes: string[];
    timezone: string;
  };
};

type IdentityAccount = Pick<
  ResolvedAuthAccount,
  "id" | "primary_role_context" | "roles" | "timezone"
>;

export function buildAnalyticsIdentity(account: IdentityAccount): AnalyticsIdentity {
  return {
    distinctId: account.id,
    properties: {
      primary_role_context: account.primary_role_context,
      role_modes: account.roles.map((role) => role.role),
      timezone: account.timezone,
    },
  };
}
