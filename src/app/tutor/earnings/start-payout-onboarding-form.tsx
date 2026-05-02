"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice, SelectField } from "@/components/ui";

import {
  initialStartPayoutOnboardingState,
  startPayoutOnboardingAction,
  type StartPayoutOnboardingState,
} from "./actions";
import styles from "./earnings.module.css";

type CountryOption = {
  code: string;
  displayName: string;
};

type StartPayoutOnboardingFormProps = {
  countryOptions: readonly CountryOption[];
  defaultCountry: string;
  disabled: boolean;
};

export function StartPayoutOnboardingForm({
  countryOptions,
  defaultCountry,
  disabled,
}: StartPayoutOnboardingFormProps) {
  const [state, formAction] = useActionState(startPayoutOnboardingAction, {
    ...initialStartPayoutOnboardingState,
    values: { country: defaultCountry },
  });
  const safeState = normalizeState(state, defaultCountry);

  return (
    <FormBody
      action={formAction}
      countryOptions={countryOptions}
      disabled={disabled}
      state={safeState}
    />
  );
}

function FormBody({
  action,
  countryOptions,
  disabled,
  state,
}: {
  action: (formData: FormData) => void;
  countryOptions: readonly CountryOption[];
  disabled: boolean;
  state: StartPayoutOnboardingState;
}) {
  const [country, setCountry] = useState(state.values.country);

  return (
    <form action={action} className={styles.payoutForm}>
      {state.message ? (
        <InlineNotice
          title={
            state.code === "success"
              ? "Onboarding ready"
              : "Please review the form"
          }
          tone={state.code === "success" ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <p className={styles.helperText}>
        Choose the country where you&apos;ll receive payouts. After Stripe
        verification, you only need to upload an ID and add a bank account or
        debit card to finish setup.
      </p>

      <SelectField
        disabled={disabled}
        error={state.fieldErrors.country}
        label="Payout country"
        name="country"
        onChange={(event) => setCountry(event.target.value)}
        value={country}
      >
        <option value="">Select a country</option>
        {countryOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.displayName}
          </option>
        ))}
      </SelectField>

      <div className={styles.formActions}>
        <SubmitButton disabled={disabled} />
      </div>
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Opening Stripe" : "Continue to Stripe"}
    </Button>
  );
}

function normalizeState(
  state: StartPayoutOnboardingState | undefined,
  defaultCountry: string,
): StartPayoutOnboardingState {
  return {
    code: state?.code ?? null,
    fieldErrors: state?.fieldErrors ?? {},
    message: state?.message ?? null,
    values: state?.values ?? { country: defaultCountry },
  };
}
