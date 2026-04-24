"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  selectSetupRoleAction,
  type RoleSelectionActionState,
} from "@/app/setup/role/actions";
import {
  InlineNotice,
  StudentRoleIcon,
  TutorRoleIcon,
  getButtonClassName,
} from "@/components/ui";
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
      <span aria-hidden="true" className={styles.optionIcon}>
        <StudentRoleIcon />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={styles.optionIcon}>
      <TutorRoleIcon />
    </span>
  );
}
