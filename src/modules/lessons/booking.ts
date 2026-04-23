import { createHash } from "node:crypto";

import type Stripe from "stripe";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { formatUtcDateTime, formatUtcLessonRange, getTimezoneLabel, resolveTimezone } from "@/lib/datetime";
import { createStripeServerClient, isStripeCheckoutConfigured } from "@/lib/stripe/server";
import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasRole, isRestrictedAccount } from "@/modules/accounts/account-state";
import { getMatchOptionLabel } from "@/modules/lessons/match-flow-options";

const BOOKING_NOTE_MAX_LENGTH = 600;
const CHECKOUT_CANCEL_STATE = "cancelled";
const CHECKOUT_SUCCESS_STATE = "success";
const DEFAULT_BOOKING_INCREMENT_MINUTES = 30;
const DEFAULT_BOOKING_LEAD_TIME_MINUTES = 480;
const DEFAULT_BUFFER_AFTER_MINUTES = 0;
const DEFAULT_BUFFER_BEFORE_MINUTES = 0;
const DEFAULT_BOOKING_REQUEST_EXPIRY_BUFFER_MINUTES = 120;
const DEFAULT_CURRENCY_CODE = "USD";
const DEFAULT_LESSON_DURATION_MINUTES = 48;
const MAX_BOOKING_ADVANCE_DAYS = 6;
const MAX_BOOKING_SLOTS = 12;
const PUBLIC_TUTOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIVE_LESSON_STATUSES = [
  "accepted",
  "draft_request",
  "in_progress",
  "pending",
  "upcoming",
] as const;

type BookingContextStatus =
  | "needs_learning_need"
  | "no_slots"
  | "not_accepting_requests"
  | "not_found"
  | "pricing_unavailable"
  | "ready";

type BookingContextSource = "match_candidate" | "public_profile";

type BookingOperationRecord = {
  actor_app_user_id: string;
  created_at: string;
  error_code: string | null;
  error_message: string | null;
  id: string;
  operation_key: string;
  operation_status: "cancelled" | "failed" | "started" | "succeeded";
  operation_type: string;
  request_fingerprint: string;
  updated_at: string;
};

type StudentProfileRecord = {
  id: string;
};

type LearningNeedRecord = {
  free_text_note: string | null;
  id: string;
  language_code: string;
  need_status: "active" | "archived" | "booked" | "draft" | "matched";
  need_type: string;
  session_frequency_intent: string | null;
  student_profile_id: string;
  subject_focus_area_id: string;
  subject_id: string;
  support_style: string | null;
  timezone: string;
  urgency_level: string;
};

type MatchCandidateRecord = {
  candidate_state:
    | "booked"
    | "candidate"
    | "compared"
    | "contacted"
    | "dismissed"
    | "shortlisted";
  id: string;
  match_run_id: string;
  tutor_profile_id: string;
};

type MatchRunRecord = {
  learning_need_id: string;
};

type TutorProfileRecord = {
  best_for_summary: string | null;
  display_name: string | null;
  headline: string | null;
  id: string;
  pricing_summary: string | null;
  public_slug: string | null;
};

type TutorLanguageCapabilityRecord = {
  language_code: string;
  tutor_profile_id: string;
};

type LanguageRecord = {
  display_name: string;
  language_code: string;
};

type SubjectRecord = {
  display_name: string;
  id: string;
  slug: string;
};

type FocusAreaRecord = {
  display_name: string;
  id: string;
  slug: string;
};

type SchedulePolicyRecord = {
  buffer_after_minutes: number;
  buffer_before_minutes: number;
  minimum_notice_minutes: number;
  timezone: string;
  tutor_profile_id: string;
  is_accepting_new_students: boolean;
};

type AvailabilityRuleRecord = {
  day_of_week: number;
  end_local_time: string;
  start_local_time: string;
  visibility_status: string;
  tutor_profile_id: string;
};

type AvailabilityOverrideRecord = {
  end_local_time: string | null;
  override_date: string;
  override_type: "blocked" | "edited_window" | "open_extra";
  start_local_time: string | null;
  tutor_profile_id: string;
};

type LessonConflictRecord = {
  id: string;
  lesson_status: string;
  scheduled_end_at: string;
  scheduled_start_at: string;
};

type LessonRecord = {
  booking_operation_id: string;
  cancelled_at: string | null;
  id: string;
  learning_need_id: string;
  lesson_status:
    | "accepted"
    | "cancelled"
    | "completed"
    | "declined"
    | "draft_request"
    | "in_progress"
    | "pending"
    | "reviewed"
    | "upcoming";
  match_candidate_id: string | null;
  price_amount: number;
  request_expires_at: string;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_profile_id: string;
  tutor_profile_id: string;
};

