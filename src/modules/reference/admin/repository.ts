import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import {
  REFERENCE_FAMILIES,
  type ReferenceFamilyDescriptor,
  type ReferenceFamilySlug,
} from "./families";

export type ReferenceAdminRow = {
  /** Stable row identifier — uuid for tables with `id`, key for keyed tables. */
  id: string;
  /** Human-readable identifier (slug / code / key) shown in the admin UI. */
  identifier: string;
  /** Display label that the admin can edit. */
  displayName: string;
  /** Optional secondary description, present only for families that store one. */
  displayDescription: string | null;
  /** Helper text, present only for families that store one. */
  helperText: string | null;
  sortOrder: number;
  isActive: boolean;
};

type RawRow = Record<string, unknown>;

function selectColumns(descriptor: ReferenceFamilyDescriptor): string {
  const columns = new Set<string>([
    descriptor.idColumn,
    descriptor.identifierColumn,
    "sort_order",
    "is_active",
  ]);
  for (const field of descriptor.editableFields) {
    columns.add(field);
  }
  // Always include display_name as the primary visible label.
  columns.add("display_name");
  return Array.from(columns).join(", ");
}

function mapRow(
  descriptor: ReferenceFamilyDescriptor,
  row: RawRow,
): ReferenceAdminRow {
  const idValue = row[descriptor.idColumn];
  const identifier = row[descriptor.identifierColumn];
  return {
    displayDescription:
      "display_description" in row && typeof row.display_description === "string"
        ? row.display_description
        : null,
    displayName:
      typeof row.display_name === "string"
        ? row.display_name
        : typeof row.display_label === "string"
          ? row.display_label
          : "",
    helperText:
      "helper_text" in row && typeof row.helper_text === "string"
        ? row.helper_text
        : null,
    id: typeof idValue === "string" ? idValue : String(idValue),
    identifier: typeof identifier === "string" ? identifier : String(identifier),
    isActive: Boolean(row.is_active),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}

export type ReferenceActiveFilter = "all" | "active" | "inactive";

export async function loadReferenceFamilyRows(
  family: ReferenceFamilySlug,
  filter: ReferenceActiveFilter = "all",
): Promise<ReferenceAdminRow[]> {
  const descriptor = REFERENCE_FAMILIES[family];
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from(descriptor.table)
    .select(selectColumns(descriptor))
    .order("sort_order", { ascending: true });

  if (filter === "active") {
    query = query.eq("is_active", true);
  } else if (filter === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query.returns<RawRow[]>();

  if (error) {
    throw new Error(`Could not load reference family rows (${descriptor.table}).`);
  }

  return (data ?? []).map((row) => mapRow(descriptor, row));
}

export async function loadReferenceFamilyRow(
  family: ReferenceFamilySlug,
  id: string,
): Promise<ReferenceAdminRow | null> {
  const descriptor = REFERENCE_FAMILIES[family];
  const supabase = createSupabaseServiceRoleClient();
  // The Supabase row filter API is column-typed per-table; the dynamic
  // family-routing here trips that — cast is contained to the lookup
  // expression because the `idColumn` came from the trusted family map.
  const query = supabase
    .from(descriptor.table)
    .select(selectColumns(descriptor));
  const { data, error } = await (query as unknown as {
    eq: (column: string, value: string) => {
      maybeSingle: <T>() => PromiseLike<{ data: T | null; error: { message: string } | null }>;
    };
  })
    .eq(descriptor.idColumn, id)
    .maybeSingle<RawRow>();

  if (error) {
    throw new Error(`Could not load reference row (${descriptor.table}/${id}).`);
  }

  return data ? mapRow(descriptor, data) : null;
}
