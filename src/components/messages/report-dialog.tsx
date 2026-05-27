"use client";

import { useEffect, useRef, useState } from "react";

import { Button, InlineNotice, Textarea } from "@/components/ui";
import { reportConversationOrMessageAction } from "@/modules/messages/actions";
import {
  initialReportSubjectActionState,
  type ReportSubjectKind,
} from "@/modules/messages/actions-state";

import styles from "./messages-experience.module.css";

type ReportDialogProps = {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  subjectKind: ReportSubjectKind;
  subjectId: string;
  counterpartName: string;
};

export function ReportDialog({
  open,
  onClose,
  conversationId,
  subjectKind,
  subjectId,
  counterpartName,
}: ReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "ok" }
    | { kind: "error"; message: string }
    | null
  >(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setFeedback(null);
      setReason("");
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const formData = new FormData();
    formData.set("subject_kind", subjectKind);
    formData.set("subject_id", subjectId);
    formData.set("conversation_id", conversationId);
    formData.set("reason", reason);
    const result = await reportConversationOrMessageAction(
      initialReportSubjectActionState,
      formData,
    );
    setPending(false);
    if (result.code === "ok") {
      setFeedback({ kind: "ok" });
    } else {
      setFeedback({
        kind: "error",
        message: result.message ?? "We couldn't submit the report.",
      });
    }
  }

  const title =
    subjectKind === "message"
      ? `Report this message`
      : `Report this conversation`;

  return (
    <dialog
      aria-labelledby="report-dialog-title"
      className={styles.reportDialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      ref={dialogRef}
    >
      <form className={styles.reportForm} onSubmit={handleSubmit}>
        <h2 className={styles.reportTitle} id="report-dialog-title">
          {title}
        </h2>
        <p className={styles.reportHelper}>
          Sharing a short note helps our team review the case faster. Reports
          are reviewed by Mentor IB&apos;s trust team; {counterpartName} is not
          told who reported.
        </p>
        {feedback?.kind === "ok" ? (
          <InlineNotice tone="success" title="Report submitted">
            <p>
              Thanks — we&apos;ll let you know in-app once the case has been
              reviewed.
            </p>
          </InlineNotice>
        ) : null}
        {feedback?.kind === "error" ? (
          <InlineNotice tone="warning" title="Couldn't submit this report">
            <p>{feedback.message}</p>
          </InlineNotice>
        ) : null}
        <Textarea
          description="Required. Tell us what concerned you. Avoid sharing details about other people."
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
        <div className={styles.reportActions}>
          <Button onClick={onClose} type="button" variant="secondary">
            {feedback?.kind === "ok" ? "Close" : "Cancel"}
          </Button>
          {feedback?.kind === "ok" ? null : (
            <Button disabled={pending || reason.trim().length < 3} type="submit" variant="primary">
              {pending ? "Submitting…" : "Submit report"}
            </Button>
          )}
        </div>
      </form>
    </dialog>
  );
}
