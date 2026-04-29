import { render } from "@react-email/render";

import { createResendClient } from "@/lib/email/client";
import {
  getTransactionalFromAddress,
  getTransactionalReplyToAddress,
  hasResendApiKey,
} from "@/lib/email/env";
import { logEmailEvent } from "@/lib/email/logging";
import {
  TransactionalEmail,
  type TransactionalEmailProps,
} from "@/lib/email/templates/transactional-email";

export type TransactionalEmailSendInput = {
  contentTag: string;
  recipientEmail: string;
  subject: string;
  template: TransactionalEmailProps;
};

export type TransactionalEmailSendResult =
  | {
      outcome: "skipped";
      reason: "missing_api_key" | "missing_recipient";
    }
  | {
      outcome: "sent";
      providerMessageId: string;
    }
  | {
      outcome: "failed";
      errorCode: string;
      errorMessage: string;
      retryable: boolean;
    };

export async function sendTransactionalEmail(
  input: TransactionalEmailSendInput,
): Promise<TransactionalEmailSendResult> {
  if (!hasResendApiKey()) {
    logEmailEvent("warn", "transactional_email_skipped_unconfigured", {
      content_tag: input.contentTag,
    });
    return { outcome: "skipped", reason: "missing_api_key" };
  }

  const recipientEmail = input.recipientEmail.trim();

  if (!recipientEmail) {
    return { outcome: "skipped", reason: "missing_recipient" };
  }

  const html = await render(TransactionalEmail(input.template));
  const text = await render(TransactionalEmail(input.template), {
    plainText: true,
  });

  const client = createResendClient();

  try {
    const { data, error } = await client.emails.send({
      from: getTransactionalFromAddress(),
      to: [recipientEmail],
      replyTo: getTransactionalReplyToAddress(),
      subject: input.subject,
      html,
      text,
      tags: [{ name: "content", value: input.contentTag }],
    });

    if (error) {
      const errorCode = (error as { name?: string }).name ?? "resend_error";
      const errorMessage = error.message ?? "The email provider rejected the send.";

      logEmailEvent("error", "transactional_email_failed", {
        content_tag: input.contentTag,
        error_code: errorCode,
        error_message: errorMessage,
      });

      return {
        outcome: "failed",
        errorCode,
        errorMessage,
        retryable: isRetryableErrorName(errorCode),
      };
    }

    if (!data?.id) {
      return {
        outcome: "failed",
        errorCode: "missing_provider_message_id",
        errorMessage: "Email provider accepted the send but did not return an id.",
        retryable: true,
      };
    }

    return { outcome: "sent", providerMessageId: data.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown email send error";

    logEmailEvent("error", "transactional_email_threw", {
      content_tag: input.contentTag,
      error_message: errorMessage,
    });

    return {
      outcome: "failed",
      errorCode: "transport_exception",
      errorMessage,
      retryable: true,
    };
  }
}

const TERMINAL_RESEND_ERROR_NAMES = new Set<string>([
  "validation_error",
  "missing_api_key",
  "invalid_api_key",
  "invalid_from_address",
  "invalid_to_address",
  "missing_required_field",
]);

function isRetryableErrorName(errorCode: string) {
  return !TERMINAL_RESEND_ERROR_NAMES.has(errorCode);
}
