import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const ARCH_RESTRICTED_IMPORT_PATHS = [
  {
    name: "lucide-react",
    message:
      "Import icons through `@/components/ui/icon` (the canonical Icon wrapper). Direct lucide-react imports are reserved for `src/components/ui/icon.tsx`.",
  },
];

const ARCH_RESTRICTED_IMPORT_PATTERNS = [
  {
    group: ["country-flag-icons", "country-flag-icons/*"],
    message:
      "Import country flags through `@/components/ui/flag` (the canonical Flag wrapper). Direct country-flag-icons imports are reserved for `src/components/ui/flag.tsx`.",
  },
  {
    group: ["lucide-react/*"],
    message:
      "Import icons through `@/components/ui/icon` (the canonical Icon wrapper). Direct lucide-react imports are reserved for `src/components/ui/icon.tsx`.",
  },
];

const INTL_NUMBER_FORMAT_RULE = {
  selector:
    "MemberExpression[object.type='Identifier'][object.name='Intl'][property.name='NumberFormat']",
  message:
    "`Intl.NumberFormat` is owned by `src/modules/pricing/**`. Use the shared currency formatters in `@/modules/pricing/money` instead of formatting locally.",
};

const PROCESS_ENV_DIRECT_RULE = {
  selector:
    "MemberExpression[object.type='Identifier'][object.name='process'][property.name='env']",
  message:
    "`process.env.*` reads must be centralized in a typed env module (e.g. `src/lib/<area>/env.ts`). Re-export the value you need from there.",
};

const PROCESS_ENV_NESTED_RULE = {
  selector:
    "MemberExpression[object.type='MemberExpression'][object.object.type='Identifier'][object.object.name='process'][object.property.name='env']",
  message:
    "`process.env.*` reads must be centralized in a typed env module (e.g. `src/lib/<area>/env.ts`). Re-export the value you need from there.",
};

const ALL_ARCH_SYNTAX_RULES = [
  INTL_NUMBER_FORMAT_RULE,
  PROCESS_ENV_DIRECT_RULE,
  PROCESS_ENV_NESTED_RULE,
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "scripts/__fixtures__/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ARCH_RESTRICTED_IMPORT_PATHS,
          patterns: ARCH_RESTRICTED_IMPORT_PATTERNS,
        },
      ],
      "no-restricted-syntax": ["error", ...ALL_ARCH_SYNTAX_RULES],
    },
  },
  {
    files: ["src/modules/pricing/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        PROCESS_ENV_DIRECT_RULE,
        PROCESS_ENV_NESTED_RULE,
      ],
    },
  },
  {
    files: [
      "src/lib/**/env.ts",
      "src/lib/auth/auth-boundary.ts",
      "src/lib/seo/site.ts",
    ],
    rules: {
      "no-restricted-syntax": ["error", INTL_NUMBER_FORMAT_RULE],
    },
  },
  {
    files: ["src/components/ui/icon.tsx", "src/components/ui/flag.tsx"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
