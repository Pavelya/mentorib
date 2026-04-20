import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/jobs/env";
import { logJobsEvent } from "@/lib/jobs/logging";
import {
  drainDueJobs,
  recoverStripeWebhookJobs,
  requeueStaleJobs,
  seedScheduledJobs,
} from "@/lib/jobs/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const seededJobCount = await seedScheduledJobs();
    const recoveredWebhookCount = await recoverStripeWebhookJobs();
    const requeuedStaleCount = await requeueStaleJobs();
    const drainSummary = await drainDueJobs();

    return NextResponse.json({
      ok: true,
      ...drainSummary,
      recovered_webhook_count: recoveredWebhookCount,
      requeued_stale_count: requeuedStaleCount,
      seeded_job_count: seededJobCount,
    });
  } catch (error) {
    logJobsEvent("error", "cron_job_sweep_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Job sweep failed." }, { status: 500 });
  }
}

function isAuthorizedCronRequest(request: Request) {
  return request.headers.get("authorization") === `Bearer ${getCronSecret()}`;
}