type PaymentRecord = {
  amount: number;
  authorization_operation_id: string;
  authorization_expires_at: string | null;
  authorized_at: string | null;
  capture_cancelled_at: string | null;
  currency_code: string;
  id: string;
  lesson_id: string;
  payment_status: "authorized" | "cancelled" | "failed" | "paid" | "pending" | "refunded";
  provider_idempotency_key: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type BookingOperationUpdate = Pick<
  MentorIbDatabase["public"]["Tables"]["booking_operations"]["Update"],
  "error_code" | "error_message" | "operation_status"
>;

type LessonUpdate = Pick<
  MentorIbDatabase["public"]["Tables"]["lessons"]["Update"],
  "cancelled_at" | "lesson_status"
>;

type PaymentUpdate = Pick<
  MentorIbDatabase["public"]["Tables"]["payments"]["Update"],
  | "authorization_expires_at"
  | "authorized_at"
  | "capture_cancelled_at"
  | "payment_status"
  | "stripe_checkout_session_id"
  | "stripe_payment_intent_id"
>;

type LearningNeedUpdate = Pick<
  MentorIbDatabase["public"]["Tables"]["learning_needs"]["Update"],
  "need_status"
>;

type MatchCandidateUpdate = Pick<
  MentorIbDatabase["public"]["Tables"]["match_candidates"]["Update"],
  "candidate_state"
>;

type LessonStatusHistoryInsert =
  MentorIbDatabase["public"]["Tables"]["lesson_status_history"]["Insert"];

export type BookingSlotOption = {
  endAt: string;
  label: string;
  requestExpiresLabel: string;
  secondaryLabel: string;
  startAt: string;
};

type BookingTutorSummaryDto = {
  acceptingNewStudents: boolean;
  bestForSummary: string | null;
  displayName: string;
  headline: string | null;
  languages: string[];
  pricingSummary: string | null;
  profileHref: `/tutors/${string}` | null;
  timezone: string;
};

type BookingNeedSummaryDto = {
  headline: string;
  note: string | null;
  qualifiers: Array<{
    label: string;
    priority?: "default" | "support";
  }>;
  status: LearningNeedRecord["need_status"];
  timezone: string;
};

export type BookingContextDto = {
  bookingPolicy: string[];
  context: string;
  currencyCode: string;
  notePrefill: string;
  priceLabel: string | null;
  sessionDurationMinutes: number;
  slotOptions: BookingSlotOption[];
  source: BookingContextSource | null;
  status: BookingContextStatus;
  tutor: BookingTutorSummaryDto | null;
  need: BookingNeedSummaryDto | null;
};

export type BookingRequestOutcomeDto = {
  lessonStatus: string;
  paymentStatus: string;
  priceLabel: string;
  requestExpiresLabel: string;
  scheduledLabel: string;
  tutorName: string;
};

type ResolvedBookingContext = {
  currencyCode: string;
  learningNeed: LearningNeedRecord;
  matchCandidateId: string | null;
  notePrefill: string;
  priceAmount: number | null;
  priceLabel: string | null;
  schedulePolicy: SchedulePolicyRecord;
  slotOptions: BookingSlotOption[];
  source: BookingContextSource;
  studentProfile: StudentProfileRecord;
  subject: SubjectRecord;
  focusArea: FocusAreaRecord;
  tutor: TutorProfileRecord;
  tutorLanguages: string[];
  language: LanguageRecord;
};

type ReadyResolvedBookingContext = ResolvedBookingContext & {
  priceAmount: number;
  priceLabel: string;
};

type BookingStartInput = {
  context: string;
  note: string;
  operationKey: string;
  origin: string;
  slotStartAt: string;
};

type BookingStartResult =
  | {
      checkoutUrl: string;
      kind: "checkout";
    }
  | {
      kind: "success_redirect";
      redirectPath: string;
    };

type ExistingDraftBundle = {
  lesson: LessonRecord;
  payment: PaymentRecord;
  paymentOperation: BookingOperationRecord;
  requestOperation: BookingOperationRecord;
  tutor: TutorProfileRecord | null;
};

type TimeWindow = {
  endMinutes: number;
  startMinutes: number;
};

type ZonedDateParts = {
  date: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
};

export class BookingCommandError extends Error {
  code: string;
  fieldErrors: Partial<Record<"note" | "slotStartAt", string>>;

  constructor(
    code: string,
    message: string,
    fieldErrors: Partial<Record<"note" | "slotStartAt", string>> = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function isBookingContextNotFound(context: BookingContextDto) {
  return context.status === "not_found";
}

export async function getStudentBookingContext(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
  context: string,
): Promise<BookingContextDto> {
  const studentProfile = await resolveStudentProfile(account.id);

  if (!studentProfile) {
    return buildEmptyBookingContext(context, "needs_learning_need");
  }

  if (isUuidContext(context)) {
    const candidateContext = await resolveCandidateBookingContext(studentProfile.id, context);

    if (!candidateContext) {
      return buildEmptyBookingContext(context, "not_found");
    }

    return buildBookingContextDto(account.timezone, candidateContext);
  }

  const normalizedSlug = normalizePublicTutorSlug(context);

  if (!normalizedSlug) {
    return buildEmptyBookingContext(context, "not_found");
  }

  const publicProfileContext = await resolvePublicTutorBookingContext(studentProfile.id, normalizedSlug);

  if (!publicProfileContext) {
    return buildEmptyBookingContext(context, "not_found");
  }

  if (!publicProfileContext.learningNeed) {
    return {
      ...buildEmptyBookingContext(context, "needs_learning_need"),
      source: "public_profile",
      tutor: buildTutorSummaryDto(
        publicProfileContext.tutor,
        publicProfileContext.schedulePolicy,
        publicProfileContext.tutorLanguages,
      ),
    };
  }

  if (
    !publicProfileContext.subject ||
    !publicProfileContext.focusArea ||
    !publicProfileContext.language
  ) {
    return buildEmptyBookingContext(context, "not_found");
  }

  return buildBookingContextDto(account.timezone, {
    currencyCode: DEFAULT_CURRENCY_CODE,
    focusArea: publicProfileContext.focusArea,
    language: publicProfileContext.language,
    learningNeed: publicProfileContext.learningNeed,
    matchCandidateId: null,
    notePrefill: normalizeOptionalText(publicProfileContext.learningNeed.free_text_note, BOOKING_NOTE_MAX_LENGTH) ?? "",
    priceAmount: publicProfileContext.priceAmount,
    priceLabel: publicProfileContext.priceLabel,
    schedulePolicy: publicProfileContext.schedulePolicy,
    slotOptions: publicProfileContext.slotOptions,
    source: "public_profile",
    studentProfile,
    subject: publicProfileContext.subject,
    tutor: publicProfileContext.tutor,
    tutorLanguages: publicProfileContext.tutorLanguages,
  });
}

export async function startBookingRequestCheckout(
  account: ResolvedAuthAccount,
  input: BookingStartInput,
): Promise<BookingStartResult> {
  if (!isStripeCheckoutConfigured()) {
    throw new BookingCommandError(
      "stripe_unconfigured",
      "Booking checkout is unavailable until Stripe is configured on the server.",
    );
  }

  if (isRestrictedAccount(account)) {
    throw new BookingCommandError(
      "account_restricted",
      "This account cannot request a lesson right now.",
    );
  }

  if (!hasRole(account, "student")) {
    throw new BookingCommandError(
      "student_role_required",
      "Switch to a student account before requesting a lesson.",
    );
  }

  if (!input.operationKey.trim()) {
    throw new BookingCommandError(
      "missing_operation_key",
      "We couldn't secure this request. Refresh the page and try again.",
    );
  }

  const note = normalizeOptionalText(input.note, BOOKING_NOTE_MAX_LENGTH) ?? "";
  const bookingContext = await getResolvedBookingContext(account, input.context);

  if (!bookingContext) {
    const viewContext = await getStudentBookingContext(account, input.context);

    switch (viewContext.status) {
      case "needs_learning_need":
        throw new BookingCommandError(
          "needs_learning_need",
          "Start with your current learning need before requesting a lesson.",
        );
      case "not_accepting_requests":
        throw new BookingCommandError(
          "not_accepting_requests",
          "This tutor isn't taking new lesson requests right now.",
        );
      case "pricing_unavailable":
        throw new BookingCommandError(
          "pricing_unavailable",
          "This tutor can't be booked yet because pricing is still incomplete.",
        );
      case "no_slots":
        throw new BookingCommandError(
          "slot_unavailable",
          "This time is no longer available. Choose another slot.",
          {
            slotStartAt: "Choose one of the currently available lesson times.",
          },
        );
      default:
        throw new BookingCommandError(
          "not_found",
          "We couldn't prepare this booking. Please return to the tutor profile and try again.",
        );
    }
  }

  const selectedSlot = bookingContext.slotOptions.find((slot) => slot.startAt === input.slotStartAt);

  if (!selectedSlot) {
    throw new BookingCommandError(
      "slot_unavailable",
      "This time is no longer available. Choose another slot.",
      {
        slotStartAt: "Choose one of the currently available lesson times.",
      },
    );
  }

  const fingerprint = buildRequestFingerprint({
    context: input.context,
    note,
    slotStartAt: selectedSlot.startAt,
    studentProfileId: bookingContext.studentProfile.id,
    tutorProfileId: bookingContext.tutor.id,
  });
  const requestOperation = await ensureBookingOperation({
    actorAppUserId: account.id,
    operationKey: input.operationKey,
    operationType: "lesson_request_create",
    requestFingerprint: fingerprint,
  });
  const paymentOperation = await ensureBookingOperation({
    actorAppUserId: account.id,
    operationKey: buildPaymentOperationKey(input.operationKey),
    operationType: "payment_authorize",
    requestFingerprint: fingerprint,
  });
  const existingBundle = await loadExistingDraftBundle(account.id, input.context, input.operationKey);

  if (
    existingBundle?.lesson.lesson_status === "pending" &&
    existingBundle.payment.payment_status === "authorized"
  ) {
    return {
      kind: "success_redirect",
      redirectPath: buildBookingResultPath(input.context, CHECKOUT_SUCCESS_STATE, input.operationKey),
    };
  }

  const draftBundle =
    existingBundle ??
    (await ensureDraftLessonAndPayment({
      accountId: account.id,
      bookingContext,
      note,
      paymentOperation,
      requestOperation,
      selectedSlot,
    }));

  if (draftBundle.payment.stripe_checkout_session_id) {
    const existingCheckoutUrl = await getReusableCheckoutUrl(draftBundle.payment.stripe_checkout_session_id);

    if (existingCheckoutUrl) {
      return {
        checkoutUrl: existingCheckoutUrl,
        kind: "checkout",
      };
    }
  }

  const checkoutSession = await createCheckoutSession({
    accountEmail: account.email,
    bookingContext,
    context: input.context,
    lesson: draftBundle.lesson,
    note,
    operationKey: input.operationKey,
    origin: input.origin,
    payment: draftBundle.payment,
  });

  if (!checkoutSession.url) {
    throw new BookingCommandError(
      "checkout_unavailable",
      "We couldn't open the payment authorization step. Please try again.",
    );
  }

  await updatePaymentCheckoutSession(draftBundle.payment.id, {
    stripeCheckoutSessionId: checkoutSession.id,
    stripePaymentIntentId: getStripePaymentIntentId(checkoutSession.payment_intent),
  });

  return {
    checkoutUrl: checkoutSession.url,
    kind: "checkout",
  };
}

export async function finalizeBookingCheckoutReturn(
  account: Pick<ResolvedAuthAccount, "id">,
  context: string,
  operationKey: string,
  sessionId: string,
): Promise<BookingRequestOutcomeDto> {
  const studentProfile = await resolveStudentProfile(account.id);

  if (!studentProfile) {
    throw new BookingCommandError("not_found", "Booking return context is no longer available.");
  }

  const bundle = await loadExistingDraftBundle(account.id, context, operationKey);

  if (!bundle || bundle.lesson.student_profile_id !== studentProfile.id) {
    throw new BookingCommandError("not_found", "Booking return context is no longer available.");
  }

  if (
    bundle.lesson.lesson_status === "pending" &&
    bundle.payment.payment_status === "authorized"
  ) {
    return buildBookingRequestOutcome(bundle.lesson, bundle.payment, bundle.tutor);
  }

  if (!bundle.payment.stripe_checkout_session_id || bundle.payment.stripe_checkout_session_id !== sessionId) {
    throw new BookingCommandError(
      "checkout_session_mismatch",
      "The booking return could not be verified safely.",
    );
  }

  const stripe = createStripeServerClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const paymentIntent = resolveExpandedPaymentIntent(checkoutSession.payment_intent);

  if (!paymentIntent || paymentIntent.status !== "requires_capture") {
    throw new BookingCommandError(
      "payment_authorization_unconfirmed",
      "We couldn't verify the payment authorization yet. Please try again in a moment.",
    );
  }

  const authorizedAt = new Date().toISOString();

  await updateBookingOperation(bundle.requestOperation.id, {
    error_code: null,
    error_message: null,
    operation_status: "succeeded",
  });
  await updateBookingOperation(bundle.paymentOperation.id, {
    error_code: null,
    error_message: null,
    operation_status: "succeeded",
  });
  await updateLesson(bundle.lesson.id, {
    lesson_status: "pending",
  });
  await upsertLessonStatusHistory({
    bookingOperationId: bundle.paymentOperation.id,
    changeReason: "payment_authorized",
    fromStatus: "draft_request",
    lessonId: bundle.lesson.id,
    toStatus: "pending",
    userId: account.id,
  });
  await updatePayment(bundle.payment.id, {
    authorization_expires_at: bundle.lesson.request_expires_at,
    authorized_at: authorizedAt,
    payment_status: "authorized",
    stripe_payment_intent_id: paymentIntent.id,
  });
  await updateLearningNeed(bundle.lesson.learning_need_id, {
    need_status: "booked",
  });

  if (bundle.lesson.match_candidate_id) {
    await updateMatchCandidate(bundle.lesson.match_candidate_id, {
      candidate_state: "booked",
    });
  }

  const finalBundle = await loadExistingDraftBundle(account.id, context, operationKey);

  if (!finalBundle || !finalBundle.tutor) {
    throw new BookingCommandError(
      "booking_reload_failed",
      "The booking request was authorized, but we couldn't refresh the final state.",
    );
  }

  return buildBookingRequestOutcome(finalBundle.lesson, finalBundle.payment, finalBundle.tutor);
}

export async function cancelBookingCheckoutReturn(
  account: Pick<ResolvedAuthAccount, "id">,
  context: string,
  operationKey: string,
) {
  const studentProfile = await resolveStudentProfile(account.id);

  if (!studentProfile) {
    return;
  }

  const bundle = await loadExistingDraftBundle(account.id, context, operationKey);

  if (!bundle || bundle.lesson.student_profile_id !== studentProfile.id) {
    return;
  }

  if (
    bundle.lesson.lesson_status === "pending" &&
    bundle.payment.payment_status === "authorized"
  ) {
    return;
  }

  if (
    bundle.lesson.lesson_status === "cancelled" &&
    bundle.payment.payment_status === "cancelled"
  ) {
    return;
  }

  const cancelledAt = new Date().toISOString();

  await updateBookingOperation(bundle.requestOperation.id, {
    error_code: "checkout_cancelled",
    error_message: "Student cancelled the Stripe Checkout authorization flow.",
    operation_status: "cancelled",
  });
  await updateBookingOperation(bundle.paymentOperation.id, {
    error_code: "checkout_cancelled",
    error_message: "Student cancelled the Stripe Checkout authorization flow.",
    operation_status: "cancelled",
  });
  await updateLesson(bundle.lesson.id, {
    cancelled_at: cancelledAt,
    lesson_status: "cancelled",
  });
  await upsertLessonStatusHistory({
    bookingOperationId: bundle.paymentOperation.id,
    changeReason: "checkout_cancelled",
    fromStatus: bundle.lesson.lesson_status,
    lessonId: bundle.lesson.id,
    toStatus: "cancelled",
    userId: account.id,
  });
  await updatePayment(bundle.payment.id, {
    capture_cancelled_at: cancelledAt,
    payment_status: "cancelled",
  });
}

export async function getBookingRequestOutcome(
  account: Pick<ResolvedAuthAccount, "id">,
  context: string,
  operationKey: string | null,
): Promise<BookingRequestOutcomeDto | null> {
  if (!operationKey) {
    return null;
  }

  const bundle = await loadExistingDraftBundle(account.id, context, operationKey);

  if (!bundle || !bundle.tutor) {
    return null;
  }

  if (
    bundle.lesson.lesson_status === "pending" &&
    bundle.payment.payment_status === "authorized"
  ) {
    return buildBookingRequestOutcome(bundle.lesson, bundle.payment, bundle.tutor);
  }

  return null;
}

function buildEmptyBookingContext(
  context: string,
  status: Exclude<BookingContextStatus, "ready">,
): BookingContextDto {
  return {
    bookingPolicy: buildBookingPolicyLines(DEFAULT_BOOKING_LEAD_TIME_MINUTES),
    context,
    currencyCode: DEFAULT_CURRENCY_CODE,
    notePrefill: "",
    priceLabel: null,
    sessionDurationMinutes: DEFAULT_LESSON_DURATION_MINUTES,
    slotOptions: [],
    source: null,
    status,
    tutor: null,
    need: null,
  };
}

async function getResolvedBookingContext(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
  context: string,
): Promise<ReadyResolvedBookingContext | null> {
  const studentProfile = await resolveStudentProfile(account.id);

  if (!studentProfile) {
    return null;
  }

  let resolvedContext: ResolvedBookingContext | null = null;

  if (isUuidContext(context)) {
    resolvedContext = await resolveCandidateBookingContext(studentProfile.id, context);
  } else {
    const normalizedSlug = normalizePublicTutorSlug(context);

    if (!normalizedSlug) {
      return null;
    }

    const publicContext = await resolvePublicTutorBookingContext(studentProfile.id, normalizedSlug);

    if (!publicContext?.learningNeed) {
      return null;
    }

    if (!publicContext.subject || !publicContext.focusArea || !publicContext.language) {
      return null;
    }

    resolvedContext = {
      currencyCode: DEFAULT_CURRENCY_CODE,
      focusArea: publicContext.focusArea,
      language: publicContext.language,
      learningNeed: publicContext.learningNeed,
      matchCandidateId: null,
      notePrefill: normalizeOptionalText(publicContext.learningNeed.free_text_note, BOOKING_NOTE_MAX_LENGTH) ?? "",
      priceAmount: publicContext.priceAmount,
      priceLabel: publicContext.priceLabel,
      schedulePolicy: publicContext.schedulePolicy,
      slotOptions: publicContext.slotOptions,
      source: "public_profile",
      studentProfile,
      subject: publicContext.subject,
      tutor: publicContext.tutor,
      tutorLanguages: publicContext.tutorLanguages,
    };
  }

  if (!resolvedContext) {
    return null;
  }

  const dto = buildBookingContextDto(account.timezone, resolvedContext);

  if (dto.status !== "ready" || resolvedContext.priceAmount === null || resolvedContext.priceLabel === null) {
    return null;
  }

  return {
    ...resolvedContext,
    priceAmount: resolvedContext.priceAmount,
    priceLabel: resolvedContext.priceLabel,
  };
}

async function resolveCandidateBookingContext(
  studentProfileId: string,
  candidateId: string,
): Promise<ResolvedBookingContext | null> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: candidate, error: candidateError } = await serviceRoleClient
    .from("match_candidates")
    .select("id, candidate_state, match_run_id, tutor_profile_id")
    .eq("id", candidateId)
    .maybeSingle<MatchCandidateRecord>();

  if (candidateError || !candidate || candidate.candidate_state === "dismissed") {
    return null;
  }

  const { data: matchRun, error: matchRunError } = await serviceRoleClient
    .from("match_runs")
    .select("learning_need_id")
    .eq("id", candidate.match_run_id)
    .maybeSingle<MatchRunRecord>();

  if (matchRunError || !matchRun) {
    return null;
  }

  const learningNeed = await loadLearningNeedById(matchRun.learning_need_id);

  if (!learningNeed || learningNeed.student_profile_id !== studentProfileId) {
    return null;
  }

  return resolveSharedBookingContext({
    learningNeed,
    matchCandidateId: candidate.id,
    source: "match_candidate",
    studentProfileId,
    tutorProfileId: candidate.tutor_profile_id,
  });
}

async function resolvePublicTutorBookingContext(
  studentProfileId: string,
  slug: string,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: tutor, error: tutorError } = await serviceRoleClient
    .from("tutor_profiles")
    .select("id, display_name, public_slug, headline, best_for_summary, pricing_summary")
    .eq("public_slug", slug)
    .eq("application_status", "approved")
    .eq("profile_visibility_status", "public_visible")
    .eq("public_listing_status", "listed")
    .maybeSingle<TutorProfileRecord>();

  if (tutorError || !tutor) {
    return null;
  }

  const learningNeed = await loadLatestBookableLearningNeed(studentProfileId);

  if (!learningNeed) {
    const schedulePolicy = await loadSchedulePolicy(tutor.id);
    const tutorLanguages = await loadTutorLanguageNames(tutor.id);

    return {
      learningNeed: null,
      priceAmount: 0,
      priceLabel: tutor.pricing_summary ?? null,
      schedulePolicy,
      slotOptions: [],
      subject: null,
      focusArea: null,
      tutor,
      tutorLanguages,
      language: null,
    };
  }

  const resolvedContext = await resolveSharedBookingContext({
    learningNeed,
    matchCandidateId: null,
    source: "public_profile",
    studentProfileId,
    tutorProfileId: tutor.id,
  });

  if (!resolvedContext) {
    return null;
  }

  return resolvedContext;
}

