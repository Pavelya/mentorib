"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type TutorErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TutorError(props: TutorErrorProps) {
  return <RouteFamilyError familyLabel="Tutor" {...props} />;
}
