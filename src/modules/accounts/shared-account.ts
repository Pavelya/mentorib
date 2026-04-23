import type { Route } from "next";
import { redirect } from "next/navigation";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildLegalNoticeReviewPath,
  getLatestPendingLegalNotice,
  type LegalNoticeDto,
} from "@/modules/notifications/legal-notices";

type NotificationRow = MentorIbDatabase["public"]["Tables"]["notifications"]["Row"];
type PaymentRow = MentorIbDatabase["public"]["Tables"]["payments"]["Row"];

export type SharedAccountRouteContext =
  | {
      status: "account_error";
    }
  | {
      status: "auth_unavailable";
    }
  | {
      account: ResolvedAuthAccount;
      pendingLegalNotice: LegalNoticeDto | null;
      status: "ready";
    };

export type AccountNotificationDto = {
  bodySummary: string;
  createdAt: string;
  id: string;
  notificationStatus: NotificationRow["notification_status"];
  notificationType: NotificationRow["notification_type"];
  safeHref: string | null;
  title: string;
};

export type AccountBillingEntryDto = {
  amount: number;
  capturedAt: string | null;
  createdAt: string;
  currencyCode: string;
  id: string;
  paymentStatus: PaymentRow["payment_status"];
  refundedAt: string | null;
};

export async function getSharedAccountRouteContext(
  nextPath: Route,
): Promise<SharedAccountRouteContext> {
  if (!isSupabaseAuthConfigured()) {
    return {
      status: "auth_unavailable",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(nextPath) as Route);
  }

  let account: ResolvedAuthAccount;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    return {
      status: "account_error",
    };
  }

  let pendingLegalNotice: LegalNoticeDto | null = null;

  try {
    pendingLegalNotice = await getLatestPendingLegalNotice(account.id);
  } catch {
    pendingLegalNotice = null;
  }

  return {
    account,
    pendingLegalNotice,
    status: "ready",
  };
}

export async function listAccountNotifications(appUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, notification_type, notification_status, object_type, object_id, title, body_summary, created_at",
    )
    .eq("app_user_id", appUserId)
    .neq("notification_type", "new_message")
    .order("created_at", { ascending: false })
    .limit(24)
    .returns<NotificationRow[]>();

  if (error || !data) {
    return [] satisfies AccountNotificationDto[];
  }

  return data.map((notification) => {
    return {
      bodySummary: notification.body_summary,
      createdAt: notification.created_at,
      id: notification.id,
      notificationStatus: notification.notification_status,
      notificationType: notification.notification_type,
      safeHref:
        notification.notification_type === "policy_notice_updated" && notification.object_id
          ? buildLegalNoticeReviewPath(notification.object_id, "/notifications")
          : null,
      title: notification.title,
    };
  });
}

export async function listAccountBillingHistory(appUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, currency_code, payment_status, created_at, captured_at, refunded_at")
    .eq("payer_app_user_id", appUserId)
    .order("created_at", { ascending: false })
    .limit(24)
    .returns<PaymentRow[]>();

  if (error || !data) {
    return [] satisfies AccountBillingEntryDto[];
  }

  return data.map((payment) => {
    return {
      amount: payment.amount,
      capturedAt: payment.captured_at,
      createdAt: payment.created_at,
      currencyCode: payment.currency_code,
      id: payment.id,
      paymentStatus: payment.payment_status,
      refundedAt: payment.refunded_at,
    };
  });
}
