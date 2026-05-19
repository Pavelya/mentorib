export type DetectedMeetingProvider = {
  displayName: string;
  providerKey: string;
};

const HOST_MATCHERS: ReadonlyArray<{
  matcher: (host: string) => boolean;
  providerKey: string;
}> = [
  {
    matcher: (host) => host === "meet.google.com",
    providerKey: "google_meet",
  },
  {
    matcher: (host) => host === "zoom.us" || host.endsWith(".zoom.us"),
    providerKey: "zoom",
  },
  {
    matcher: (host) =>
      host === "teams.microsoft.com" ||
      host === "teams.live.com" ||
      host.endsWith(".teams.microsoft.com"),
    providerKey: "microsoft_teams",
  },
  {
    matcher: (host) => host === "whereby.com" || host.endsWith(".whereby.com"),
    providerKey: "whereby",
  },
];

export function detectMeetingProviderFromUrl(
  rawUrl: string,
  providerOptions: ReadonlyArray<{ displayName: string; providerKey: string }>,
): DetectedMeetingProvider | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  let host: string;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return null;
  }

  const matched = HOST_MATCHERS.find((entry) => entry.matcher(host));

  if (matched) {
    const option = providerOptions.find(
      (provider) => provider.providerKey === matched.providerKey,
    );
    if (option) {
      return { displayName: option.displayName, providerKey: option.providerKey };
    }
  }

  const fallback = providerOptions.find(
    (provider) => provider.providerKey === "other",
  );

  return {
    displayName: "Custom link",
    providerKey: fallback?.providerKey ?? "other",
  };
}
