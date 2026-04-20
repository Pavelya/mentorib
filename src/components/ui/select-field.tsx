import type { ReactNode, SelectHTMLAttributes } from "react";

import { FieldShell } from "./field-shell";
import styles from "./field.module.css";

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  children: ReactNode;
  description?: string;
  error?: string;
  label: string;
  labelMeta?: string;
  size?: "default" | "compact";
};

export function SelectField({
  children,
  className,
  description,
  error,
  id,
  label,
  labelMeta,
  size = "default",
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell description={description} error={error} id={id} label={label} labelMeta={labelMeta}>
      {({ describedBy, fieldId, invalid }) => (
        <span className={styles.selectWrap}>
          <select
            {...props}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={[
              styles.select,
              styles[size],
              invalid ? styles.invalid : "",
              props.disabled ? styles.disabled : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            id={fieldId}
          >
            {children}
          </select>
        </span>
      )}
    </FieldShell>
  );
}
