"use client";

import { useActionState } from "react";

import { Button, InlineNotice, SelectField, Textarea } from "@/components/ui";

import {
  initialReviewModerationActionState,
  type ReviewModerationActionState,
} from "./action-types";
import { runReviewModerationAction } from "./actions";
import styles from "./reviews.module.css";

type ReviewModerationFormProps = {
  reviewId: string;
};

// Per-review hide/redact form (P2-ADMIN-TRUST-001). A moderation note is
// required; the Server Action flips `review_status` and writes the audit row.
export function ReviewModerationForm({ reviewId }: ReviewModerationFormProps) {
  const [state, formAction, pending] = useActionState<
    ReviewModerationActionState,
    FormData
  >(runReviewModerationAction, initialReviewModerationActionState);

  const isThisReview = state.reviewId === reviewId;

  return (
    <form action={formAction} className={styles.moderationForm}>
      <input name="review_id" type="hidden" value={reviewId} />

      {isThisReview && state.message ? (
        <InlineNotice tone="warning" title="Couldn't apply this decision">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}
      {isThisReview && state.code === "ok" ? (
        <InlineNotice tone="success" title="Decision recorded">
          <p>{state.successMessage}</p>
        </InlineNotice>
      ) : null}

      <SelectField defaultValue="hidden" label="Decision" name="status">
        <option value="hidden">Hide review</option>
        <option value="rejected">Reject review</option>
      </SelectField>
      <Textarea
        description="Required. Recorded with the audit row and visible to operators only."
        label="Moderation note"
        maxLength={2000}
        name="moderation_note"
        placeholder="Explain why this review is being hidden or rejected."
        required
        rows={3}
      />
      <div className={styles.moderationSubmitRow}>
        <Button disabled={pending} type="submit" variant="danger">
          {pending ? "Saving…" : "Apply decision"}
        </Button>
      </div>
    </form>
  );
}
