import { NextResponse } from "next/server";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole, isRestrictedAccount } from "@/modules/accounts/account-state";
import {
  buildLessonCalendarTitle,
  buildLessonIcsContent,
  type LessonCalendarSnapshot,
} from "@/modules/lessons/calendar";
import { getStudentLessonDetail } from "@/modules/lessons/student-lessons";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { lessonId } = await context.params;

  if (!lessonId.trim()) {
    return new NextResponse("Lesson not found.", { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return new NextResponse("Sign in to download this lesson.", { status: 401 });
  }

  const account = await ensureAuthAccount(user);

  if (isRestrictedAccount(account) || !hasRole(account, "student")) {
    return new NextResponse("Lesson not available for this account.", {
      status: 403,
    });
  }

  const detail = await getStudentLessonDetail(account, lessonId);

  if (!detail) {
    return new NextResponse("Lesson not found.", { status: 404 });
  }

  const subjectLabel = detail.context.subject?.label ?? "Mentor IB lesson";
  const focusLabel = detail.context.focus?.label ?? null;
  const snapshot: LessonCalendarSnapshot = {
    endAtUtc: detail.schedule.endAt,
    focusLabel,
    joinUrl: detail.meeting?.meetingUrl ?? null,
    lessonId: detail.id,
    startAtUtc: detail.schedule.startAt,
    subjectLabel,
  };
  const body = buildLessonIcsContent(snapshot);
  const filename = buildIcsFilename(snapshot);

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}

function buildIcsFilename(snapshot: LessonCalendarSnapshot) {
  const slug = buildLessonCalendarTitle(snapshot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "mentor-ib-lesson"}.ics`;
}
