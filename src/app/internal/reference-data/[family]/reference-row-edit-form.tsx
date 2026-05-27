"use client";

import { useActionState } from "react";

import {
  Button,
  InlineNotice,
  SelectField,
  TextField,
  Textarea,
} from "@/components/ui";

import type { ReferenceEditableField } from "@/modules/reference/admin/families";
import type { ReferenceAdminRow } from "@/modules/reference/admin/repository";

import {
  initialReferenceEditActionState,
  type ReferenceEditActionState,
} from "./action-types";
import { runReferenceEditAction } from "./actions";
import styles from "../reference-data.module.css";

type ReferenceRowEditFormProps = {
  editableFields: readonly ReferenceEditableField[];
  family: string;
  row: ReferenceAdminRow;
};

export function ReferenceRowEditForm({
  editableFields,
  family,
  row,
}: ReferenceRowEditFormProps) {
  const [state, formAction, pending] = useActionState<
    ReferenceEditActionState,
    FormData
  >(runReferenceEditAction, initialReferenceEditActionState);

  const isForThisRow = state.family === family && state.id === row.id;
  const errorMessage = isForThisRow ? state.message : null;
  const successMessage = isForThisRow ? state.successMessage : null;

  return (
    <form action={formAction} className={styles.editForm}>
      <input name="family" type="hidden" value={family} />
      <input name="id" type="hidden" value={row.id} />

      <div className={styles.editFormRow}>
        {editableFields.includes("display_name") ? (
          <TextField
            defaultValue={row.displayName}
            label="Display name"
            maxLength={120}
            name="display_name"
            required
          />
        ) : null}
        {editableFields.includes("display_label") ? (
          <TextField
            defaultValue={row.displayName}
            label="Display label"
            maxLength={120}
            name="display_label"
            required
          />
        ) : null}
        {editableFields.includes("sort_order") ? (
          <SelectField
            defaultValue={String(row.sortOrder)}
            label="Sort order"
            name="sort_order"
          >
            {Array.from({ length: 21 }, (_, index) => index * 5).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
        ) : null}
      </div>

      {editableFields.includes("display_description") ? (
        <Textarea
          defaultValue={row.displayDescription ?? ""}
          description="Short caption shown next to the label in onboarding and match flows."
          label="Display description"
          maxLength={2000}
          name="display_description"
          rows={3}
        />
      ) : null}
      {editableFields.includes("helper_text") ? (
        <Textarea
          defaultValue={row.helperText ?? ""}
          description="Optional helper rendered under the option in the match flow."
          label="Helper text"
          maxLength={2000}
          name="helper_text"
          rows={3}
        />
      ) : null}

      {editableFields.includes("is_active") ? (
        <label className={styles.activeToggle}>
          <input
            defaultChecked={row.isActive}
            name="is_active"
            type="checkbox"
          />
          <span>
            Active —{" "}
            {row.isActive
              ? "shown in discovery and onboarding"
              : "hidden from discovery; existing references still resolve"}
          </span>
        </label>
      ) : null}

      {errorMessage ? (
        <InlineNotice tone="warning" title="Couldn't save changes">
          <p>{errorMessage}</p>
        </InlineNotice>
      ) : null}
      {successMessage ? (
        <InlineNotice tone="success" title="Saved">
          <p>{successMessage}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.editFormFooter}>
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
