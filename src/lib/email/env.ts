const DEFAULT_FROM_ADDRESS = "Mentor IB <notifications@mentorib.com>";
const DEFAULT_REPLY_TO_ADDRESS = "support@mentorib.com";

export function hasResendApiKey() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Transactional email is not configured. Set RESEND_API_KEY on the server.",
    );
  }

  return apiKey;
}

export function getTransactionalFromAddress() {
  return process.env.RESEND_FROM_ADDRESS?.trim() || DEFAULT_FROM_ADDRESS;
}

export function getTransactionalReplyToAddress() {
  return process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO_ADDRESS;
}
