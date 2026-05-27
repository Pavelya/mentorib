"use server";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  PolicyNoticeError,
  draftPolicyNotice,
  publishPolicyNotice,
  revokePolicyNotice,
} from "@/modules/admin/policy-notice-service";

import {
  initialPolicyNoticeActionState,
  type PolicyNoticeActionState,
} from "./action-types";

const INTENTS = ["draft", "publish", "revoke"] as const;
type Intent = (typeof INTENTS)[number];

export async function runPolicyNoticeAction(
  _previous: PolicyNoticeActionState,
  formData: FormData,
): Promise<PolicyNoticeActionState> {
  const intent = readIntent(formData);

  const admin = await requireInternalAdminAccount();

  try {
    if (intent === "draft") {
      const noticeType = readString(formData, "notice_type");
      if (noticeType !== "terms" && noticeType !== "privacy") {
        return {
          code: "invalid_notice_type",
          intent,
          message: "Notice type must be terms or privacy.",
          successMessage: null,
        };
      }
      await draftPolicyNotice({
        actorAppUserId: admin.id,
        document_url: readString(formData, "document_url"),
        effective_at: readEffectiveAt(formData),
        notice_type: noticeType,
        requires_acknowledgement:
          readString(formData, "requires_acknowledgement") === "on",
        summary: readString(formData, "summary"),
        title: readString(formData, "title"),
        version_label: readString(formData, "version_label"),
      });
      return {
        code: "ok",
        intent,
        message: null,
        successMessage: "Draft saved.",
      };
    }

    const id = readString(formData, "id");
    if (!id) {
      return {
        code: "missing_id",
        intent,
        message: "Missing notice identifier.",
        successMessage: null,
      };
    }

    if (intent === "publish") {
      await publishPolicyNotice({ actorAppUserId: admin.id, id });
      return {
        code: "ok",
        intent,
        message: null,
        successMessage: "Notice published. Recipients will see it on next read.",
      };
    }
    if (intent === "revoke") {
      await revokePolicyNotice({ actorAppUserId: admin.id, id });
      return {
        code: "ok",
        intent,
        message: null,
        successMessage: "Notice revoked.",
      };
    }
  } catch (error) {
    if (error instanceof PolicyNoticeError) {
      return {
        code: error.code,
        intent,
        message: error.message,
        successMessage: null,
      };
    }
    return {
      code: "unexpected",
      intent,
      message: "We couldn't apply that action.",
      successMessage: null,
    };
  }

  return initialPolicyNoticeActionState;
}

function readString(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function readEffectiveAt(formData: FormData): string {
  const raw = readString(formData, "effective_at");
  if (!raw) {
    return new Date().toISOString();
  }
  // Datetime-local inputs come back like `2026-05-27T10:30`; normalize.
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function readIntent(formData: FormData): Intent {
  const raw = formData.get("intent");
  if (typeof raw === "string" && (INTENTS as readonly string[]).includes(raw)) {
    return raw as Intent;
  }
  return "draft";
}
