"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  selectSetupRoleAction,
  type RoleSelectionActionState,
} from "@/app/setup/role/actions";
import { InlineNotice, getButtonClassName } from "@/components/ui";
import type { SetupRoleSelection } from "@/lib/auth/account-service";

import styles from "./role-selection.module.css";

const initialRoleSelectionState: RoleSelectionActionState = {
  error: null,
  selectedRole: null,
};

type RoleOption = {
  role: SetupRoleSelection;
  title: string;
};

const roleOptions: readonly RoleOption[] = [
  {
    role: "student",
    title: "I want help with IB study",
  },
  {
    role: "tutor",
    title: "I want to teach IB students",
  },
];

export function RoleSelectionForm() {
  const [state, formAction] = useActionState(
    selectSetupRoleAction,
    initialRoleSelectionState,
  );

  return (
    <section className={styles.shell} aria-labelledby="setup-role-title">
      <div className={styles.intro}>
        <p className={styles.brand}>Mentor IB</p>
        <h1 id="setup-role-title" className={styles.title}>
          Choose how to start
        </h1>
      </div>

      {state.error ? (
        <InlineNotice title="Choose one option" tone="actionNeeded">
          <p>{state.error}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.roleGrid}>
        {roleOptions.map((option) => (
          <RoleOptionForm
            key={option.role}
            action={formAction}
            isSelected={state.selectedRole === option.role}
            option={option}
          />
        ))}
      </div>
    </section>
  );
}

type RoleOptionFormProps = {
  action: (payload: FormData) => void;
  isSelected: boolean;
  option: RoleOption;
};

function RoleOptionForm({ action, isSelected, option }: RoleOptionFormProps) {
  return (
    <form action={action}>
      <input name="role" type="hidden" value={option.role} />
      <RoleSubmitButton
        isSelected={isSelected}
        label={option.title}
        role={option.role}
      />
    </form>
  );
}

function RoleSubmitButton({
  isSelected,
  label,
  role,
}: {
  isSelected: boolean;
  label: string;
  role: SetupRoleSelection;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      aria-label={label}
      className={getButtonClassName({
        className: [styles.roleOption, isSelected ? styles.selected : ""]
          .filter(Boolean)
          .join(" "),
        fullWidth: true,
        variant: "secondary",
      })}
      disabled={pending}
      type="submit"
    >
      <RoleIcon role={role} />
      <span>{label}</span>
    </button>
  );
}

function RoleIcon({ role }: { role: SetupRoleSelection }) {
  if (role === "student") {
    return (
      <svg
        aria-hidden="true"
        className={styles.optionIcon}
        fill="none"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 12.5h10c3.3 0 6 2.7 6 6v19.5H18c-3.3 0-6-2.7-6-6V13.5c0-.6.4-1 1-1Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d="M29 18.5c0-3.3 2.7-6 6-6h1c.6 0 1 .4 1 1V32c0 3.3-2.7 6-6 6h-2V18.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d="M18 21h5M18 27h5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={styles.optionIcon}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 18.5 24 11l13 7.5L24 26 11 18.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M17 23v8c0 2.2 3.1 4 7 4s7-1.8 7-4v-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M37 19v9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
