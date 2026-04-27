import type { HTMLAttributes, ReactNode } from "react";

import { Avatar, StatusBadge } from "@/components/ui";

import styles from "./continuity-primitives.module.css";

type StatusTone = "positive" | "warning" | "destructive" | "trust" | "info";

type NeedSummaryState = "draft" | "active" | "locked" | "truncated";
type NeedSummaryVariant = "compact" | "standard" | "stacked";
type NeedSummaryMode = "editable" | "readOnly";

type NeedSummaryQualifier = {
  label: string;
  priority?: "default" | "support";
};

type PersonSummaryVariant = "compact" | "standard" | "header" | "operational";
type PersonSummaryState = "default" | "verified" | "new" | "attention_needed" | "muted_context";

type PersonSummaryBadge = {
  label: string;
  tone?: StatusTone;
};

type LessonSummaryStatus =
  | "pending"
  | "accepted"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "declined"
  | "cancelled";

type ContextChipTone = "default" | StatusTone;

type ContextChip = {
  label: string;
  tone?: ContextChipTone;
};

type NeedSummaryBarProps = HTMLAttributes<HTMLElement> & {
  action?: ReactNode;
  label?: ReactNode;
  mode?: NeedSummaryMode;
  need: ReactNode;
  qualifiers: NeedSummaryQualifier[];
  stateLabel?: ReactNode;
  state?: NeedSummaryState;
  variant?: NeedSummaryVariant;
};

type PersonSummaryProps = HTMLAttributes<HTMLElement> & {
  action?: ReactNode;
  avatarSrc?: string;
  badges?: PersonSummaryBadge[];
  descriptor: ReactNode;
  eyebrow?: ReactNode;
  meta?: string[];
  name: string;
  state?: PersonSummaryState;
  variant?: PersonSummaryVariant;
};

type LessonSummaryProps = HTMLAttributes<HTMLElement> & {
  action?: ReactNode;
  details?: string[];
  label?: ReactNode;
  person: ReactNode;
  schedule: ReactNode;
  status?: LessonSummaryStatus;
  timezone: ReactNode;
  title: ReactNode;
};

type ContextChipRowProps = HTMLAttributes<HTMLDivElement> & {
  items: ContextChip[];
  label?: ReactNode;
};

const NEED_STATE_META: Record<NeedSummaryState, { label: string; tone: StatusTone }> = {
  active: { label: "Active need", tone: "positive" },
  draft: { label: "Draft need", tone: "warning" },
  locked: { label: "Locked need", tone: "trust" },
  truncated: { label: "Condensed need", tone: "info" },
};

const PERSON_STATE_META: Record<
  Exclude<PersonSummaryState, "default">,
  { label: string; tone: StatusTone }
> = {
  attention_needed: { label: "Attention needed", tone: "warning" },
  muted_context: { label: "Muted context", tone: "info" },
  new: { label: "New", tone: "info" },
  verified: { label: "Verified", tone: "trust" },
};

