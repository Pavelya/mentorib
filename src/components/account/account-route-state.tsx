import { InlineNotice } from "@/components/ui";

type AccountRouteStateProps = {
  status: "account_error" | "auth_unavailable";
};

export function AccountRouteState({ status }: AccountRouteStateProps) {
  if (status === "auth_unavailable") {
    return (
      <InlineNotice title="Auth configuration required" tone="warning">
        <p>
          Shared account routes are unavailable until the Supabase auth environment
          variables are configured for this workspace.
        </p>
      </InlineNotice>
    );
  }

  return (
    <InlineNotice title="Account context unavailable" tone="warning">
      <p>
        We could not resolve this account surface yet. Refresh the page or sign in
        again to continue.
      </p>
    </InlineNotice>
  );
}
