export function getInitials(name: string) {
  const segments = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = segments.map((segment) => segment[0]?.toUpperCase() ?? "").join("");

  return initials || "?";
}
