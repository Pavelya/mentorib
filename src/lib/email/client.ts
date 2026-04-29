import { Resend } from "resend";

import { getResendApiKey } from "@/lib/email/env";

let resendClient: Resend | undefined;

export function createResendClient() {
  if (resendClient) {
    return resendClient;
  }

  resendClient = new Resend(getResendApiKey());

  return resendClient;
}
