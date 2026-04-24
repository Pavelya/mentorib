export type MatchFlowStepId = "details" | "problem" | "subject";

type MatchFlowCopyContext = {
  focusAreaCode?: string;
  needTypeLabel?: string;
  subjectCount?: number;
  timezoneLabel?: string;
};

export const matchFlowStaticCopy = {
  detailsLabel: "Details",
  detailsQuestion: "What language should lessons use?",
  detailsStepDescription: "Choose the lesson language. We keep times in your timezone.",
  freeTextDescription: "Optional. One short note is enough.",
  freeTextLabel: "Anything else we should know?",
  helpLegend: "Type of help",
  problemLabel: "Problem",
  problemQuestion: "What kind of help do you need?",
  problemStepDescription: "Pick the option that sounds closest.",
  subjectLabel: "Subject",
  subjectQuestion: "Which subject is this for?",
  subjectStepDescription: "Choose the subject so we can narrow the shortlist.",
  timezoneNoticeBody: "You do not need to change this. We use it to show lesson times correctly.",
  timezoneNoticeTitlePrefix: "Your timezone",
} as const;

export function getMatchFlowGuidanceCopy(
  stepId: MatchFlowStepId,
  context: MatchFlowCopyContext = {},
) {
  switch (stepId) {
    case "problem":
      return {
        body: "Choose the option that sounds most like your situation right now.",
        title: "Pick the closest kind of help",
      };
    case "subject":
      if (context.focusAreaCode === "tok_essay") {
        return {
          body: "For TOK help, we keep the shortlist focused on TOK tutors.",
          title: "This one stays in TOK",
        };
      }

      if (context.focusAreaCode === "extended_essay") {
        return {
          body: "We use this to match both EE experience and the right subject knowledge.",
          title: "Choose the EE subject",
        };
      }

      return {
        body: context.needTypeLabel
          ? `We only show subjects that fit ${context.needTypeLabel.toLowerCase()}.`
          : "We only show subjects that fit the kind of help you chose.",
        title: "Choose the subject",
      };
    case "details":
      return {
        body: context.timezoneLabel
          ? `Choose the lesson language. Booking times will stay in ${context.timezoneLabel}.`
          : "Choose the lesson language. Booking times will stay in your timezone.",
        title: "Almost done",
      };
  }
}

export function getMatchFlowStepDescription(
  stepId: MatchFlowStepId,
  context: MatchFlowCopyContext = {},
) {
  switch (stepId) {
    case "problem":
      return matchFlowStaticCopy.problemStepDescription;
    case "subject":
      if (context.focusAreaCode === "tok_essay") {
        return "This request goes straight to TOK so you can keep moving.";
      }

      if (context.focusAreaCode === "extended_essay") {
        return "Choose the EE subject so we can keep the shortlist relevant.";
      }

      if (context.subjectCount && context.subjectCount > 11) {
        return "We show the most common IB subjects first and keep the rest under More IB subjects.";
      }

      return matchFlowStaticCopy.subjectStepDescription;
    case "details":
      return matchFlowStaticCopy.detailsStepDescription;
  }
}

export function getMatchFlowTimezoneNoticeCopy(timezoneLabel: string) {
  return {
    body: matchFlowStaticCopy.timezoneNoticeBody,
    title: `${matchFlowStaticCopy.timezoneNoticeTitlePrefix}: ${timezoneLabel}`,
  };
}
