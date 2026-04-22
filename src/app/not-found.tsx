import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function GlobalNotFound() {
  return (
    <RoutePlaceholder
      routePath="*"
      phase="Phase 1"
      title="This route does not exist yet."
      titleAs="h1"
      description="The root not-found boundary is in place so missing routes fail in one shared product shell instead of in isolated route islands."
      links={[
        { href: "/", label: "Back to home" },
        { href: "/match", label: "Open match flow", tone: "ghost" },
      ]}
      notes={[
        "Public dynamic routes can still add their own route-local not-found handling.",
        "Private route families can later convert unauthorized object access into shaped 404 responses.",
      ]}
    />
  );
}