async function resolveSharedBookingContext({
  learningNeed,
  matchCandidateId,
  source,
  studentProfileId,
  tutorProfileId,
}: {
  learningNeed: LearningNeedRecord;
  matchCandidateId: string | null;
  source: BookingContextSource;
  studentProfileId: string;
  tutorProfileId: string;
}) {
  const [subject, focusArea, language, tutor, schedulePolicy, tutorLanguages] =
    await Promise.all([
      loadSubjectById(learningNeed.subject_id),
      loadFocusAreaById(learningNeed.subject_focus_area_id),
      loadLanguageByCode(learningNeed.language_code),
      loadTutorProfileById(tutorProfileId),
      loadSchedulePolicy(tutorProfileId),
      loadTutorLanguageNames(tutorProfileId),
    ]);

  if (!subject || !focusArea || !language || !tutor) {
    return null;
  }

  const scheduleRange = buildBookingRangeWindow(schedulePolicy.minimum_notice_minutes);
  const [availabilityRules, availabilityOverrides, tutorConflicts, studentConflicts] =
    await Promise.all([
      loadAvailabilityRules(tutor.id),
      loadAvailabilityOverrides(tutor.id, scheduleRange.start, scheduleRange.end),
      loadLessonConflicts({
        participantColumn: "tutor_profile_id",
        participantId: tutor.id,
        rangeEnd: scheduleRange.end.toISOString(),
        rangeStart: scheduleRange.start.toISOString(),
      }),
      loadLessonConflicts({
        participantColumn: "student_profile_id",
        participantId: studentProfileId,
        rangeEnd: scheduleRange.end.toISOString(),
        rangeStart: scheduleRange.start.toISOString(),
      }),
    ]);
  const slotOptions = generateBookableSlots({
    accountTimezone: learningNeed.timezone,
    availabilityOverrides,
    availabilityRules,
    schedulePolicy,
    studentConflicts,
    tutorConflicts,
  });
  const priceAmount = parsePriceAmount(tutor.pricing_summary);

  return {
    currencyCode: DEFAULT_CURRENCY_CODE,
    focusArea,
    language,
    learningNeed,
    matchCandidateId,
    notePrefill: normalizeOptionalText(learningNeed.free_text_note, BOOKING_NOTE_MAX_LENGTH) ?? "",
    priceAmount,
    priceLabel:
      priceAmount !== null
        ? formatCurrencyLabel(priceAmount, DEFAULT_CURRENCY_CODE)
        : tutor.pricing_summary ?? null,
    schedulePolicy,
    slotOptions,
    source,
    studentProfile: { id: studentProfileId },
    subject,
    tutor,
    tutorLanguages,
  };
}

