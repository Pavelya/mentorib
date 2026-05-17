export type ParsedVideoUrl = {
  externalId: string;
  canonicalWatchUrl: string;
  canonicalEmbedUrl: string;
};

export type VideoProviderAdapter = {
  provider_key: string;
  displayName: string;
  parseUrl: (url: string) => ParsedVideoUrl | null;
  thumbnailUrl: (externalId: string) => string | null;
};

export type NormalizedIntroVideo = ParsedVideoUrl & {
  providerKey: string;
};
