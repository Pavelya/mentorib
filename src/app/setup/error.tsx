"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type SetupErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SetupError(props: SetupErrorProps) {
  return <RouteFamilyError familyLabel="Setup" {...props} />;
}
