import { RoutePlaceholder } from "@/components/shell/route-placeholder";

type InternalUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InternalUserPage({ params }: InternalUserPageProps) {
  const { id } = await params;

  return (
    <RoutePlaceholder
      routePath={`/internal/users/${id}`}
      phase="Phase 2"
      title="Internal user detail route shell"
      description={`Reserved internal user detail placeholder for "${id}".`}
    />
  );
}
