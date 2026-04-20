"use client";

import { useState } from "react";

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
    notice: string;
    noticeTone: "info" | "success" | "warning";
    title: string;
  }
> = {
  internal: {
    body: "Internal surfaces stay readable and structured without drifting into generic admin gray shells.",
    notice: "State and proof still need explicit text, not color-only shortcuts, even in moderation and reference-data tools.",
    noticeTone: "warning",
    title: "Clear operational hierarchy for dense tools",
  },
  student: {
    body: "Student-facing surfaces stay warm and spacious so context remains visible while the next action moves closer on smaller screens.",
    notice: "The shared pill grammar keeps navigation and state compact without losing clarity.",
    noticeTone: "info",
    title: "Warm guidance for decision-heavy flows",
  },
  tutor: {
    body: "Tutor mode keeps the same visual DNA while tightening density for schedule, lesson, and readiness work.",
    notice: "Long-form inputs stay generous for applications, availability notes, and operational follow-up.",
    noticeTone: "success",
    title: "Operational density without a second design language",
  },
};

export function FoundationPreview() {
  const [activeMode, setActiveMode] = useState<PreviewMode>("student");
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
    </div>
  );
}
