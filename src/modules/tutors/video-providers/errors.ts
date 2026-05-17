export const UNSUPPORTED_VIDEO_LINK_MESSAGE =
  "This video link isn't supported. Use a supported public video provider.";

export class VideoProviderValidationError extends Error {
  readonly kind = "validation" as const;
  readonly code = "validation_failed";

  constructor(message: string = UNSUPPORTED_VIDEO_LINK_MESSAGE) {
    super(message);
    this.name = "VideoProviderValidationError";
  }
}
