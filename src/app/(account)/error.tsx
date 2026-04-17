"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type AccountErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AccountError(props: AccountErrorProps) {
  return <RouteFamilyError familyLabel="Account" {...props} />;
}
