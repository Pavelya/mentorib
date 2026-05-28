import { beforeEach, describe, expect, it, vi } from "vitest";

// Table-aware Supabase service-role mock. Each query resolves canned data
// based on the table + selected columns so the user-detail view-model
// boundary can be exercised end-to-end.
let scenario: "tutor" | "missing" = "tutor";

function resolveData(
  table: string,
  columns: string,
): { single: unknown; list: unknown[] } {
  if (table === "app_users") {
    if (columns.includes("account_status")) {
      return {
        list: [],
        single:
          scenario === "missing"
            ? null
            : {
                account_status: "limited",
                avatar_url: "https://cdn.example/avatar.png",
                created_at: "2026-01-02T00:00:00.000Z",
                email: "tutor@example.com",
                full_name: "Ada Tutor",
                id: "user-1",
                timezone: "Europe/London",
              },
      };
    }
    // loadAppUserIdentities (actors)
    return {
      list: [
        {
          avatar_url: "https://cdn.example/admin.png",
          full_name: "Olivia Operator",
          id: "admin-1",
        },
      ],
      single: null,
    };
  }

  if (table === "user_roles") {
    return {
      list: [
        {
          granted_at: "2026-01-03T00:00:00.000Z",
          revoked_at: null,
          role: "tutor",
          role_status: "active",
        },
      ],
      single: null,
    };
  }

  if (table === "tutor_profiles") {
    if (columns.includes("application_status")) {
      return {
        list: [],
        single: {
          application_status: "approved",
          headline: "IB Maths HL",
          id: "tutor-1",
          public_listing_status: "listed",
          public_slug: "ada-tutor",
          self_paused_at: null,
        },
      };
    }
    if (columns.includes("payout_readiness_status")) {
      return {
        list: [],
        single: {
          payout_account_country: "GB",
          payout_onboarding_completed_at: null,
          payout_onboarding_started_at: null,
          payout_readiness_status: "enabled",
          payout_status_synced_at: null,
          stripe_account_id: "acct_123",
        },
      };
    }
    // loadTutorProfileId
    return { list: [], single: { id: "tutor-1" } };
  }

  if (table === "tutor_public_media_assets") {
    return {
      list: [],
      single: { storage_object_path: "tutor/tutor-1/photo/p.jpg" },
    };
  }

  if (table === "moderation_cases") {
    return {
      list: [
        {
          case_kind: "report",
          case_status: "queued",
          created_at: "2026-02-01T00:00:00.000Z",
          id: "case-1",
          subject_id: "user-1",
          subject_kind: "app_user",
        },
      ],
      single: null,
    };
  }

  if (table === "admin_action_logs") {
    return {
      list: [
        {
          action_key: "account.set_status",
          actor_app_user_id: "admin-1",
          created_at: "2026-02-02T00:00:00.000Z",
          id: "log-1",
          reason: "Limited pending review",
          target_id: "user-1",
          target_type: "app_user",
        },
      ],
      single: null,
    };
  }

  return { list: [], single: null };
}

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => ({
    from(table: string) {
      return {
        select(columns: string) {
          const { single, list } = resolveData(table, columns);
          const chain: Record<string, unknown> = {};
          chain.eq = () => chain;
          chain.in = () => chain;
          chain.or = () => chain;
          chain.order = () => chain;
          chain.limit = () => chain;
          chain.maybeSingle = () =>
            Promise.resolve({ data: single, error: null });
          chain.returns = () => Promise.resolve({ data: list, error: null });
          return chain;
        },
      };
    },
    storage: {
      from() {
        return {
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://cdn.example/media/${path}` } };
          },
        };
      },
    },
  }),
}));

import { getInternalUserDetail } from "@/modules/admin/user-detail-repository";

describe("user detail repository — view-model boundary", () => {
  beforeEach(() => {
    scenario = "tutor";
  });

  it("returns null when the user does not exist", async () => {
    scenario = "missing";
    const detail = await getInternalUserDetail("nope");
    expect(detail).toBeNull();
  });

  it("ships display-ready labels/tones, avatar, flag, and href (no raw enums)", async () => {
    const detail = await getInternalUserDetail("user-1");
    expect(detail).not.toBeNull();

    // Account: humanized status + tone + avatar.
    expect(detail!.account.accountStatusLabel).toBe("Limited");
    expect(detail!.account.accountStatusLabel).not.toBe(
      detail!.account.accountStatus,
    );
    expect(detail!.account.accountStatusTone).toBe("warning");
    expect(detail!.account.avatarSrc).toBe("https://cdn.example/avatar.png");

    // Roles: humanized.
    expect(detail!.roles[0]?.roleLabel).toBe("Tutor");
    expect(detail!.roles[0]?.roleStatusLabel).toBe("Active");

    // Tutor: approved + listed resolves avatar + a typed public profile href.
    expect(detail!.tutorProfile?.applicationStatusLabel).toBe("Approved");
    expect(detail!.tutorProfile?.publicListingStatusLabel).toBe("Listed");
    expect(detail!.tutorProfile?.publicProfileHref).toBe("/tutors/ada-tutor");
    expect(detail!.tutorProfile?.avatarSrc).toContain(
      "tutor/tutor-1/photo/p.jpg",
    );

    // Finance: humanized payout status + a renderable flag code.
    expect(detail!.finance?.payoutReadinessStatusLabel).toBe("Enabled");
    expect(detail!.finance?.countryFlagCode).toBe("GB");

    // Cases: every enum carries a label.
    const firstCase = detail!.recentCases[0];
    expect(firstCase?.caseKindLabel).toBe("Report");
    expect(firstCase?.caseStatusLabel).toBe("Queued");
    expect(firstCase?.subjectKindLabel).toBe("User");
    expect(firstCase?.involvementLabel).toBe("Subject of report");

    // Admin actions: verb-phrase label + resolved actor identity (no UUID).
    const firstAction = detail!.recentAdminActions[0];
    expect(firstAction?.actionKeyLabel).toBe("Changed account status");
    expect(firstAction?.actorDisplayName).toBe("Olivia Operator");
    expect(firstAction?.actorAvatarSrc).toBe("https://cdn.example/admin.png");
  });
});