const LESSON_STATUS_META: Record<LessonSummaryStatus, { label: string; tone: StatusTone }> = {
  accepted: { label: "Accepted", tone: "positive" },
  cancelled: { label: "Cancelled", tone: "destructive" },
  completed: { label: "Completed", tone: "info" },
  declined: { label: "Declined", tone: "destructive" },
  in_progress: { label: "In progress", tone: "positive" },
  pending: { label: "Pending", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "trust" },
  upcoming: { label: "Upcoming", tone: "positive" },
};

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function NeedSummaryBar({
  action,
  className,
  label = "Current need",
  mode = "editable",
  need,
  qualifiers,
  stateLabel,
  state = "active",
  variant = "standard",
  ...props
}: NeedSummaryBarProps) {
  const stateMeta = NEED_STATE_META[state];

  return (
    <section
      {...props}
      className={cx(styles.surface, styles.needBar, styles[variant], styles[mode], className)}
    >
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceIntro}>
          <p className={styles.eyebrow}>{label}</p>
          <h3 className={styles.title}>{need}</h3>
        </div>

        <div className={styles.surfaceSignals}>
          <StatusBadge tone={stateMeta.tone}>{stateLabel ?? stateMeta.label}</StatusBadge>
          {action ? <div className={styles.actionSlot}>{action}</div> : null}
        </div>
      </div>

      <ul className={styles.qualifierList}>
        {qualifiers.map((qualifier) => (
          <li
            className={cx(
              styles.qualifierChip,
              qualifier.priority === "support" && styles.qualifierSupport,
            )}
            key={`${String(qualifier.label)}-${qualifier.priority ?? "default"}`}
          >
            {qualifier.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PersonSummary({
  action,
  avatarSrc,
  badges = [],
  className,
  descriptor,
  eyebrow,
  meta = [],
  name,
  state = "default",
  variant = "standard",
  ...props
}: PersonSummaryProps) {
  const avatarSize = variant === "header" ? "lg" : variant === "compact" ? "sm" : "md";
  const stateMeta = state === "default" ? null : PERSON_STATE_META[state];

  return (
    <section
      {...props}
      className={cx(styles.surface, styles.personSummary, styles[variant], className)}
    >
      <Avatar name={name} size={avatarSize} src={avatarSrc} />

      <div className={styles.personBody}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}

        <div className={styles.personHeader}>
          <div className={styles.personTitleBlock}>
            <h3 className={styles.title}>{name}</h3>
            <p className={styles.personDescriptor}>{descriptor}</p>
          </div>

          {action ? <div className={styles.actionSlot}>{action}</div> : null}
        </div>

        {stateMeta || badges.length > 0 ? (
          <div className={styles.badgeRow}>
            {stateMeta ? <StatusBadge tone={stateMeta.tone}>{stateMeta.label}</StatusBadge> : null}
            {badges.map((badge) => (
              <StatusBadge key={`${badge.label}-${badge.tone ?? "info"}`} tone={badge.tone ?? "info"}>
                {badge.label}
              </StatusBadge>
            ))}
          </div>
        ) : null}

        {meta.length > 0 ? (
          <ul className={styles.metaList}>
            {meta.map((item) => (
              <li className={styles.metaItem} key={item}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function LessonSummary({
  action,
  className,
  details = [],
  label = "Lesson continuity",
  person,
  schedule,
  status = "pending",
  timezone,
  title,
  ...props
}: LessonSummaryProps) {
  const statusMeta = LESSON_STATUS_META[status];

  return (
    <section {...props} className={cx(styles.surface, styles.lessonSummary, className)}>
      <div className={styles.lessonHeader}>
        <div className={styles.surfaceIntro}>
          <p className={styles.eyebrow}>{label}</p>
          <h3 className={styles.title}>{title}</h3>
        </div>

        <div className={styles.surfaceSignals}>
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
          {action ? <div className={styles.actionSlot}>{action}</div> : null}
        </div>
      </div>

      <div className={styles.lessonMetaRow}>
        <p className={styles.lessonMetaLabel}>{schedule}</p>
        <p className={styles.lessonMetaLabel}>{timezone}</p>
      </div>

      {details.length > 0 ? (
        <ul className={styles.detailList}>
          {details.map((detail) => (
            <li className={styles.detailItem} key={detail}>
              {detail}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.lessonPerson}>{person}</div>
    </section>
  );
}

export function ContextChipRow({
  className,
  items,
  label = "Context",
  ...props
}: ContextChipRowProps) {
  return (
    <div {...props} className={cx(styles.contextRow, className)}>
      <p className={styles.eyebrow}>{label}</p>

      <ul className={styles.contextChipList}>
        {items.map((item) => (
          <li
            className={cx(styles.contextChip, styles[`chipTone${toToneToken(item.tone ?? "default")}`])}
            key={`${item.label}-${item.tone ?? "default"}`}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function toToneToken(tone: ContextChipTone) {
  switch (tone) {
    case "positive":
      return "Positive";
    case "warning":
      return "Warning";
    case "destructive":
      return "Destructive";
    case "trust":
      return "Trust";
    case "info":
      return "Info";
    default:
      return "Default";
  }
}
