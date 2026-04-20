import type { TextareaHTMLAttributes } from "react";

import { FieldShell } from "./field-shell";
import styles from "./field.module.css";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  description?: string;
  error?: string;
  label: string;
  labelMeta?: string;
  variant?: "default" | "longForm";
};

export function Textarea({
  className,
  description,
  error,
  id,
  label,
  labelMeta,
  rows = 5,
  variant = "default",
  ...props
}: TextareaProps) {
  return (
    <FieldShell description={description} error={error} id={id} label={label} labelMeta={labelMeta}>
      {({ describedBy, fieldId, invalid }) => (
        <textarea
          {...props}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={[
            styles.textarea,
            variant === "longForm" ? styles.longForm : "",
            invalid ? styles.invalid : "",
            props.disabled ? styles.disabled : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          id={fieldId}
          rows={rows}
        />
      )}
    </FieldShell>
  );
}
