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
    }
  | {
      name: "lesson_report_submitted";
      properties: {
        lesson_id: string;
        subject_slug: string | null;
      };
    }
  | {
      name: "lesson_report_shared";
      properties: {
        lesson_id: string;
        subject_slug: string | null;
      };
    }
  | {
      name: "message_reaction_toggled";
      properties: {
        action: "added" | "removed" | "switched";
        conversation_id: string;
        message_id: string;
        reaction_key:
          | "thumbs_up"
          | "heart"
          | "laugh"
          | "celebrate"
          | "thinking"
          | "clap";
      };
    }
  | {
      name: "conversation_muted_toggled";
      properties: {
        action: "enabled" | "disabled";
        conversation_id: string;
      };
    }
  | {
      name: "conversation_archived_toggled";
      properties: {
        action: "enabled" | "disabled";
        conversation_id: string;
      };
    };

export type ProductEventName = ProductEvent["name"];
