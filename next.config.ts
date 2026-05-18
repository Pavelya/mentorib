import type { NextConfig } from "next";

// CSP `frame-src` is constrained to the three supported video providers
// (file-and-media v1 § 13). The list is intentionally explicit — no
// wildcards — so introducing a new provider requires updating this
// allowlist deliberately.
const VIDEO_PROVIDER_FRAME_ORIGINS = [
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://www.loom.com",
] as const;

function buildContentSecurityPolicy(): string {
  const frameSources = ["'self'", ...VIDEO_PROVIDER_FRAME_ORIGINS].join(" ");

  return [
    `frame-src ${frameSources}`,
    `child-src ${frameSources}`,
  ].join("; ");
}

function getSupabaseStorageHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!raw) {
    return null;
  }

  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseStorageHostname = getSupabaseStorageHostname();

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: supabaseStorageHostname
      ? [
          {
            hostname: supabaseStorageHostname,
            pathname: "/storage/v1/object/public/tutor-public-media/**",
            protocol: "https",
          },
        ]
      : [],
  },
};

export default nextConfig;
