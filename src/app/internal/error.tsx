"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type InternalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InternalError(props: InternalErrorProps) {
  return <RouteFamilyError familyLabel="Internal" {...props} />;
}
