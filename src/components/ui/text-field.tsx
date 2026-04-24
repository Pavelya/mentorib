import type { InputHTMLAttributes, ReactNode } from "react";

import { FieldShell } from "./field-shell";
import styles from "./field.module.css";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  description?: string;
  error?: string;
  label: ReactNode;
  labelMeta?: string;
  size?: "default" | "compact";
};

export function TextField({
  className,
  description,
  error,
  id,
  label,
  labelMeta,
  size = "default",
  type = "text",
  ...props
}: TextFieldProps) {
  return (
    <FieldShell description={description} error={error} id={id} label={label} labelMeta={labelMeta}>
      {({ describedBy, fieldId, invalid }) => (
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={[
            styles.control,
            styles[size],
            invalid ? styles.invalid : "",
            props.disabled ? styles.disabled : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          id={fieldId}
          type={type}
        />
      )}
    </FieldShell>
  );
}
