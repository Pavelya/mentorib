import { useId, type ReactNode } from "react";

import styles from "./field.module.css";

type FieldShellRenderProps = {
  describedBy?: string;
  fieldId: string;
  invalid: boolean;
};

type FieldShellProps = {
  description?: ReactNode;
  error?: ReactNode;
  id?: string;
  label: ReactNode;
  labelMeta?: ReactNode;
  children: (props: FieldShellRenderProps) => ReactNode;
};

export function FieldShell({
  children,
  description,
  error,
  id,
  label,
  labelMeta,
}: FieldShellProps) {
  const reactId = useId().replaceAll(":", "");
  const fieldId = id ?? `field-${reactId}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
        {labelMeta ? <span className={styles.meta}>{labelMeta}</span> : null}
      </div>

      {children({ describedBy, fieldId, invalid })}

      {description ? (
        <p className={styles.hint} id={descriptionId}>
          {description}
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