function buildBookingContextDto(
  accountTimezone: string,
  resolvedContext: ResolvedBookingContext,
): BookingContextDto {
  const tutor = buildTutorSummaryDto(
    resolvedContext.tutor,
    resolvedContext.schedulePolicy,
    resolvedContext.tutorLanguages,
  );
  const need = buildNeedSummaryDto(
    resolvedContext.learningNeed,
    resolvedContext.subject,
    resolvedContext.focusArea,
    resolvedContext.language,
  );

  if (!resolvedContext.schedulePolicy.is_accepting_new_students) {
    return {
      bookingPolicy: buildBookingPolicyLines(resolvedContext.schedulePolicy.minimum_notice_minutes),
      context: isMatchCandidateSource(resolvedContext.source)
        ? resolvedContext.matchCandidateId ?? ""
        : resolvedContext.tutor.public_slug ?? "",
      currencyCode: resolvedContext.currencyCode,
      notePrefill: resolvedContext.notePrefill,
      priceLabel: resolvedContext.priceLabel,
      sessionDurationMinutes: DEFAULT_LESSON_DURATION_MINUTES,
      slotOptions: [],
      source: resolvedContext.source,
      status: "not_accepting_requests",
      tutor,
      need,
    };
  }

  if (resolvedContext.priceAmount === null) {
    return {
      bookingPolicy: buildBookingPolicyLines(resolvedContext.schedulePolicy.minimum_notice_minutes),
      context: isMatchCandidateSource(resolvedContext.source)
        ? resolvedContext.matchCandidateId ?? ""
        : resolvedContext.tutor.public_slug ?? "",
      currencyCode: resolvedContext.currencyCode,
      notePrefill: resolvedContext.notePrefill,
      priceLabel: resolvedContext.priceLabel,
      sessionDurationMinutes: DEFAULT_LESSON_DURATION_MINUTES,
      slotOptions: resolvedContext.slotOptions,
      source: resolvedContext.source,
      status: "pricing_unavailable",
      tutor,
      need,
    };
  }

  return {
    bookingPolicy: buildBookingPolicyLines(resolvedContext.schedulePolicy.minimum_notice_minutes),
    context: isMatchCandidateSource(resolvedContext.source)
      ? resolvedContext.matchCandidateId ?? ""
      : resolvedContext.tutor.public_slug ?? "",
    currencyCode: resolvedContext.currencyCode,
    notePrefill: resolvedContext.notePrefill,
    priceLabel: resolvedContext.priceLabel,
    sessionDurationMinutes: DEFAULT_LESSON_DURATION_MINUTES,
    slotOptions: resolvedContext.slotOptions.map((slot) => ({
      ...slot,
      label: slot.label,
      secondaryLabel: `${slot.secondaryLabel} · ${buildAccountTimezoneComparison(
        slot.startAt,
        accountTimezone,
      )}`,
    })),
    source: resolvedContext.source,
    status: resolvedContext.slotOptions.length > 0 ? "ready" : "no_slots",
    tutor,
    need,
  };
}

function buildTutorSummaryDto(
  tutor: TutorProfileRecord,
  schedulePolicy: SchedulePolicyRecord,
  tutorLanguages: string[],
): BookingTutorSummaryDto {
  return {
    acceptingNewStudents: schedulePolicy.is_accepting_new_students,
    bestForSummary: normalizeOptionalText(tutor.best_for_summary, 240),
    displayName: tutor.display_name?.trim() ?? "Mentor IB tutor",
    headline: normalizeOptionalText(tutor.headline, 160),
    languages: tutorLanguages,
    pricingSummary: normalizeOptionalText(tutor.pricing_summary, 120),
    profileHref: tutor.public_slug ? (`/tutors/${tutor.public_slug}` as const) : null,
    timezone: schedulePolicy.timezone,
  };
}

