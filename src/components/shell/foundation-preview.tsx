"use client";

import { useState } from "react";

import {
  ContextChipRow,
  LessonSummary,
  NeedSummaryBar,
  PersonSummary,
  ScreenState,
} from "@/components/continuity";
import {
  Avatar,
  Button,
  InlineNotice,
  Panel,
  SelectField,
  StatusBadge,
  TabBar,
  Textarea,
  TextField,
} from "@/components/ui";
import {
  formatTimezoneContext,
  formatUtcLessonRange,
} from "@/lib/datetime";
import { useDetectedTimezone } from "@/lib/datetime/client";

import styles from "./foundation-preview.module.css";

type PreviewMode = "internal" | "student" | "tutor";

const PREVIEW_TABS = [
  { id: "student", label: "Student", panelId: "foundation-student-panel" },
  { id: "tutor", label: "Tutor", panelId: "foundation-tutor-panel" },
  { id: "internal", label: "Internal", panelId: "foundation-internal-panel" },
] as const;

const PREVIEW_COPY: Record<
  PreviewMode,
  {
    body: string;
    contextChips: Array<{
      label: string;
      tone?: "default" | "positive" | "warning" | "destructive" | "trust" | "info";
    }>;
    lesson: {
      details: string[];
      endAtUtc: string;
      startAtUtc: string;
      status: "pending" | "accepted" | "upcoming";
      title: string;
    };
    need: {
      label: string;
      mode: "editable" | "readOnly";
      qualifiers: Array<{
        label: string;
        priority?: "default" | "support";
      }>;
      state: "active" | "locked";
      statement: string;
    };
    notice: string;
    noticeTone: "info" | "success" | "warning";
    person: {
      badges: Array<{
        label: string;
        tone?: "positive" | "warning" | "destructive" | "trust" | "info";
      }>;
      descriptor: string;
      eyebrow: string;
      meta: string[];
      name: string;
      state: "default" | "verified" | "new";
      variant: "standard" | "operational";
    };
    states: {
      empty: {
        description: string;
        hints: string[];
        title: string;
      };
      error: {
        description: string;
        hints: string[];
        title: string;
      };
      loading: {
        description: string;
        hints: string[];
        title: string;
      };
    };
    title: string;
  }
