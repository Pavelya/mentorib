"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "./button";
import styles from "./confirm-dialog.module.css";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-labelledby="confirm-dialog-title"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onCancel();
        }
      }}
      ref={dialogRef}
    >
      <div className={styles.surface}>
        <h2 className={styles.title} id="confirm-dialog-title">
          {title}
        </h2>
        {description ? (
          <div className={styles.description}>{description}</div>
        ) : null}
        <div className={styles.actions}>
          <Button onClick={onCancel} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} type="button" variant={confirmVariant}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