function buildNeedSummaryDto(
  learningNeed: LearningNeedRecord,
  subject: SubjectRecord,
  focusArea: FocusAreaRecord,
  language: LanguageRecord,
): BookingNeedSummaryDto {
  return {
    headline: `${subject.display_name} · ${focusArea.display_name}`,
    note: normalizeOptionalText(learningNeed.free_text_note, BOOKING_NOTE_MAX_LENGTH),
    qualifiers: [
      { label: getMatchOptionLabel("urgencyLevel", learningNeed.urgency_level) },
      {
        label: getMatchOptionLabel("sessionFrequencyIntent", learningNeed.session_frequency_intent ?? "one_off"),
      },
      { label: getMatchOptionLabel("supportStyle", learningNeed.support_style ?? "calm_structure") },
      { label: language.display_name },
      { label: getTimezoneLabel(learningNeed.timezone), priority: "support" },
    ],
    status: learningNeed.need_status,
    timezone: resolveTimezone(learningNeed.timezone),
  };
}

function buildBookingPolicyLines(minimumNoticeMinutes: number) {
  return [
    `Only slots at least ${Math.round(minimumNoticeMinutes / 60)} hours ahead are shown.`,
    "The tutor response window closes 2 hours before the lesson starts.",
    "Stripe places an authorization hold now and only captures it if the tutor accepts.",
  ];
}

function buildAccountTimezoneComparison(startAt: string, accountTimezone: string) {
  return `Your time · ${formatUtcDateTime(startAt, {
    dateStyle: "medium",
    timeStyle: "short",
    timezone: accountTimezone,
  })}`;
}

function buildRequestFingerprint({
  context,
  note,
  slotStartAt,
  studentProfileId,
  tutorProfileId,
}: {
  context: string;
  note: string;
  slotStartAt: string;
  studentProfileId: string;
  tutorProfileId: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        context,
        note,
        slotStartAt,
        studentProfileId,
        tutorProfileId,
      }),
      "utf8",
    )
    .digest("hex");
}

function buildPaymentOperationKey(operationKey: string) {
  return `${operationKey}:payment`;
}

async function ensureBookingOperation({
  actorAppUserId,
  operationKey,
  operationType,
  requestFingerprint,
}: {
  actorAppUserId: string;
  operationKey: string;
  operationType: "lesson_request_create" | "payment_authorize";
  requestFingerprint: string;
}) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("booking_operations")
    .insert({
      actor_app_user_id: actorAppUserId,
      operation_key: operationKey,
      operation_status: "started",
      operation_type: operationType,
      request_fingerprint: requestFingerprint,
    })
    .select("*")
    .single<BookingOperationRecord>();

  if (!error && data) {
    return data;
  }

  if (!isUniqueViolation(error)) {
    throw new BookingCommandError(
      "operation_create_failed",
      "We couldn't secure this booking attempt. Please try again.",
    );
  }

  const existingOperation = await getBookingOperationByKey(actorAppUserId, operationKey);

  if (existingOperation.request_fingerprint !== requestFingerprint) {
    throw new BookingCommandError(
      "operation_key_reused",
      "This booking attempt changed mid-flight. Refresh the page and try again.",
    );
  }

  if (existingOperation.operation_status === "failed") {
    await updateBookingOperation(existingOperation.id, {
      error_code: null,
      error_message: null,
      operation_status: "started",
    });

    return {
      ...existingOperation,
      error_code: null,
      error_message: null,
      operation_status: "started" as const,
    };
  }

  return existingOperation;
}

async function getBookingOperationByKey(actorAppUserId: string, operationKey: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("booking_operations")
    .select("*")
    .eq("actor_app_user_id", actorAppUserId)
    .eq("operation_key", operationKey)
    .maybeSingle<BookingOperationRecord>();

  if (error || !data) {
    throw new BookingCommandError(
      "operation_lookup_failed",
      "We couldn't recover the booking attempt safely. Please try again.",
    );
  }

  return data;
}

async function ensureDraftLessonAndPayment({
  accountId,
  bookingContext,
  note,
  paymentOperation,
  requestOperation,
  selectedSlot,
}: {
  accountId: string;
  bookingContext: ReadyResolvedBookingContext;
  note: string;
  paymentOperation: BookingOperationRecord;
  requestOperation: BookingOperationRecord;
  selectedSlot: BookingSlotOption;
}) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const subjectSnapshot = {
    id: bookingContext.subject.id,
    label: bookingContext.subject.display_name,
    slug: bookingContext.subject.slug,
  };
  const focusSnapshot = {
    id: bookingContext.focusArea.id,
    label: bookingContext.focusArea.display_name,
    slug: bookingContext.focusArea.slug,
  };
  const finalNote =
    normalizeOptionalText(note, BOOKING_NOTE_MAX_LENGTH) ??
    normalizeOptionalText(bookingContext.learningNeed.free_text_note, BOOKING_NOTE_MAX_LENGTH) ??
    null;
  const { data: lessonData, error: lessonError } = await serviceRoleClient
    .from("lessons")
    .insert({
      booking_operation_id: requestOperation.id,
      currency_code: bookingContext.currencyCode,
      is_trial: isTrialPricing(bookingContext.tutor.pricing_summary),
      learning_need_id: bookingContext.learningNeed.id,
      lesson_status: "draft_request",
      lesson_timezone: resolveTimezone(bookingContext.learningNeed.timezone),
      match_candidate_id: bookingContext.matchCandidateId,
      meeting_method: "external_video_call",
      price_amount: bookingContext.priceAmount,
      request_expires_at: subtractMinutes(
        new Date(selectedSlot.startAt),
        DEFAULT_BOOKING_REQUEST_EXPIRY_BUFFER_MINUTES,
      ).toISOString(),
      scheduled_end_at: selectedSlot.endAt,
      scheduled_start_at: selectedSlot.startAt,
      student_note_snapshot: finalNote,
      student_profile_id: bookingContext.studentProfile.id,
      subject_snapshot: subjectSnapshot,
      focus_snapshot: focusSnapshot,
      tutor_profile_id: bookingContext.tutor.id,
    })
    .select("*")
    .single<LessonRecord>();

  if (lessonError || !lessonData) {
    throw new BookingCommandError(
      "lesson_draft_failed",
      "We couldn't prepare the lesson request yet. Please try again.",
    );
  }

  await upsertLessonStatusHistory({
    bookingOperationId: requestOperation.id,
    changeReason: "checkout_started",
    fromStatus: null,
    lessonId: lessonData.id,
    toStatus: "draft_request",
    userId: accountId,
  });

  const providerIdempotencyKey = buildProviderIdempotencyKey(paymentOperation.id);
  const { data: paymentData, error: paymentError } = await serviceRoleClient
    .from("payments")
    .insert({
      amount: bookingContext.priceAmount,
      authorization_operation_id: paymentOperation.id,
      authorization_expires_at: lessonData.request_expires_at,
      currency_code: bookingContext.currencyCode,
      lesson_id: lessonData.id,
      payer_app_user_id: accountId,
      payment_status: "pending",
      provider: "stripe",
      provider_idempotency_key: providerIdempotencyKey,
    })
    .select("*")
    .single<PaymentRecord>();

  if (paymentError || !paymentData) {
    throw new BookingCommandError(
      "payment_draft_failed",
      "We couldn't prepare the payment authorization yet. Please try again.",
    );
  }

  return {
    lesson: lessonData,
    payment: paymentData,
    paymentOperation,
    requestOperation,
    tutor: bookingContext.tutor,
  };
}