> = {
  internal: {
    body: "Internal surfaces stay readable and structured without drifting into generic admin gray shells.",
    contextChips: [
      { label: "Reference data drift", tone: "warning" },
      { label: "Tutor queue", tone: "info" },
      { label: "Shared lesson language", tone: "trust" },
    ],
    lesson: {
      details: ["Escalation trail visible", "Cross-role notes preserved"],
      endAtUtc: "2026-04-24T17:48:00Z",
      startAtUtc: "2026-04-24T17:00:00Z",
      status: "pending",
      title: "Operational handoff for interrupted lesson",
    },
    need: {
      label: "Review context",
      mode: "readOnly",
      qualifiers: [
        { label: "Math AA HL" },
        { label: "Urgent follow-up" },
        { label: "Escalated continuity", priority: "support" },
      ],
      state: "locked",
      statement: "Missed lesson recovery",
    },
    notice: "State and proof still need explicit text, not color-only shortcuts, even in moderation and reference-data tools.",
    noticeTone: "warning",
    person: {
      badges: [
        { label: "Reviewed", tone: "trust" },
        { label: "Open case", tone: "warning" },
      ],
      descriptor: "Moderator handling cross-role continuity review",
      eyebrow: "Internal review",
      meta: ["Warsaw", "Shared thread visible", "Needs documented next step"],
      name: "Nora Patel",
      state: "verified",
      variant: "operational",
    },
    states: {
      empty: {
        description: "Reference queues should explain what has not arrived yet and what the fallback path is.",
        hints: ["Clear owner", "Next refresh time"],
        title: "No escalations waiting",
      },
      error: {
        description: "Operational errors still use the same shared card language instead of a new internal-only alert shell.",
        hints: ["Retry sync", "Preserve last known context"],
        title: "Continuity feed unavailable",
      },
      loading: {
        description: "Loading previews keep structure visible so reviewers know whether they are waiting on a lesson, a person, or a system event.",
        hints: ["Lesson context first", "State text stays visible"],
        title: "Refreshing moderation queue",
      },
    },
    title: "Clear operational hierarchy for dense tools",
  },
  student: {
    body: "Student-facing surfaces stay warm and spacious so context remains visible while the next action moves closer on smaller screens.",
    contextChips: [
      { label: "Biology HL", tone: "info" },
      { label: "Paper 2 planning", tone: "positive" },
      { label: "Need follow-up before Friday", tone: "warning" },
    ],
    lesson: {
      details: ["Trial request", "48-minute slot", "Policy review still visible"],
      endAtUtc: "2026-04-24T17:18:00Z",
      startAtUtc: "2026-04-24T16:30:00Z",
      status: "upcoming",
      title: "Paper 2 revision sprint",
    },
    need: {
      label: "Current need",
      mode: "editable",
      qualifiers: [
        { label: "Biology HL" },
        { label: "IA structure" },
        { label: "Evening support" },
        { label: "Warsaw timezone", priority: "support" },
      ],
      state: "active",
      statement: "Calm Paper 2 revision plan",
    },
    notice: "The shared pill grammar keeps navigation and state compact without losing clarity.",
    noticeTone: "info",
    person: {
      badges: [
        { label: "Verified tutor", tone: "trust" },
        { label: "Evening match", tone: "positive" },
      ],
      descriptor: "Best for structured revision and IA checkpoint planning",
      eyebrow: "Tutor match",
      meta: ["London timezone overlap", "English and Polish", "89 completed lessons"],
      name: "Maya Chen",
      state: "verified",
      variant: "standard",
    },
    states: {
      empty: {
        description: "When there are no messages or lessons yet, the screen should still hold the booking context and offer the next clear step.",
        hints: ["Open messages", "Review lesson request"],
        title: "No thread started yet",
      },
      error: {
        description: "Students should never lose the person or lesson frame just because the feed failed.",
        hints: ["Retry sync", "Keep booking reference visible"],
        title: "Messages could not load",
      },
      loading: {
        description: "Loading copy explains what is arriving next instead of showing anonymous gray boxes alone.",
        hints: ["Thread list", "Lesson context", "Latest status"],
        title: "Preparing your lesson context",
      },
    },
    title: "Warm guidance for decision-heavy flows",
  },
  tutor: {
    body: "Tutor mode keeps the same visual DNA while tightening density for schedule, lesson, and readiness work.",
    contextChips: [
      { label: "Student goal clarified", tone: "positive" },
      { label: "Reschedule path ready", tone: "trust" },
      { label: "Timezone translation visible", tone: "info" },
    ],
    lesson: {
      details: ["Follow-up note included", "Join link pending"],
      endAtUtc: "2026-04-24T17:18:00Z",
      startAtUtc: "2026-04-24T16:30:00Z",
      status: "accepted",
      title: "Biology HL strategy lesson",
    },
    need: {
      label: "Request context",
      mode: "readOnly",
      qualifiers: [
        { label: "Biology HL" },
        { label: "IA structure" },
        { label: "Student prefers evening" },
      ],
      state: "locked",
      statement: "Paper 2 revision and IA checkpoint",
    },
    notice: "Long-form inputs stay generous for applications, availability notes, and operational follow-up.",
    noticeTone: "success",
    person: {
      badges: [
        { label: "Active student", tone: "positive" },
        { label: "First lesson", tone: "info" },
      ],
      descriptor: "Needs a calmer revision sequence before next checkpoint",
      eyebrow: "Student context",
      meta: ["Warsaw timezone", "Biology HL", "Next school milestone on Monday"],
      name: "Lena Nowak",
      state: "new",
      variant: "operational",
    },
    states: {
      empty: {
        description: "Tutor empty states should still point toward the next operational action without switching to a different visual system.",
        hints: ["Confirm availability", "Check active requests"],
        title: "No unread lesson threads",
      },
      error: {
        description: "An operational issue still uses the same continuity shell so the tutor does not lose the student and lesson frame.",
        hints: ["Retry fetch", "Open lesson hub"],
        title: "Lesson thread stalled",
      },
      loading: {
        description: "Loading states keep the object hierarchy intact while tutor-side schedule and lesson data refresh.",
        hints: ["Student summary", "Next action", "Lesson status"],
        title: "Refreshing tutor overview",
      },
    },
    title: "Operational density without a second design language",
  },
};

