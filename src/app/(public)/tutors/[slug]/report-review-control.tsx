"use client";

import { useState, useTransition } from "react";

import {
  Button,
  ConfirmDialog,
  InlineNotice,
  Textarea,
} from "@/components/ui";

import { reportReviewAction } from "./review-report-actions";
import {
  initialReportReviewActionState,
  type ReportReviewActionState,
} from "./review-report-state";
import styles from "./tutor-profile.module.css";

type ReportReviewControlProps = {
  reviewId: string;
};

// Minimal "Report this review" entry (P2-ADMIN-TRUST-001): a trigger that opens
// the shared DS ConfirmDialog with a required reason. The Server Action does
// the auth + case-open work; this component only collects the note and shows
// feedback. No route-local card/panel/list CSS — only the trigger-row layout.
export function ReportReviewControl({ reviewId }: ReportReviewControlProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<ReportReviewActionState>(
    initialReportReviewActionState,
  );
  const [pending, startTransition] = useTransition();

  if (state.code === "ok") {
    return (
      <div className={styles.reviewReportRow}>
        <InlineNotice tone="success" title="Report submitted">
          <p>Thanks — our trust team will review this review.</p>
        </InlineNotice>
      </div>
    );
  }

  function submit() {
    if (pending || reason.trim().length < 3) {
      return;
    }
    const formData = new FormData();
    formData.set("review_id", reviewId);
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await reportReviewAction(
        initialReportReviewActionState,
        formData,
      );
      setState(result);
      if (result.code === "ok") {
        setOpen(false);
        setReason("");
      }
    });
  }

  return (
    <div className={styles.reviewReportRow}>
      <Button
        onClick={() => {
          setState(initialReportReviewActionState);
          setOpen(true);
        }}
        size="compact"
        type="button"
        variant="ghost"
      >
        Report this review
      </Button>
      {state.message ? (
        <InlineNotice tone="warning" title="Couldn't submit this report">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={pending ? "Submitting…" : "Submit report"}
        confirmVariant="primary"
        description={
          <>
            <p>
              Reports are reviewed by Mentor IB&apos;s trust team. The reviewer
              is not told who reported.
            </p>
            <Textarea
              description="Required. Tell us what concerned you about this review."
              label="Reason"
              maxLength={2000}
              minLength={3}
              name="reason"
              onChange={(event) => setReason(event.currentTarget.value)}
              placeholder="What concerned you?"
              required
              rows={4}
              value={reason}
            />
          </>
        }
        onCancel={() => setOpen(false)}
        onConfirm={submit}
        open={open}
        title="Report this review"
      />
    </div>
  );
}
