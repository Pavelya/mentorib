#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

import { ESLint } from "eslint";

import { auditContent, type Violation } from "./audit-architectural-rules.ts";

const REPO_ROOT = process.cwd();
const FIXTURES_DIR = join(REPO_ROOT, "scripts/__fixtures__/architectural-rules");

type Failure = { name: string; reason: string };
const failures: Failure[] = [];

async function expectAuditViolation({
  fixtureFile,
  syntheticPath,
  expectedRule,
}: {
  fixtureFile: string;
  syntheticPath: string;
  expectedRule: string;
}) {
  const contents = await readFile(join(FIXTURES_DIR, fixtureFile), "utf8");
  const violations: Violation[] = auditContent(syntheticPath, contents);
  const match = violations.find((v) => v.rule === expectedRule);
  if (!match) {
    failures.push({
      name: `audit:${expectedRule}`,
      reason: `expected fixture ${fixtureFile} (as ${syntheticPath}) to trigger '${expectedRule}'. Got: ${JSON.stringify(violations)}`,
    });
  }
}

async function expectEslintViolation({
  fixtureFile,
  expectedRuleId,
  expectedMessageSubstring,
}: {
  fixtureFile: string;
  expectedRuleId: string;
  expectedMessageSubstring: string;
}) {
  const fixturePath = join(FIXTURES_DIR, fixtureFile);
  const eslint = new ESLint({
    overrideConfigFile: true,
    cwd: REPO_ROOT,
    overrideConfig: [
      {
        files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
        languageOptions: {
          parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
          },
        },
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "lucide-react",
                  message:
                    "Import icons through @/components/ui/icon (the canonical Icon wrapper).",
                },
              ],
              patterns: [
                {
                  group: ["country-flag-icons", "country-flag-icons/*"],
                  message:
                    "Import country flags through @/components/ui/flag (the canonical Flag wrapper).",
                },
              ],
            },
          ],
          "no-restricted-syntax": [
            "error",
            {
              selector:
                "MemberExpression[object.type='Identifier'][object.name='Intl'][property.name='NumberFormat']",
              message: "Intl.NumberFormat owned by src/modules/pricing/**",
            },
            {
              selector:
                "MemberExpression[object.type='Identifier'][object.name='process'][property.name='env']",
              message: "process.env reads must be centralized in typed env modules",
            },
            {
              selector:
                "MemberExpression[object.type='MemberExpression'][object.object.type='Identifier'][object.object.name='process'][object.property.name='env']",
              message: "process.env reads must be centralized in typed env modules",
            },
          ],
        },
      },
    ],
  });

  const results = await eslint.lintFiles([fixturePath]);
  const messages = results.flatMap((r) => r.messages);
  const flagged = messages.some(
    (m) =>
      m.ruleId === expectedRuleId &&
      (expectedMessageSubstring === "" ||
        m.message.includes(expectedMessageSubstring)),
  );

  if (!flagged) {
    failures.push({
      name: `eslint:${fixtureFile}`,
      reason: `expected ESLint to flag ${fixtureFile} with rule '${expectedRuleId}' (msg containing '${expectedMessageSubstring}'). Got: ${JSON.stringify(messages)}`,
    });
  }
}

async function main() {
  console.log("Verifying audit-script fixtures...");
  await expectAuditViolation({
    fixtureFile: "audit/has-svg.tsx",
    syntheticPath: "src/app/example/has-svg.tsx",
    expectedRule: "no-route-local-svg",
  });
  await expectAuditViolation({
    fixtureFile: "audit/route-local.module.css",
    syntheticPath: "src/app/example/route-local.module.css",
    expectedRule: "no-route-local-card-chip-panel",
  });
  await expectAuditViolation({
    fixtureFile: "audit/has-currency-literal.ts",
    syntheticPath: "src/app/example/has-currency-literal.ts",
    expectedRule: "no-currency-code-literal",
  });
  await expectAuditViolation({
    fixtureFile: "audit/has-options-array.ts",
    syntheticPath: "src/app/example/has-options-array.ts",
    expectedRule: "review-route-local-options-array",
  });

  console.log("Verifying ESLint fixtures...");
  await expectEslintViolation({
    fixtureFile: "eslint/uses-intl-numberformat.ts",
    expectedRuleId: "no-restricted-syntax",
    expectedMessageSubstring: "Intl.NumberFormat",
  });
  await expectEslintViolation({
    fixtureFile: "eslint/uses-process-env.ts",
    expectedRuleId: "no-restricted-syntax",
    expectedMessageSubstring: "process.env",
  });
  await expectEslintViolation({
    fixtureFile: "eslint/uses-lucide-react.ts",
    expectedRuleId: "no-restricted-imports",
    expectedMessageSubstring: "lucide-react",
  });
  await expectEslintViolation({
    fixtureFile: "eslint/uses-country-flag-icons.ts",
    expectedRuleId: "no-restricted-imports",
    expectedMessageSubstring: "country-flag-icons",
  });

  if (failures.length > 0) {
    console.error("\nFixture verification failed:");
    for (const f of failures) {
      console.error(`- ${f.name}: ${f.reason}`);
    }
    process.exit(1);
  }

  console.log("\nAll architectural-rule fixtures correctly flagged.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
