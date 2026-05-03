// Canonical Mentor IB product analytics event contract.
//
// New event names belong to one of the families approved in
// docs/architecture/analytics-and-product-telemetry-architecture-v1.md
// (sections 11 and 12).
//
// Properties must come from the safe context families: enumerated values,
// stable identifiers, role/state labels, structured categories. Raw free text
// from learning needs, message bodies, meeting links, and payment secrets must
// never appear here.

export type ProductEvent =
  | {
      name: "auth_completed";
      properties: {
        is_new_account: boolean;
        primary_role_context: string | null;
      };
    }
  | {
      name: "match_submitted";
      properties: {
        language_code: string;
        need_type: string;
        session_frequency_intent: string | null;
        subject_slug: string;
        support_style: string | null;
        urgency_level: string | null;
      };
    }
  | {
      name: "booking_request_submitted";
      properties: {
        context_source: string;
        outcome: "checkout_handoff" | "redirect";
      };
    };

export type ProductEventName = ProductEvent["name"];
