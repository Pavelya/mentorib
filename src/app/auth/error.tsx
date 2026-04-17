"use client";

import { RouteFamilyError } from "@/components/shell/route-family-error";

type AuthErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AuthError(props: AuthErrorProps) {
  return <RouteFamilyError familyLabel="Auth" {...props} />;
}
