"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice } from "@/components/ui";

import {
  initialResumePayoutOnboardingState,
  resumePayoutOnboardingAction,
} from "./actions";

type ResumePayoutOnboardingFormProps = {
  ctaLabel: string;
  disabled: boolean;
};

export function ResumePayoutOnboardingForm({
  ctaLabel,
  disabled,
}: ResumePayoutOnboardingFormProps) {
  const [state, formAction] = useActionState(
    resumePayoutOnboardingAction,
    initialResumePayoutOnboardingState,
  );

  return (
    <form action={formAction}>
      {state.message ? (
        <InlineNotice
          title={state.code === "success" ? "Onboarding ready" : "Couldn't open Stripe"}
          tone={state.code === "success" ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <SubmitButton ctaLabel={ctaLabel} disabled={disabled} />
    </form>
  );
}

function SubmitButton({
  ctaLabel,
  disabled,
}: {
  ctaLabel: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} size="compact" type="submit">
      {pending ? "Opening Stripe" : ctaLabel}
    </Button>
  );
}
