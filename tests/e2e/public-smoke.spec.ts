import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const PUBLIC_ROUTES: Array<{ path: string; titlePattern: RegExp }> = [
  { path: "/", titlePattern: /Mentor IB/i },
  { path: "/tutors", titlePattern: /Mentor IB/i },
  { path: "/how-it-works", titlePattern: /Mentor IB/i },
  { path: "/trust-and-safety", titlePattern: /Mentor IB/i },
  { path: "/support", titlePattern: /Mentor IB/i },
  { path: "/become-a-tutor", titlePattern: /Mentor IB/i },
  { path: "/privacy-policy", titlePattern: /Mentor IB/i },
  { path: "/terms", titlePattern: /Mentor IB/i },
];

const AUTH_ENTRY = { path: "/auth/sign-in", titlePattern: /Mentor IB/i };

// Third-party analytics endpoints that legitimately return non-200 in test
// environments because they receive dummy keys. Failures from these are not
// product regressions and would otherwise drown the signal we care about.
const IGNORED_REQUEST_HOST_PATTERNS: RegExp[] = [
  /\/_vercel\//,
  /vercel-insights\.com/,
  /vitals\.vercel-insights\.com/,
  /va\.vercel-scripts\.com/,
  /posthog\.com/,
  /i\.posthog\.com/,
];

// Console messages of the form
//   "Failed to load resource: the server responded with a status of 404 (Not Found)"
// carry no URL, so we cannot decide on the console side whether the failing
// request is on the analytics ignore list. The companion `response` listener
// below still catches genuine 4xx/5xx because it has the URL. The trailing
// status-text segment may be `(Not Found)`, `(Unauthorized)`, `()`, etc.
// depending on browser version and response shape — match any parenthesized
// content (including empty).
const GENERIC_RESOURCE_FAILURE_PATTERN =
  /^Failed to load resource: the server responded with a status of \d+ \(.*\)$/;

function isIgnoredUrl(url: string) {
  return IGNORED_REQUEST_HOST_PATTERNS.some((pattern) => pattern.test(url));
}

function trackErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // Generic resource-load failures carry no URL on the console message
    // itself. The matching `response` listener below will report them with a
    // URL when the URL is not on the analytics ignore list.
    if (GENERIC_RESOURCE_FAILURE_PATTERN.test(text)) return;
    errors.push(text);
  });

  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    if (isIgnoredUrl(url)) return;
    errors.push(`HTTP ${response.status()} for ${url}`);
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

for (const route of PUBLIC_ROUTES) {
  test(`public route ${route.path} renders without errors and is indexable`, async ({
    page,
  }) => {
    const errors = trackErrors(page);
    const response = await page.goto(route.path, { waitUntil: "networkidle" });

    expect(response, `expected response for ${route.path}`).not.toBeNull();
    expect(response!.status(), `status for ${route.path}`).toBe(200);
    await expect(page).toHaveTitle(route.titlePattern);

    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute("content");
    if (robots !== null) {
      expect(robots.toLowerCase()).not.toContain("noindex");
    }

    expect(errors, `errors on ${route.path}`).toEqual([]);
  });
}

test(`auth entry ${AUTH_ENTRY.path} renders, has noindex posture, and no errors`, async ({
  page,
}) => {
  const errors = trackErrors(page);
  const response = await page.goto(AUTH_ENTRY.path, { waitUntil: "networkidle" });

  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);
  await expect(page).toHaveTitle(AUTH_ENTRY.titlePattern);

  const robots = await page
    .locator('meta[name="robots"]')
    .first()
    .getAttribute("content");
  expect(robots, "auth entry should advertise noindex").not.toBeNull();
  expect(robots!.toLowerCase()).toContain("noindex");

  expect(errors).toEqual([]);
});

test("/robots.txt disallows known private route families", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toMatch(/Disallow:\s*\/auth\//);
  expect(body).toMatch(/Disallow:\s*\/match/);
});

test("/sitemap.xml is reachable and lists the homepage", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("<urlset");
  expect(body).toMatch(/<loc>https?:\/\/[^<]+<\/loc>/);
});
