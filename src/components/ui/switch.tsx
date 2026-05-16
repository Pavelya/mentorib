"use client";

import { useId, type ReactNode } from "react";

import styles from "./switch.module.css";

export type SwitchProps = {
  ariaLabel?: string;
  checked: boolean;
  description?: ReactNode;
  disabled?: boolean;
  helperText?: ReactNode;
  id?: string;
  label: ReactNode;
  layout?: "inline" | "stacked";
  onCheckedChange?: (next: boolean) => void;
};

export function Switch({
  ariaLabel,
  checked,
  description,
  disabled,
  helperText,
  id,
  label,
  layout = "inline",
  onCheckedChange,
}: SwitchProps) {
  const reactId = useId().replaceAll(":", "");
  const fieldId = id ?? `switch-${reactId}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const describedBy =
    [descriptionId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={[
        styles.field,
        layout === "stacked" ? styles.fieldStacked : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.copy}>
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
        {description ? (
          <p className={styles.description} id={descriptionId}>
            {description}
          </p>
        ) : null}
        {helperText ? (
          <p className={styles.description} id={helperId}>
            {helperText}
          </p>
        ) : null}
      </div>
      <button
        aria-checked={checked}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        className={styles.control}
        data-state={checked ? "on" : "off"}
        disabled={disabled}
        id={fieldId}
        onClick={() => {
          if (disabled || !onCheckedChange) {
            return;
          }
          onCheckedChange(!checked);
        }}
        role="switch"
        type="button"
      >
        <span aria-hidden="true" className={styles.knob} />
      </button>
    </div>
  );
}
