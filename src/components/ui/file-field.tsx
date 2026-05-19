"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { getButtonClassName } from "./button";
import { FieldShell } from "./field-shell";
import styles from "./file-field.module.css";

type FileFieldProps = {
  label: string;
  name: string;
  accept?: string;
  description?: string;
  error?: string;
  helperText?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  triggerLabel?: string;
  emptyLabel?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  value?: FileList | null;
  onFilesChange?: (files: FileList | null) => void;
};

function describeFiles(files: FileList | null | undefined): string | null {
  if (!files || files.length === 0) return null;
  if (files.length === 1) return files[0].name;
  return `${files.length} files selected`;
}

export function FileField({
  accept,
  description,
  disabled = false,
  emptyLabel = "No file chosen",
  error,
  helperText,
  label,
  multiple = false,
  name,
  onChange,
  onFilesChange,
  required = false,
  triggerLabel,
  value,
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalFiles, setInternalFiles] = useState<FileList | null>(null);

  const isControlled = value !== undefined;
  const files = isControlled ? value ?? null : internalFiles;
  const fileLabel = describeFiles(files);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setInternalFiles(event.target.files);
    }
    onFilesChange?.(event.target.files);
    onChange?.(event);
  }

  const computedTriggerLabel =
    triggerLabel ?? (multiple ? "Choose files" : "Choose file");

  return (
    <FieldShell
      description={description ?? helperText}
      error={error}
      label={label}
    >
      {({ describedBy, fieldId, invalid }) => (
        <div className={styles.triggerRow}>
          <button
            aria-describedby={describedBy}
            className={getButtonClassName({
              className: styles.trigger,
              size: "compact",
              variant: "secondary",
            })}
            data-invalid={invalid || undefined}
            disabled={disabled}
            onClick={handleClick}
            type="button"
          >
            {computedTriggerLabel}
          </button>
          <p
            className={[
              styles.fileName,
              fileLabel ? "" : styles.placeholder,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {fileLabel ?? emptyLabel}
          </p>
          <input
            accept={accept}
            aria-hidden="true"
            className={styles.srOnly}
            disabled={disabled}
            id={fieldId}
            multiple={multiple}
            name={name}
            onChange={handleChange}
            ref={inputRef}
            required={required}
            tabIndex={-1}
            type="file"
          />
        </div>
      )}
    </FieldShell>
  );
}

export type { FileFieldProps };