async function createCheckoutSession({
  accountEmail,
  bookingContext,
  context,
  lesson,
  note,
  operationKey,
  origin,
  payment,
}: {
  accountEmail: string;
  bookingContext: ReadyResolvedBookingContext;
  context: string;
  lesson: LessonRecord;
  note: string;
  operationKey: string;
  origin: string;
  payment: PaymentRecord;
}) {
  const stripe = createStripeServerClient();
  const lessonLabel = formatUtcLessonRange(
    lesson.scheduled_start_at,
    lesson.scheduled_end_at,
    bookingContext.learningNeed.timezone,
  );
  const successUrl = buildCheckoutReturnUrl({
    context,
    origin,
    operationKey,
    state: CHECKOUT_SUCCESS_STATE,
    withSessionIdPlaceholder: true,
  });
  const cancelUrl = buildCheckoutReturnUrl({
    context,
    origin,
    operationKey,
    state: CHECKOUT_CANCEL_STATE,
    withSessionIdPlaceholder: false,
  });

  return stripe.checkout.sessions.create(
    {
      cancel_url: cancelUrl,
      customer_email: accountEmail,
      line_items: [
        {
          price_data: {
            currency: bookingContext.currencyCode.toLowerCase(),
            product_data: {
              description: `${bookingContext.subject.display_name} · ${lessonLabel}`,
              name: `Lesson request with ${bookingContext.tutor.display_name?.trim() ?? "Mentor IB tutor"}`,
            },
            unit_amount: bookingContext.priceAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_context: context,
        lesson_id: lesson.id,
        note_present: note ? "true" : "false",
        operation_key: operationKey,
        payment_id: payment.id,
      },
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          booking_context: context,
          lesson_id: lesson.id,
          operation_key: operationKey,
          payment_id: payment.id,
        },
      },
      success_url: successUrl,
    },
    {
      idempotencyKey: payment.provider_idempotency_key ?? buildProviderIdempotencyKey(payment.authorization_operation_id),
    },
  );
}

function buildCheckoutReturnUrl({
  context,
  origin,
  operationKey,
  state,
  withSessionIdPlaceholder,
}: {
  context: string;
  origin: string;
  operationKey: string;
  state: string;
  withSessionIdPlaceholder: boolean;
}) {
  const url = new URL("/api/stripe/checkout/return", origin);
  url.searchParams.set("context", context);
  url.searchParams.set("checkout", state);
  url.searchParams.set("operation", operationKey);

  if (withSessionIdPlaceholder) {
    url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  }

  return url.toString();
}

function buildBookingResultPath(context: string, checkoutState: string, operationKey: string) {
  const url = new URL(`https://mentorib.invalid/book/${encodeURIComponent(context)}`);
  url.searchParams.set("checkout", checkoutState);
  url.searchParams.set("operation", operationKey);

  return `${url.pathname}${url.search}`;
}

async function getReusableCheckoutUrl(sessionId: string) {
  const stripe = createStripeServerClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.status === "open" && session.url) {
    return session.url;
  }

  return null;
}

async function updatePaymentCheckoutSession(
  paymentId: string,
  {
    stripeCheckoutSessionId,
    stripePaymentIntentId,
  }: {
    stripeCheckoutSessionId: string;
    stripePaymentIntentId: string | null;
  },
) {
  await updatePayment(paymentId, {
    stripe_checkout_session_id: stripeCheckoutSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
  });
}

async function updateBookingOperation(
  operationId: string,
  updates: BookingOperationUpdate,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient.from("booking_operations").update(updates).eq("id", operationId);

  if (error) {
    throw new BookingCommandError(
      "operation_update_failed",
      "We couldn't update the booking attempt safely.",
    );
  }
}

async function updateLesson(
  lessonId: string,
  updates: LessonUpdate,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient.from("lessons").update(updates).eq("id", lessonId);

  if (error) {
    throw new BookingCommandError(
      "lesson_update_failed",
      "We couldn't update the lesson request safely.",
    );
  }
}

async function updatePayment(
  paymentId: string,
  updates: PaymentUpdate,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient.from("payments").update(updates).eq("id", paymentId);

  if (error) {
    throw new BookingCommandError(
      "payment_update_failed",
      "We couldn't update the payment authorization safely.",
    );
  }
}

async function updateLearningNeed(
  learningNeedId: string,
  updates: LearningNeedUpdate,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient.from("learning_needs").update(updates).eq("id", learningNeedId);

  if (error) {
    throw new BookingCommandError(
      "learning_need_update_failed",
      "We couldn't update the linked learning need yet.",
    );
  }
}

async function updateMatchCandidate(
  candidateId: string,
  updates: MatchCandidateUpdate,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient.from("match_candidates").update(updates).eq("id", candidateId);

  if (error) {
    throw new BookingCommandError(
      "candidate_update_failed",
      "We couldn't update the matched tutor state yet.",
    );
  }
}

async function upsertLessonStatusHistory({
  bookingOperationId,
  changeReason,
  fromStatus,
  lessonId,
  toStatus,
  userId,
}: {
  bookingOperationId: string;
  changeReason: string;
  fromStatus: LessonRecord["lesson_status"] | null;
  lessonId: string;
  toStatus: LessonRecord["lesson_status"];
  userId: string;
}) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const payload: LessonStatusHistoryInsert = {
    booking_operation_id: bookingOperationId,
    change_reason: changeReason,
    changed_by_app_user_id: userId,
    from_status: fromStatus,
    lesson_id: lessonId,
    to_status: toStatus,
  };
  const { error } = await serviceRoleClient
    .from("lesson_status_history")
    .upsert(payload, { onConflict: "booking_operation_id" });

  if (error) {
    throw new BookingCommandError(
      "history_update_failed",
      "We couldn't update the booking status history.",
    );
  }
}

