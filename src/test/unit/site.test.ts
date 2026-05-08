import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("site environment helpers", () => {
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    if (originalNodeEnv === undefined) {
      delete (process.env as Record<string, string | undefined>).NODE_ENV;
    } else {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        originalNodeEnv;
    }
  });

  it("isPreviewDeployment is true only when VERCEL_ENV is preview", async () => {
    const { isPreviewDeployment } = await import("@/lib/seo/site");

    expect(isPreviewDeployment()).toBe(false);

    process.env.VERCEL_ENV = "production";
    expect(isPreviewDeployment()).toBe(false);

    process.env.VERCEL_ENV = "preview";
    expect(isPreviewDeployment()).toBe(true);

    process.env.VERCEL_ENV = "development";
    expect(isPreviewDeployment()).toBe(false);
  });

  it("canAllowIndexing requires production build and not preview", async () => {
    const { canAllowIndexing } = await import("@/lib/seo/site");

    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";
    expect(canAllowIndexing()).toBe(false);

    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.VERCEL_ENV;
    expect(canAllowIndexing()).toBe(true);

    process.env.VERCEL_ENV = "preview";
    expect(canAllowIndexing()).toBe(false);
  });
});
