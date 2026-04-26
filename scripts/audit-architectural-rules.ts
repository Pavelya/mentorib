#!/usr/bin/env tsx
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import process from "node:process";

const REPO_ROOT = process.cwd();

export type Violation = {
  rule: string;
  file: string;
  line: number;
  excerpt: string;
  severity: "error" | "warning";
};

const SCAN_ROOTS = ["src/app", "src/modules", "src/components", "src/lib"];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "build",
  "coverage",
  "__fixtures__",
]);

// Pre-DS-cleanup files allowed to retain `.card` / `.chip` / `.panel` class
// definitions until the matching `P1-DS-FOUND-001-D*` cleanup task lands.
// Each entry must reference the cleanup task that will remove it.
const CARD_CHIP_PANEL_ALLOWLIST = new Set<string>([
  "src/app/(public)/tutors/[slug]/tutor-profile.module.css", // remove with P1-DS-FOUND-001-D1
  "src/app/(student)/results/loading.module.css", // remove with P1-DS-FOUND-001-D2
]);

const CURRENCY_LITERAL_REGEX = /["'](USD|EUR|GBP|CAD|AUD)["']/;
const SVG_REGEX = /<svg[\s>]/;
const CARD_CHIP_PANEL_REGEX = /^\s*\.(card|chip|panel)(?![A-Za-z0-9_-])/;
const VALUE_LABEL_OBJECT_REGEX =
  /\{\s*value\s*:\s*["'][^"']+["']\s*,\s*label\s*:\s*["'][^"']+["']\s*\}/g;

type Walked = { absolutePath: string; relativePath: string };

async function walk(dir: string): Promise<Walked[]> {
  const out: Walked[] = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (SKIP_DIR_NAMES.has(entry.name)) continue;

    const absolutePath = join(dir, entry.name);
    const relativePath = relative(REPO_ROOT, absolutePath).split(sep).join("/");

    if (entry.isDirectory()) {
      out.push(...(await walk(absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      out.push({ absolutePath, relativePath });
    }
  }

  return out;
}

async function collectFiles(roots: string[]) {
  const files: Walked[] = [];
  for (const root of roots) {
    const absolute = join(REPO_ROOT, root);
    let stats;
    try {
      stats = await stat(absolute);
    } catch {
      continue;
    }
    if (stats.isFile()) {
      files.push({
        absolutePath: absolute,
        relativePath: relative(REPO_ROOT, absolute).split(sep).join("/"),
      });
    } else if (stats.isDirectory()) {
      files.push(...(await walk(absolute)));
    }
  }
  return files;
}

function isUnderAny(relativePath: string, prefixes: string[]) {
  return prefixes.some((prefix) => relativePath.startsWith(prefix));
}

function hasExtension(relativePath: string, extensions: string[]) {
  return extensions.some((ext) => relativePath.endsWith(ext));
}

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function checkSvg(
  relativePath: string,
  contents: string,
  violations: Violation[],
) {
  if (!isUnderAny(relativePath, ["src/app/", "src/modules/"])) return;
  if (!hasExtension(relativePath, CODE_EXTENSIONS)) return;

  const lines = contents.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (SVG_REGEX.test(lines[i])) {
      violations.push({
        rule: "no-route-local-svg",
        file: relativePath,
        line: i + 1,
        excerpt: lines[i].trim(),
        severity: "error",
      });
      break;
    }
  }
}

function checkCardChipPanel(
  relativePath: string,
  contents: string,
  violations: Violation[],
) {
  if (!relativePath.startsWith("src/app/")) return;
  if (!relativePath.endsWith(".module.css")) return;
  if (CARD_CHIP_PANEL_ALLOWLIST.has(relativePath)) return;

  const lines = contents.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (CARD_CHIP_PANEL_REGEX.test(lines[i])) {
      violations.push({
        rule: "no-route-local-card-chip-panel",
        file: relativePath,
        line: i + 1,
        excerpt: lines[i].trim(),
        severity: "error",
      });
    }
  }
}

function checkCurrencyLiteral(
  relativePath: string,
  contents: string,
  violations: Violation[],
) {
  if (relativePath.startsWith("src/modules/pricing/")) return;
  if (
    !isUnderAny(relativePath, [
      "src/app/",
      "src/modules/",
      "src/lib/",
      "src/components/",
    ])
  ) {
    return;
  }
  if (!hasExtension(relativePath, CODE_EXTENSIONS)) return;

  const lines = contents.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (CURRENCY_LITERAL_REGEX.test(lines[i])) {
      violations.push({
        rule: "no-currency-code-literal",
        file: relativePath,
        line: i + 1,
        excerpt: lines[i].trim(),
        severity: "error",
      });
    }
  }
}

function checkValueLabelArray(
  relativePath: string,
  contents: string,
  violations: Violation[],
) {
  if (
    relativePath.startsWith("src/modules/reference/") ||
    relativePath.startsWith("src/modules/marketing/")
  ) {
    return;
  }
  if (!isUnderAny(relativePath, ["src/app/", "src/modules/"])) return;
  if (!hasExtension(relativePath, [".ts", ".tsx"])) return;

  const matches = contents.match(VALUE_LABEL_OBJECT_REGEX);
  if (!matches) return;
  if (matches.length < 4) return;

  const idx = contents.search(VALUE_LABEL_OBJECT_REGEX);
  const line = idx === -1 ? 1 : contents.slice(0, idx).split("\n").length;

  violations.push({
    rule: "review-route-local-options-array",
    file: relativePath,
    line,
    excerpt: `${matches.length} consecutive { value, label } objects detected — review whether this should live in src/modules/reference/**`,
    severity: "warning",
  });
}

export function auditContent(
  relativePath: string,
  contents: string,
): Violation[] {
  const violations: Violation[] = [];
  checkSvg(relativePath, contents, violations);
  checkCardChipPanel(relativePath, contents, violations);
  checkCurrencyLiteral(relativePath, contents, violations);
  checkValueLabelArray(relativePath, contents, violations);
  return violations;
}

export async function runAudit(roots: string[] = SCAN_ROOTS) {
  const files = await collectFiles(roots);
  const violations: Violation[] = [];

  for (const file of files) {
    const contents = await readFile(file.absolutePath, "utf8");
    violations.push(...auditContent(file.relativePath, contents));
  }

  return violations;
}

function formatViolation(v: Violation) {
  return `[${v.severity}] ${v.rule}\n  ${v.file}:${v.line}\n  ${v.excerpt}`;
}

async function main() {
  const argRoots = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const roots = argRoots.length > 0 ? argRoots : SCAN_ROOTS;

  const violations = await runAudit(roots);
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  if (warnings.length > 0) {
    console.log("Architectural audit warnings (review-only):");
    for (const v of warnings) console.log(formatViolation(v));
    console.log("");
  }

  if (errors.length > 0) {
    console.error("Architectural audit failures:");
    for (const v of errors) console.error(formatViolation(v));
    console.error(`\n${errors.length} architectural violation(s) found.`);
    process.exit(1);
  }

  console.log(
    `Architectural audit OK (${warnings.length} warning${warnings.length === 1 ? "" : "s"}).`,
  );
}

const invokedAsScript =
  process.argv[1]?.endsWith("audit-architectural-rules.ts") ?? false;

if (invokedAsScript) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