async function loadExistingDraftBundle(
  actorAppUserId: string,
  context: string,
  operationKey: string,
): Promise<ExistingDraftBundle | null> {
  const requestOperation = await getBookingOperationByKey(actorAppUserId, operationKey).catch(
    () => null,
  );
  const paymentOperation = await getBookingOperationByKey(
    actorAppUserId,
    buildPaymentOperationKey(operationKey),
  ).catch(() => null);

  if (!requestOperation || !paymentOperation) {
    return null;
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const [{ data: lesson }, { data: payment }] = await Promise.all([
    serviceRoleClient
      .from("lessons")
      .select(
        [
          "id",
          "booking_operation_id",
          "student_profile_id",
          "tutor_profile_id",
          "learning_need_id",
          "match_candidate_id",
          "lesson_status",
          "scheduled_start_at",
          "scheduled_end_at",
          "request_expires_at",
          "price_amount",
          "cancelled_at",
        ].join(", "),
      )
      .eq("booking_operation_id", requestOperation.id)
      .maybeSingle<LessonRecord>(),
    serviceRoleClient
      .from("payments")
      .select(
        [
          "id",
          "lesson_id",
          "authorization_operation_id",
          "payment_status",
          "amount",
          "currency_code",
          "authorized_at",
          "authorization_expires_at",
          "capture_cancelled_at",
          "provider_idempotency_key",
          "stripe_checkout_session_id",
          "stripe_payment_intent_id",
        ].join(", "),
      )
      .eq("authorization_operation_id", paymentOperation.id)
      .maybeSingle<PaymentRecord>(),
  ]);

  if (!lesson || !payment) {
    return null;
  }

  const { data: tutor } = await serviceRoleClient
    .from("tutor_profiles")
    .select("id, display_name, public_slug, headline, best_for_summary, pricing_summary")
    .eq("id", lesson.tutor_profile_id)
    .maybeSingle<TutorProfileRecord>();

  if (isUuidContext(context) && lesson.match_candidate_id !== context) {
    return null;
  }

  if (!isUuidContext(context) && normalizePublicTutorSlug(context) !== tutor?.public_slug) {
    return null;
  }

  return {
    lesson,
    payment,
    paymentOperation,
    requestOperation,
    tutor: tutor ?? null,
  };
}

async function resolveStudentProfile(accountId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("student_profiles")
    .select("id")
    .eq("app_user_id", accountId)
    .maybeSingle<StudentProfileRecord>();

  if (error) {
    throw new BookingCommandError(
      "student_profile_lookup_failed",
      "We couldn't load your student booking context yet.",
    );
  }

  return data ?? null;
}

async function loadLearningNeedById(learningNeedId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("learning_needs")
    .select(
      [
        "id",
        "student_profile_id",
        "need_status",
        "need_type",
        "subject_id",
        "subject_focus_area_id",
        "urgency_level",
        "support_style",
        "language_code",
        "timezone",
        "session_frequency_intent",
        "free_text_note",
      ].join(", "),
    )
    .eq("id", learningNeedId)
    .maybeSingle<LearningNeedRecord>();

  if (error) {
    throw new BookingCommandError(
      "learning_need_lookup_failed",
      "We couldn't load the linked learning need yet.",
    );
  }

  if (!data || !isBookableNeedStatus(data.need_status)) {
    return null;
  }

  return data;
}

async function loadLatestBookableLearningNeed(studentProfileId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("learning_needs")
    .select(
      [
        "id",
        "student_profile_id",
        "need_status",
        "need_type",
        "subject_id",
        "subject_focus_area_id",
        "urgency_level",
        "support_style",
        "language_code",
        "timezone",
        "session_frequency_intent",
        "free_text_note",
      ].join(", "),
    )
    .eq("student_profile_id", studentProfileId)
    .in("need_status", ["active", "matched", "booked"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<LearningNeedRecord>();

  if (error) {
    throw new BookingCommandError(
      "learning_need_lookup_failed",
      "We couldn't load your current learning need yet.",
    );
  }

  return data ?? null;
}

async function loadTutorProfileById(tutorProfileId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("tutor_profiles")
    .select("id, display_name, public_slug, headline, best_for_summary, pricing_summary")
    .eq("id", tutorProfileId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new BookingCommandError(
      "tutor_lookup_failed",
      "We couldn't load the tutor booking context yet.",
    );
  }

  return data ?? null;
}

async function loadSchedulePolicy(tutorProfileId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("schedule_policies")
    .select(
      [
        "tutor_profile_id",
        "timezone",
        "minimum_notice_minutes",
        "buffer_before_minutes",
        "buffer_after_minutes",
        "is_accepting_new_students",
      ].join(", "),
    )
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<SchedulePolicyRecord>();

  if (error) {
    throw new BookingCommandError(
      "schedule_policy_lookup_failed",
      "We couldn't load the tutor schedule policy yet.",
    );
  }

  return (
    data ?? {
      buffer_after_minutes: DEFAULT_BUFFER_AFTER_MINUTES,
      buffer_before_minutes: DEFAULT_BUFFER_BEFORE_MINUTES,
      is_accepting_new_students: true,
      minimum_notice_minutes: DEFAULT_BOOKING_LEAD_TIME_MINUTES,
      timezone: "UTC",
      tutor_profile_id: tutorProfileId,
    }
  );
}

async function loadAvailabilityRules(tutorProfileId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("availability_rules")
    .select("tutor_profile_id, day_of_week, start_local_time, end_local_time, visibility_status")
    .eq("tutor_profile_id", tutorProfileId)
    .eq("visibility_status", "active")
    .returns<AvailabilityRuleRecord[]>();

  if (error) {
    throw new BookingCommandError(
      "availability_lookup_failed",
      "We couldn't load the tutor's availability yet.",
    );
  }

  return data ?? [];
}

async function loadAvailabilityOverrides(
  tutorProfileId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const startDate = toDateString(rangeStart);
  const endDate = toDateString(rangeEnd);
  const { data, error } = await serviceRoleClient
    .from("availability_overrides")
    .select("tutor_profile_id, override_date, override_type, start_local_time, end_local_time")
    .eq("tutor_profile_id", tutorProfileId)
    .gte("override_date", startDate)
    .lte("override_date", endDate)
    .returns<AvailabilityOverrideRecord[]>();

  if (error) {
    throw new BookingCommandError(
      "availability_override_lookup_failed",
      "We couldn't load the tutor's schedule exceptions yet.",
    );
  }

  return data ?? [];
}

async function loadLessonConflicts({
  participantColumn,
  participantId,
  rangeEnd,
  rangeStart,
}: {
  participantColumn: "student_profile_id" | "tutor_profile_id";
  participantId: string;
  rangeEnd: string;
  rangeStart: string;
}) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("lessons")
    .select("id, lesson_status, scheduled_start_at, scheduled_end_at")
    .eq(participantColumn, participantId)
    .in("lesson_status", [...ACTIVE_LESSON_STATUSES])
    .lt("scheduled_start_at", rangeEnd)
    .gt("scheduled_end_at", rangeStart)
    .returns<LessonConflictRecord[]>();

  if (error) {
    throw new BookingCommandError(
      "lesson_conflict_lookup_failed",
      "We couldn't verify live lesson conflicts yet.",
    );
  }

  return data ?? [];
}

async function loadTutorLanguageNames(tutorProfileId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: capabilities, error: capabilityError } = await serviceRoleClient
    .from("tutor_language_capabilities")
    .select("tutor_profile_id, language_code")
    .eq("tutor_profile_id", tutorProfileId)
    .returns<TutorLanguageCapabilityRecord[]>();

  if (capabilityError || !capabilities?.length) {
    if (capabilityError) {
      throw new BookingCommandError(
        "language_capability_lookup_failed",
        "We couldn't load the tutor's lesson languages yet.",
      );
    }

    return [];
  }

  const languageCodes = capabilities.map((capability) => capability.language_code);
  const { data: languages, error: languageError } = await serviceRoleClient
    .from("languages")
    .select("language_code, display_name")
    .in("language_code", languageCodes)
    .returns<LanguageRecord[]>();

  if (languageError) {
    throw new BookingCommandError(
      "language_lookup_failed",
      "We couldn't load the tutor's lesson languages yet.",
    );
  }

  const namesByCode = new Map((languages ?? []).map((language) => [language.language_code, language.display_name]));

  return capabilities
    .map((capability) => namesByCode.get(capability.language_code))
    .filter((value): value is string => Boolean(value));
}

async function loadSubjectById(subjectId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("subjects")
    .select("id, display_name, slug")
    .eq("id", subjectId)
    .maybeSingle<SubjectRecord>();

  if (error) {
    throw new BookingCommandError(
      "subject_lookup_failed",
      "We couldn't load the lesson subject yet.",
    );
  }

  return data ?? null;
}

async function loadFocusAreaById(focusAreaId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("subject_focus_areas")
    .select("id, display_name, slug")
    .eq("id", focusAreaId)
    .maybeSingle<FocusAreaRecord>();

  if (error) {
    throw new BookingCommandError(
      "focus_area_lookup_failed",
      "We couldn't load the lesson focus area yet.",
    );
  }

  return data ?? null;
}

async function loadLanguageByCode(languageCode: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("languages")
    .select("language_code, display_name")
    .eq("language_code", languageCode)
    .maybeSingle<LanguageRecord>();

  if (error) {
    throw new BookingCommandError(
      "language_lookup_failed",
      "We couldn't load the lesson language yet.",
    );
  }

  return data ?? null;
}

function buildBookingRangeWindow(minimumNoticeMinutes: number) {
  const now = new Date();
  const start = ceilToIncrement(
    addMinutes(now, minimumNoticeMinutes || DEFAULT_BOOKING_LEAD_TIME_MINUTES),
    DEFAULT_BOOKING_INCREMENT_MINUTES,
  );
  const end = addDays(now, MAX_BOOKING_ADVANCE_DAYS);

  return {
    end,
    start,
  };
}

function generateBookableSlots({
  accountTimezone,
  availabilityOverrides,
  availabilityRules,
  schedulePolicy,
  studentConflicts,
  tutorConflicts,
}: {
  accountTimezone: string;
  availabilityOverrides: AvailabilityOverrideRecord[];
  availabilityRules: AvailabilityRuleRecord[];
  schedulePolicy: SchedulePolicyRecord;
  studentConflicts: LessonConflictRecord[];
  tutorConflicts: LessonConflictRecord[];
}) {
  const slotOptions: BookingSlotOption[] = [];
  const timezone = resolveTimezone(schedulePolicy.timezone);
  const bookingRange = buildBookingRangeWindow(schedulePolicy.minimum_notice_minutes);

  for (
    let cursor = bookingRange.start;
    cursor <= bookingRange.end && slotOptions.length < MAX_BOOKING_SLOTS;
    cursor = addMinutes(cursor, DEFAULT_BOOKING_INCREMENT_MINUTES)
  ) {
    const endAt = addMinutes(cursor, DEFAULT_LESSON_DURATION_MINUTES);

    if (
      !isSlotAvailable({
        availabilityOverrides,
        availabilityRules,
        endAt,
        schedulePolicy,
        startAt: cursor,
        studentConflicts,
        timezone,
        tutorConflicts,
      })
    ) {
      continue;
    }

    slotOptions.push({
      endAt: endAt.toISOString(),
      label: formatUtcLessonRange(cursor, endAt, accountTimezone),
      requestExpiresLabel: formatUtcDateTime(
        subtractMinutes(cursor, DEFAULT_BOOKING_REQUEST_EXPIRY_BUFFER_MINUTES),
        {
          timezone: accountTimezone,
        },
      ),
      secondaryLabel: `Tutor local time · ${formatUtcDateTime(cursor, {
        dateStyle: "medium",
        timeStyle: "short",
        timezone,
      })}`,
      startAt: cursor.toISOString(),
    });
  }

  return slotOptions;
}

function isSlotAvailable({
  availabilityOverrides,
  availabilityRules,
  endAt,
  schedulePolicy,
  startAt,
  studentConflicts,
  timezone,
  tutorConflicts,
}: {
  availabilityOverrides: AvailabilityOverrideRecord[];
  availabilityRules: AvailabilityRuleRecord[];
  endAt: Date;
  schedulePolicy: SchedulePolicyRecord;
  startAt: Date;
  studentConflicts: LessonConflictRecord[];
  timezone: string;
  tutorConflicts: LessonConflictRecord[];
}) {
  const startParts = getZonedDateParts(startAt, timezone);
  const endParts = getZonedDateParts(endAt, timezone);

  if (startParts.date !== endParts.date || startParts.dayOfWeek !== endParts.dayOfWeek) {
    return false;
  }

  const slotStartMinutes = toMinutes(startParts.hour, startParts.minute);
  const slotEndMinutes = toMinutes(endParts.hour, endParts.minute);
  const availabilityWindows = buildAvailabilityWindowsForDate({
    availabilityOverrides,
    availabilityRules,
    dayOfWeek: startParts.dayOfWeek,
    localDate: startParts.date,
  });

  if (
    !availabilityWindows.availableWindows.some(
      (window) =>
        slotStartMinutes >= window.startMinutes && slotEndMinutes <= window.endMinutes,
    )
  ) {
    return false;
  }

  if (
    availabilityWindows.blockedWindows.some((window) =>
      overlaps(slotStartMinutes, slotEndMinutes, window.startMinutes, window.endMinutes),
    )
  ) {
    return false;
  }

  const slotStartMs = startAt.getTime();
  const slotEndMs = endAt.getTime();

  const tutorConflict = tutorConflicts.some((conflict) =>
    overlaps(
      slotStartMs,
      slotEndMs,
      addMinutes(new Date(conflict.scheduled_start_at), -schedulePolicy.buffer_before_minutes).getTime(),
      addMinutes(new Date(conflict.scheduled_end_at), schedulePolicy.buffer_after_minutes).getTime(),
    ),
  );
  const studentConflict = studentConflicts.some((conflict) =>
    overlaps(
      slotStartMs,
      slotEndMs,
      new Date(conflict.scheduled_start_at).getTime(),
      new Date(conflict.scheduled_end_at).getTime(),
    ),
  );

  return !tutorConflict && !studentConflict;
}

function buildAvailabilityWindowsForDate({
  availabilityOverrides,
  availabilityRules,
  dayOfWeek,
  localDate,
}: {
  availabilityOverrides: AvailabilityOverrideRecord[];
  availabilityRules: AvailabilityRuleRecord[];
  dayOfWeek: number;
  localDate: string;
}) {
  const baseWindows = availabilityRules
    .filter((rule) => rule.day_of_week === dayOfWeek)
    .map((rule) => parseWindow(rule.start_local_time, rule.end_local_time))
    .filter((window): window is TimeWindow => Boolean(window));
  const dayOverrides = availabilityOverrides.filter((override) => override.override_date === localDate);
  const editedWindows = dayOverrides
    .filter((override) => override.override_type === "edited_window")
    .map((override) => parseWindow(override.start_local_time, override.end_local_time))
    .filter((window): window is TimeWindow => Boolean(window));
  const openExtraWindows = dayOverrides
    .filter((override) => override.override_type === "open_extra")
    .map((override) => parseWindow(override.start_local_time, override.end_local_time))
    .filter((window): window is TimeWindow => Boolean(window));
  const blockedWindows = dayOverrides
    .filter((override) => override.override_type === "blocked")
    .map((override) =>
      parseWindow(override.start_local_time, override.end_local_time) ?? {
        endMinutes: 24 * 60,
        startMinutes: 0,
      },
    );
  const effectiveWindows = [...(editedWindows.length > 0 ? editedWindows : baseWindows), ...openExtraWindows];

  return {
    availableWindows: effectiveWindows,
    blockedWindows,
  };
}

function buildBookingRequestOutcome(
  lesson: LessonRecord,
  payment: PaymentRecord,
  tutor: TutorProfileRecord | null,
): BookingRequestOutcomeDto {
  return {
    lessonStatus: lesson.lesson_status,
    paymentStatus: payment.payment_status,
    priceLabel: formatCurrencyLabel(payment.amount, payment.currency_code),
    requestExpiresLabel: formatUtcDateTime(lesson.request_expires_at),
    scheduledLabel: formatUtcLessonRange(lesson.scheduled_start_at, lesson.scheduled_end_at),
    tutorName: tutor?.display_name?.trim() ?? "Mentor IB tutor",
  };
}

function parsePriceAmount(pricingSummary: string | null) {
  const normalizedSummary = normalizeOptionalText(pricingSummary, 120);

  if (!normalizedSummary) {
    return null;
  }

  const match = normalizedSummary.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/);

  if (!match) {
    return null;
  }

  const parsedValue = Number.parseFloat(match[1]);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return Math.round(parsedValue * 100);
}

