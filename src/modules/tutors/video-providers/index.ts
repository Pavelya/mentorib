import { VideoProviderValidationError } from "./errors";
import { loomAdapter } from "./loom";
import type { NormalizedIntroVideo, VideoProviderAdapter } from "./types";
import { vimeoAdapter } from "./vimeo";
import { youtubeAdapter } from "./youtube";

export { VideoProviderValidationError } from "./errors";
export type {
  NormalizedIntroVideo,
  ParsedVideoUrl,
  VideoProviderAdapter,
} from "./types";

export const videoProviderRegistry: readonly VideoProviderAdapter[] = [
  youtubeAdapter,
  vimeoAdapter,
  loomAdapter,
];

const IFRAME_SHAPE_PATTERN = /<\s*iframe|<\s*script|<\s*\w/i;

function looksLikeMarkup(input: string): boolean {
  return IFRAME_SHAPE_PATTERN.test(input);
}

function hasInternalWhitespace(input: string): boolean {
  return /\s/.test(input);
}

export function normalizeIntroVideoUrl(input: string): NormalizedIntroVideo {
  if (typeof input !== "string") {
    throw new VideoProviderValidationError();
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new VideoProviderValidationError();
  }

  if (looksLikeMarkup(trimmed) || hasInternalWhitespace(trimmed)) {
    throw new VideoProviderValidationError();
  }

  for (const adapter of videoProviderRegistry) {
    const parsed = adapter.parseUrl(trimmed);
    if (parsed) {
      return {
        providerKey: adapter.provider_key,
        externalId: parsed.externalId,
        canonicalWatchUrl: parsed.canonicalWatchUrl,
        canonicalEmbedUrl: parsed.canonicalEmbedUrl,
      };
    }
  }

  throw new VideoProviderValidationError();
}

export function getVideoProviderAdapter(
  providerKey: string,
): VideoProviderAdapter | null {
  return (
    videoProviderRegistry.find(
      (adapter) => adapter.provider_key === providerKey,
    ) ?? null
  );
}
