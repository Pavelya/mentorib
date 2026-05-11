import type { Route } from "next";

import {
  tutorStudentsRelationshipStates,
  type TutorStudentsRelationshipState,
  type TutorStudentsRosterFilter,
} from "@/modules/lessons/tutor-students";

type BadgeTone = "positive" | "warning" | "destructive" | "trust" | "info";

export type RelationshipFilter = TutorStudentsRelationshipState | "all";

export const RELATIONSHIP_FILTER_VALUES: readonly RelationshipFilter[] = [
  "all",
  ...tutorStudentsRelationshipStates,
];

const RELATIONSHIP_FILTER_LABELS: Record<RelationshipFilter, string> = {
  active: "Active",
  all: "All",
  inactive: "Inactive",
};

export function getRelationshipFilterLabel(value: RelationshipFilter): string {
  return RELATIONSHIP_FILTER_LABELS[value];
}

export function parseRelationshipFilter(
  value: string | string[] | undefined,
): RelationshipFilter {
  const singleValue = Array.isArray(value) ? value[0] : value;
  return RELATIONSHIP_FILTER_VALUES.includes(singleValue as RelationshipFilter)
    ? (singleValue as RelationshipFilter)
    : "all";
}

export function parseSearchTerm(value: string | string[] | undefined): string {
  const singleValue = Array.isArray(value) ? value[0] : value;
  if (typeof singleValue !== "string") {
    return "";
  }
  return singleValue.trim().slice(0, 80);
}

export function parseSubjectFilter(
  value: string | string[] | undefined,
  availableSubjectIds: readonly string[],
): string {
  const singleValue = Array.isArray(value) ? value[0] : value;
  if (typeof singleValue !== "string") {
    return "";
  }
  return availableSubjectIds.includes(singleValue) ? singleValue : "";
}

export function buildRosterFilter(options: {
  relationship: RelationshipFilter;
  search: string;
  subjectId: string;
}): TutorStudentsRosterFilter {
  const filter: TutorStudentsRosterFilter = {};

  if (options.relationship !== "all") {
    filter.relationshipState = options.relationship;
  }

  if (options.search.length > 0) {
    filter.search = options.search;
  }

  if (options.subjectId.length > 0) {
    filter.subjectId = options.subjectId;
  }

  return filter;
}

export function buildStudentsHref(options: {
  relationship?: RelationshipFilter;
  search?: string;
  subjectId?: string;
}): Route {
  const params = new URLSearchParams();

  if (options.relationship && options.relationship !== "all") {
    params.set("relationship", options.relationship);
  }

  if (options.search && options.search.length > 0) {
    params.set("q", options.search);
  }

  if (options.subjectId && options.subjectId.length > 0) {
    params.set("subject", options.subjectId);
  }

  const query = params.toString();
  return (query ? `/tutor/students?${query}` : "/tutor/students") as Route;
}

export function getRelationshipDescriptor(
  state: TutorStudentsRelationshipState,
): string {
  return state === "active"
    ? "Active teaching relationship"
    : "Inactive teaching relationship";
}

export function getRelationshipBadgeTone(
  state: TutorStudentsRelationshipState,
): BadgeTone {
  return state === "active" ? "positive" : "info";
}

export function getRelationshipBadgeLabel(
  state: TutorStudentsRelationshipState,
): string {
  return state === "active" ? "Active" : "Inactive";
}
