"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type StudentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudentError(props: StudentErrorProps) {
  return <RouteFamilyError familyLabel="Student" {...props} />;
}