function parseWindow(startTime: string | null | undefined, endTime: string | null | undefined) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    return null;
  }

  return {
    endMinutes,
    startMinutes,
  };
}

function parseTimeToMinutes(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const [rawHours, rawMinutes] = trimmedValue.split(":");
  const hours = Number.parseInt(rawHours ?? "", 10);
  const minutes = Number.parseInt(rawMinutes ?? "", 10);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return toMinutes(hours, minutes);
}

function getZonedDateParts(date: Date, timezone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek: weekdayToIndex(values.weekday),
    hour: Number.parseInt(values.hour, 10),
    minute: Number.parseInt(values.minute, 10),
  };
}

function weekdayToIndex(weekday: string) {
  switch (weekday) {
    case "Mon":
      return 1;
    case "Tue":
      return 2;
    case "Wed":
      return 3;
    case "Thu":
      return 4;
    case "Fri":
      return 5;
    case "Sat":
      return 6;
    default:
      return 0;
  }
}

function formatCurrencyLabel(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    currency: currencyCode,
    style: "currency",
  }).format(amount / 100);
}

function buildProviderIdempotencyKey(operationId: string) {
  return `booking_authorize:${operationId}`;
}

function normalizePublicTutorSlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!PUBLIC_TUTOR_SLUG_PATTERN.test(normalizedSlug)) {
    return null;
  }

  return normalizedSlug;
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.slice(0, maxLength);
}

function isUuidContext(context: string) {
  return UUID_PATTERN.test(context.trim());
}

function isMatchCandidateSource(source: BookingContextSource) {
  return source === "match_candidate";
}

function isBookableNeedStatus(status: LearningNeedRecord["need_status"]) {
  return status === "active" || status === "booked" || status === "matched";
}

function isTrialPricing(pricingSummary: string | null) {
  return /trial/i.test(pricingSummary ?? "");
}

function overlaps(leftStartMs: number, leftEndMs: number, rightStartMs: number, rightEndMs: number) {
  return leftStartMs < rightEndMs && leftEndMs > rightStartMs;
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60_000);
}

function subtractMinutes(value: Date, minutes: number) {
  return addMinutes(value, -minutes);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60_000);
}

function ceilToIncrement(value: Date, incrementMinutes: number) {
  const incrementMs = incrementMinutes * 60_000;
  return new Date(Math.ceil(value.getTime() / incrementMs) * incrementMs);
}

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toMinutes(hour: number, minute: number) {
  return hour * 60 + minute;
}

function getStripePaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null | undefined) {
  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function resolveExpandedPaymentIntent(
  paymentIntent: string | Stripe.PaymentIntent | null,
) {
  return typeof paymentIntent === "string" || !paymentIntent ? null : paymentIntent;
}

function isUniqueViolation(error: { code?: string | null } | null) {
  return error?.code === "23505";
}
