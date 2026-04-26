// Fixture: Intl.NumberFormat outside src/modules/pricing must be flagged by ESLint.
export function format(amount) {
  return new Intl.NumberFormat("en-US", { style: "decimal" }).format(amount);
}
