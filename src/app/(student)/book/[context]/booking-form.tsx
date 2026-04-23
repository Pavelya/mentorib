"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice, SelectField, Textarea } from "@/components/ui";
import type { BookingSlotOption } from "@/modules/lessons/booking";

import {
  submitBookingRequestAction,
  type BookingRequestActionState,
} from "./actions";
import styles from "./booking.module.css";

const initialActionState: BookingRequestActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: {
    context: "",
    note: "",
    operationKey: "",
    slotStartAt: "",
  },
};

type BookingFormProps = {
  context: string;
  initialNote: string;
  operationKey: string;
  priceLabel: string;
  slotOptions: BookingSlotOption[];
};

export function BookingForm({
  context,
  initialNote,
  operationKey,
  priceLabel,
  slotOptions,
}: BookingFormProps) {
  const [state, formAction] = useActionState(
    submitBookingRequestAction,
    initialActionState,
  );
  const defaultSlot = state.values.slotStartAt || slotOptions[0]?.startAt || "";
  const [selectedSlot, setSelectedSlot] = useState(defaultSlot);
  const activeSlot =
    slotOptions.find((slot) => slot.startAt === selectedSlot) ?? slotOptions[0] ?? null;

  return (
    <form action={formAction} className={styles.form}>
      <input name="context" type="hidden" value={context} />
      <input name="operationKey" type="hidden" value={state.values.operationKey || operationKey} />

      {state.message ? (
        <InlineNotice title="Please review the booking details" tone="actionNeeded">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <SelectField
        defaultValue={defaultSlot}
        description="Live availability already respects the tutor's minimum notice and current lesson conflicts."
        error={state.fieldErrors.slotStartAt}
        label="Lesson time"
        name="slotStartAt"
        onChange={(event) => setSelectedSlot(event.currentTarget.value)}
      >
        {slotOptions.map((slot) => (
          <option key={slot.startAt} value={slot.startAt}>
            {slot.label}
          </option>
        ))}
      </SelectField>

      {activeSlot ? (
        <div className={styles.slotPreview} aria-live="polite">
          <p className={styles.slotPreviewLabel}>Selected slot</p>
          <strong>{activeSlot.label}</strong>
          <p>{activeSlot.secondaryLabel}</p>
          <p>Request expires at {activeSlot.requestExpiresLabel}.</p>
        </div>
      ) : null}

      <Textarea
        defaultValue={state.values.note || initialNote}
        description="Optional lesson goal or note for the tutor. Keep it specific to this request."
        error={state.fieldErrors.note}
        label="Lesson note"
        labelMeta="Optional"
        name="note"
        placeholder="What should the tutor prepare for this session?"
        rows={5}
      />

      <div className={styles.checkoutSummary}>
        <div>
          <p className={styles.summaryLabel}>Authorization hold</p>
          <p className={styles.summaryValue}>{priceLabel}</p>
        </div>
        <p className={styles.summaryCopy}>
          Stripe places a hold now and only captures it if the tutor accepts inside the request window.
        </p>
      </div>

      <div className={styles.formActions}>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit">
      {pending ? "Opening Stripe Checkout..." : "Request lesson"}
    </Button>
  );
}