export function FoundationPreview() {
  const [activeMode, setActiveMode] = useState<PreviewMode>("student");
  const timezone = useDetectedTimezone("UTC");
  const activePanelId = `foundation-${activeMode}-panel`;
  const copy = PREVIEW_COPY[activeMode];

  return (
    <div className={styles.grid}>
      <Panel
        description="This review surface exercises the shared primitives and state styling defined in P1-FOUND-002."
        title="Primitive review surface"
        tone="raised"
      >
        <TabBar
          activeId={activeMode}
          ariaLabel="Foundation preview modes"
          items={PREVIEW_TABS.map((item) => ({ ...item }))}
          onChange={(id) => setActiveMode(id as PreviewMode)}
        />

        <div
          aria-labelledby={`${activePanelId}-tab`}
          className={styles.tabPanel}
          id={activePanelId}
          role="tabpanel"
        >
          <div className={styles.identityBlock}>
            <Avatar name="Nora Patel" size="lg" />

            <div className={styles.identityText}>
              <h3 className={styles.identityTitle}>{copy.title}</h3>
              <p className={styles.identityCopy}>{copy.body}</p>
            </div>
          </div>

          <div className={styles.badges}>
            <StatusBadge tone="positive">Available</StatusBadge>
            <StatusBadge tone="warning">Pending</StatusBadge>
            <StatusBadge tone="trust">Reviewed</StatusBadge>
            <StatusBadge tone="destructive">Blocked</StatusBadge>
          </div>

          <div className={styles.actions}>
            <Button>Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
          </div>

          <InlineNotice title="State review" tone={copy.noticeTone}>
            <p>{copy.notice}</p>
          </InlineNotice>
        </div>
      </Panel>

      <Panel
        description="Visible labels, support text, and explicit error copy stay consistent across the first form controls."
        title="Field grammar"
        tone="soft"
      >
        <form className={styles.form}>
          <TextField
            defaultValue="Biology HL exam prep"
            description="Shared controls keep warm surfaces and crisp focus-visible treatment."
            label="Student goal"
          />

          <SelectField
            defaultValue=""
            error="Choose a format so the state stays explicit rather than implied by color alone."
            label="Lesson format"
            labelMeta="Required"
          >
            <option disabled value="">
              Select a format
            </option>
            <option value="online">Online</option>
            <option value="in-person">In person</option>
            <option value="hybrid">Hybrid</option>
          </SelectField>

          <Textarea
            defaultValue="Need a calm revision plan for Paper 2 and a clearer IA structure before the next checkpoint."
            description="Long-form inputs stay generous for tutor applications, notes, and support requests."
            label="Session context"
            variant="longForm"
          />
        </form>
      </Panel>

      <Panel
        description="Continuity anchors stay reusable across student and tutor contexts without forking the base identity or lesson grammar."
        title="Continuity anchors"
        tone="mist"
      >
        <div className={styles.continuityStack}>
          <NeedSummaryBar
            label={copy.need.label}
            mode={copy.need.mode}
            need={copy.need.statement}
            qualifiers={copy.need.qualifiers}
            state={copy.need.state}
            variant={activeMode === "student" ? "standard" : "stacked"}
          />

          <PersonSummary
            badges={copy.person.badges}
            descriptor={copy.person.descriptor}
            eyebrow={copy.person.eyebrow}
            meta={copy.person.meta}
            name={copy.person.name}
            state={copy.person.state}
            variant={copy.person.variant}
          />

          <LessonSummary
            details={copy.lesson.details}
            person={
              <PersonSummary
                badges={copy.person.badges.slice(0, 1)}
                descriptor={copy.person.descriptor}
                meta={copy.person.meta.slice(0, 2)}
                name={copy.person.name}
                state={copy.person.state}
                variant="compact"
              />
            }
            schedule={formatUtcLessonRange(
              copy.lesson.startAtUtc,
              copy.lesson.endAtUtc,
              timezone,
            )}
            status={copy.lesson.status}
            timezone={formatTimezoneContext(timezone)}
            title={copy.lesson.title}
          />

          <ContextChipRow items={copy.contextChips} label="Shared context chips" />
        </div>
      </Panel>

      <Panel
        description="Empty, loading, and error states use one shared card grammar so pages do not need custom state shells."
        title="Common screen states"
        tone="warm"
      >
        <div className={styles.stateGrid}>
          <ScreenState
            description={copy.states.empty.description}
            hints={copy.states.empty.hints}
            kind="empty"
            title={copy.states.empty.title}
          />

          <ScreenState
            description={copy.states.loading.description}
            hints={copy.states.loading.hints}
            kind="loading"
            title={copy.states.loading.title}
          />

          <ScreenState
            description={copy.states.error.description}
            hints={copy.states.error.hints}
            kind="error"
            title={copy.states.error.title}
          />
        </div>
      </Panel>
    </div>
  );
}
