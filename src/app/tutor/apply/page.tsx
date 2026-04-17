import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorApplyPage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/apply"
      phase="Phase 2"
      title="Tutor application route shell"
      description="Reserved tutor application route included here only to preserve the approved topology."
      notes={[
        "The actual staged application experience belongs to P2-APPLY-001.",
      ]}
    />
  );
}
