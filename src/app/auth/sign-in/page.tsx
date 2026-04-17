import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function SignInPage() {
  return (
    <RoutePlaceholder
      routePath="/auth/sign-in"
      phase="Phase 1"
      title="Sign-in route shell"
      description="Placeholder sign-in route reserved for the magic-link and Google auth task."
      notes={[
        "No provider logic is implemented in the foundation scaffold.",
        "This page confirms the auth family layout and URL posture.",
      ]}
    />
  );
}
