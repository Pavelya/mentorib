import type { RouteFamilyKey } from "@/lib/routing/route-families";

export type AccessPosture =
  | "public"
  | "public_non_indexable"
  | "authenticated"
  | "role_gated"
  | "internal";

export const accessPostureByFamily: Record<RouteFamilyKey, AccessPosture> = {
  public: "public",
  auth: "public_non_indexable",
  setup: "authenticated",
  account: "authenticated",
  student: "role_gated",
  tutor: "role_gated",
  internal: "internal",
};
