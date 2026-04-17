"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type PublicErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicError(props: PublicErrorProps) {
  return <RouteFamilyError familyLabel="Public" {...props} />;
}
