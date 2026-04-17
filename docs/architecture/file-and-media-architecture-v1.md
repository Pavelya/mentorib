# Mentor IB File And Media Architecture v1

**Date:** 2026-04-08
**Status:** Standalone file, storage, and media architecture for private verification assets, public profile media, and external video previews
**Scope:** storage classes, file ownership, tutor credential uploads, public trust-proof derivation, public media handling, external video support, moderation boundaries, and future direct-video posture

## 1. Why This Document Exists

This document defines how Mentor IB should treat files and media across private tutor verification, public tutor profiles, and future product expansion.

It exists now because the approved product already implies the need for:

- tutor credential uploads during application or later credential management
- public tutor profile photos and similar profile media
- trust proof visible on tutor profiles
- possible report attachments later
- tutor intro or preview video support on public profiles

Without an explicit architecture, file and media handling tends to become:

- mixed between private and public surfaces
- weakly modeled as raw storage objects only
- hard to moderate safely
- expensive to change later if video support expands

## 2. What This Document Does Not Redefine

This document does not replace the approved core, security, privacy, moderation, or SEO architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`

It does not define:

- final uploader UI details
- final image-cropping interaction design
- final email template media usage
- final content moderation staffing

Those can come later as implementation or operational artifacts.

## 3. Core Recommendation

Mentor IB should use one media architecture with three clear asset classes:

- private verification assets
- public profile media assets
- external public video references

The practical rule is:

- private files prove trust internally
- public media communicates trust externally
- raw credential files do not become public profile content
- public trust proof must be derived from approved private evidence or intentionally uploaded public-safe assets
- video support should start with external hosted providers, not direct end-user video uploads

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means file and media handling should be:

- explicit about privacy class
- explicit about ownership
- explicit about source type
- explicit about publication state
- explicit about moderation and review state

The architecture should not rely on:

- file paths alone as product state
- generic "media" fields with mixed meaning
- arbitrary embed HTML copied from users
- humans remembering which upload is public versus private

## 5. Goals

The file and media architecture should:

- keep private tutor verification materials private
- make public profile media easy to manage and revoke
- support trustworthy public tutor profiles without exposing raw certificates
- allow memorable tutor video previews without taking on full video-hosting complexity in MVP
- preserve a clean upgrade path if direct video hosting is needed later

## 6. Asset Class Model

Every important media object should belong to an explicit asset class.

## 6.1 Class M1: private verification assets

These are files uploaded to support tutor review and trust validation.

Examples:

- degree certificate
- teaching credential
- academic transcript excerpt if ever needed
- identity or qualification support document if introduced later

Rule:

- private by default
- never exposed directly through public tutor profile routes

## 6.2 Class M2: public profile media assets

These are assets intentionally displayed on public tutor surfaces.

Examples:

- tutor profile photo
- optional public-safe credential thumbnail only if explicitly approved later
- optional public gallery image if introduced later

Rule:

- public only after explicit publication state allows it

## 6.3 Class M3: derived public trust proof

This is not a raw uploaded file.

It is approved public trust information derived from internal review outcomes or curated public-safe evidence.

Examples:

- verified degree
- reviewed teaching credential
- IB experience verified
- subject expertise verified

Rule:

- these are public trust objects, not raw document exposures

## 6.4 Class M4: external public video references

These are hosted outside Mentor IB but intentionally referenced on tutor public surfaces.

Examples:

- YouTube intro video
- Vimeo intro video
- Loom intro or walkthrough video

Rule:

- the canonical product state is the normalized video reference, not copied embed code

## 6.5 Class M5: future private attachments

These are later private file classes for narrow operational use.

Examples:

- report attachments
- future lesson attachments if ever introduced outside chat

Rule:

- do not pull these into MVP without a dedicated product need

## 7. Canonical Object Model

## 7.1 Main rule

Storage objects are not enough as product state.

The product should use explicit domain metadata records.

## 7.2 Recommended core objects

The architecture should support at least:

- `FileAsset`
- `CredentialEvidence`
- `PublicMediaAsset`
- `VideoReference`
- `TrustProof`

The exact schema can vary, but the separation should exist.

## 7.3 `FileAsset` purpose

This is the low-level metadata record for any stored file Mentor IB actually owns.

Suggested attributes:

- asset id
- owner user id or domain owner
- bucket class
- object path
- mime type
- size
- upload purpose
- visibility class
- created at
- deleted at if soft-deleted

## 7.4 `CredentialEvidence` purpose

This is the private verification object attached to tutor application or tutor credential management.

Suggested attributes:

- tutor id
- file asset id
- credential type
- review status
- reviewer id if reviewed
- review outcome note reference
- public trust-proof eligibility flag

## 7.5 `PublicMediaAsset` purpose

This is the public-safe media object displayed on tutor-facing public surfaces.

Suggested attributes:

- tutor id
- file asset id
- media role
- publication status
- sort order
- alt text or media caption if relevant

## 7.6 `VideoReference` purpose

This is the normalized external video object.

Suggested attributes:

- tutor id
- provider
- canonical provider video id
- canonical watch URL
- canonical embed URL
- review status
- publication status
- thumbnail source if cached or remote
- title snapshot if stored

## 7.7 `TrustProof` purpose

This is the public trust object shown on tutor profile pages.

Suggested attributes:

- tutor id
- proof type
- proof label
- proof status
- supporting internal evidence references
- public display order

Rule:

- `TrustProof` is the public-facing abstraction
- `CredentialEvidence` is the private verification input

## 8. Storage Architecture

## 8.1 Recommended MVP storage platform

Use Supabase Storage for files Mentor IB actually stores.

That includes:

- private verification files
- public profile images
- future report attachments if later approved

## 8.2 Bucket separation rule

At minimum, use separate storage classes for:

- public profile media
- private credential and verification files
- future private operational attachments

The exact bucket names can vary, but the trust boundary must be explicit.

## 8.3 Path convention rule

Object paths should reflect:

- asset class
- owning tutor or case id
- purpose

Do not use flat ad hoc filenames with no ownership signal.

## 8.4 Serving rule

Public profile media may be served as public assets.

Private verification assets should be served only through private access control and signed access where needed.

## 8.5 Image-transformation posture

Image transformation is an optimization layer, not a foundational dependency.

Because early cost discipline matters, the architecture should not require paid image transformations to ship MVP.

If transformations are later enabled, they should improve public media delivery without changing the canonical asset model.

## 9. Tutor Credential Architecture

## 9.1 Main recommendation

Tutor certificate and credential uploads should belong to the tutor application and tutor credential-management flows, not to the public tutor profile directly.

## 9.2 Why this is the default

Raw certificates often contain:

- full legal names
- dates
- institution identifiers
- signatures
- reference numbers
- other data that should not be public by default

## 9.3 Public-profile rule

Public tutor profiles should not show raw uploaded certificate files or PDFs.

Instead, they should show:

- approved trust proof derived from review outcomes
- optional curated public-safe evidence only if explicitly approved later

## 9.4 Separate public-evidence rule

If the product later wants visible credential imagery on public profiles, it should use a separate public-safe media object, not the original private verification upload.

Examples:

- a redacted excerpt
- a manually approved badge-like image
- a curated institutional mark if rights and safety allow

## 9.5 Review-state rule

Credential upload, credential review, tutor approval, and public listing remain separate state families.

This matches the approved moderation architecture.

## 10. Public Trust-Proof Architecture

## 10.1 Public trust is derived, not dumped

The public tutor profile should communicate trust through curated trust objects, not through a file cabinet of uploaded documents.

## 10.2 Recommended MVP public trust outputs

Public tutor trust proof should start with:

- verified credential status
- verified subject expertise labels
- reviewed experience labels
- review and outcome context if later available

## 10.3 Proof-language rule

Public trust proof labels should be:

- simple
- understandable
- non-misleading
- backed by actual review state

Do not expose legalistic or ambiguous verification language.

## 10.4 SEO rule

Only public trust outputs that are genuinely visible on the public page should contribute to public SEO surfaces.

Private credential metadata must never leak into structured data or public HTML.

## 11. Public Image Architecture

## 11.1 Recommended MVP image scope

Phase 1 public media should stay narrow:

- one primary profile image
- optional secondary public media later only if there is a clear product reason

## 11.2 Content rule

Public profile imagery should be:

- authentic
- professionally appropriate
- safe for public display

## 11.3 Moderation rule

Public images should be removable from public routes without deleting the entire tutor account.

This should align with the approved privacy and moderation architecture.

## 11.4 Accessibility rule

Public images should support alt text or an equivalent accessible description strategy where meaningful.

## 12. External Video Architecture

## 12.1 Recommended MVP video posture

For MVP, support external hosted tutor preview videos instead of direct native video uploads.

Boundary note:

- these public tutor intro videos are not the same as lesson meeting links
- lesson meeting links belong to the dedicated meeting and calendar architecture

## 12.2 Why this is the default

This avoids taking on:

- large-file upload complexity
- transcoding
- streaming delivery
- abuse-heavy video storage moderation
- video processing infrastructure

## 12.3 Supported-provider rule

Use an allowlist of supported providers.

Recommended MVP allowlist:

- YouTube
- Vimeo
- Loom

The architecture should allow more providers later through the same normalized `VideoReference` model.

## 12.4 No arbitrary iframe rule

Do not store or render arbitrary user-supplied embed HTML.

Instead:

- accept a provider URL
- validate it server-side
- normalize provider and video id
- generate the approved embed URL in product code

## 12.5 Publication rule

External videos should remain non-public until:

- the provider URL is valid
- the video is reachable
- the tutor profile is eligible for public listing
- moderation or review rules do not block publication

## 12.6 Privacy rule

If a provider video is private, restricted, or account-only, it should not be relied on for a public profile experience.

The product should assume public tutor videos need viewer-accessible provider privacy settings.

## 12.7 Provider-adapter rule

Each supported video provider should have a small adapter layer responsible for:

- URL parsing
- canonical id extraction
- embed URL generation
- thumbnail strategy
- provider-specific caveats

This keeps expansion cleaner than scattering provider logic across profile components.

## 13. Recommended External Video Providers

## 13.1 YouTube

YouTube is a good default MVP provider because:

- it is widely familiar
- embeds are straightforward
- public availability is easy for tutors to understand

## 13.2 Vimeo

Vimeo is a strong supported option for tutors who want a more controlled presentation and already host there.

## 13.3 Loom

Loom is useful for quick tutor intro videos, but the architecture should treat it as more fragile than YouTube or Vimeo for public profile use because privacy settings can interfere with embedded playback.

## 13.4 Provider expansion posture

The architecture should support later expansion to additional providers through new adapters, but phase 1 should stay narrow.

Good later candidates can include:

- Wistia
- direct-hosted dedicated video platform later if the product justifies it

## 14. External Video Metadata Strategy

## 14.1 Main rule

The stored product object should contain normalized provider data, not pasted HTML blobs.

## 14.2 Metadata fields

For each approved public video reference, the architecture should support:

- provider
- provider video id
- normalized embed URL
- normalized public watch URL
- preview image or thumbnail reference
- title snapshot if available
- last validation timestamp

## 14.3 Validation posture

At save time, the system should validate:

- supported provider
- valid URL shape
- extractable provider video id

Later asynchronous enrichment may fetch additional metadata if needed.

## 14.4 Async enrichment rule

If video metadata enrichment is added, it should use the approved background-jobs architecture.

Do not block the save flow on best-effort metadata fetching if the core URL normalization already succeeded.

## 15. Publication And Review State Model

## 15.1 Main rule

File existence is not publication.

Every public-capable asset should have explicit publication state.

## 15.2 Recommended public-capable state split

For public media or video references, the architecture should distinguish between:

- uploaded or submitted
- pending review if review is required
- approved
- published
- hidden or removed

The exact names can vary, but the distinction should exist.

## 15.3 Tutor-publication dependency rule

A tutor may be approved to teach without every media object being published.

This means:

- tutor approval
- public listing eligibility
- image publication
- video publication
- trust-proof publication

should remain separable.

## 16. Security Architecture For Files And Media

## 16.1 Inherited security rule

This architecture inherits the approved storage and upload rules from the security architecture.

## 16.2 Upload constraints

Every upload flow should constrain:

- allowed file type
- allowed file size
- allowed upload purpose

## 16.3 Recommended MVP private-file types

For private verification uploads, prefer a narrow allowed set such as:

- PDF
- JPEG
- PNG

Do not support arbitrary office files or archives unless there is a real operational need.

## 16.4 Public-media type rule

For public profile media, keep the MVP scope to common safe image formats only.

## 16.5 Delivery rule

Private files should never be exposed through public URLs.

Any private viewing or download path should be authorized and intentionally scoped.

## 16.6 CSP rule

Because public video embeds use external providers, the final web security policy should allow only the explicit provider domains required for supported embeds.

Do not use a broad iframe wildcard policy.

## 17. Privacy And Retention Architecture For Files And Media

## 17.1 Inherited privacy rule

This architecture inherits the approved privacy and retention rules.

## 17.2 Credential-retention rule

Private credential files should be retained only as long as review, audit, or trust requirements justify.

## 17.3 Public-media removal rule

Public media should be removable from:

- public routes
- sitemap eligibility if relevant
- public rendering paths

before or alongside storage deletion.

## 17.4 External-video removal rule

Removing a public video should:

- remove it from public rendering
- remove any public metadata exposure
- preserve only the minimum internal audit trail needed

The product does not control provider-side deletion, so the public site must stop referencing the asset promptly.

## 18. Moderation And Review Architecture

## 18.1 Main moderation rule

Public-facing media and private credential evidence are different review problems.

They should not be handled as the same queue item type even if they use some shared tooling.

## 18.2 Private verification review

Private credential evidence supports:

- tutor application review
- credential verification review
- trust-proof eligibility

## 18.3 Public media review

Public profile media supports:

- content safety review
- brand and professionalism review
- publication or takedown actions

## 18.4 Video review

Public tutor videos should be reviewable for:

- broken or inaccessible links
- inappropriate content
- misleading claims
- mismatch with the tutor's approved public profile

## 19. Background Work Integration

## 19.1 Background-jobs rule

Media-related async work should use the approved background-jobs architecture.

## 19.2 Good async candidates

Good background candidates include:

- image metadata extraction later if needed
- video metadata enrichment
- public-media cleanup after removal
- provider validation retries

## 19.3 Not-everything-async rule

The first upload save or provider URL normalization should remain straightforward and synchronous where possible.

Do not force every media interaction through background jobs.

## 20. Recommended Phase Scope

## 20.1 Phase 1

Phase 1 should support:

- private tutor credential uploads
- public profile image upload
- derived public trust proof
- external tutor intro video references for supported providers
- public publication and takedown controls

## 20.2 Phase 1.5

Good next candidates:

- richer public trust-proof variants
- stronger media-review tooling
- limited secondary public media
- provider expansion beyond the initial allowlist

## 20.3 Phase 2

Consider later:

- direct native video uploads
- richer asset processing pipelines
- attachment support for other product areas if justified

## 21. Future Direct-Video Posture

## 21.1 Main rule

If Mentor IB later needs direct native video uploads, do not build custom video hosting out of generic file storage alone.

## 21.2 Why this matters

Native video introduces:

- upload resiliency needs
- transcoding
- streaming delivery
- playback compatibility
- higher moderation cost
- higher storage and egress sensitivity

## 21.3 Recommended future path

If direct upload becomes strategically important later, adopt a dedicated video platform instead of extending generic storage into a homegrown streaming system.

One reasonable later candidate is Cloudflare Stream.

The important architectural rule is not the specific vendor.

The important rule is:

- keep `VideoReference` and media publication state abstract enough that the system can later support both external references and first-party hosted video assets

## 22. Decisions To Lock Now

The architecture should lock the following decisions now:

- raw tutor certificates belong to private verification flows
- raw credential files do not appear on public tutor profiles
- public trust proof is derived from review outcomes or curated public-safe evidence
- public profile images and private verification files remain distinct asset classes
- MVP video support uses external hosted providers, not direct uploads
- external video support uses an allowlist and provider adapters
- user-supplied embed HTML is not accepted as canonical product input
- future direct native video, if needed, should use a dedicated video platform rather than generic storage alone

## 23. Final Recommendation

Mentor IB should implement one clear file and media architecture with separate privacy and publication rules for:

- private verification evidence
- public profile media
- external public video references

The recommended MVP is:

- Supabase Storage for owned files
- strict separation between private credential assets and public media assets
- derived public trust proof instead of raw certificate display
- provider-normalized external video support starting with YouTube, Vimeo, and Loom

This gives the product strong trust surfaces without turning the MVP into a document-publication system or a video-hosting company.

## 24. Official Source Notes

The recommendation above is informed by current official documentation for:

- Supabase Storage overview: `https://supabase.com/docs/guides/storage`
- Supabase Storage access control: `https://supabase.com/docs/guides/storage/security/access-control`
- Supabase Storage ownership: `https://supabase.com/docs/guides/storage/security/ownership`
- Supabase Storage downloads and signed access: `https://supabase.com/docs/guides/storage/serving/downloads`
- YouTube embedded players and parameters: `https://developers.google.com/youtube/player_parameters`
- YouTube iframe player API: `https://developers.google.com/youtube/iframe_api_reference`
- Vimeo embed guidance: `https://help.vimeo.com/hc/en-us/articles/12426259908881-How-do-I-embed-my-video-`
- Vimeo embedding overview: `https://help.vimeo.com/hc/en-us/articles/12426275096337-Embedding-videos-overview`
- Loom embedding guidance: `https://support.loom.com/hc/en-us/articles/360002208317-How-to-embed-your-video-into-a-webpage`
- Loom privacy settings: `https://support.loom.com/hc/en-us/articles/360016527597-How-to-use-Loom-s-privacy-settings`
- Cloudflare Stream overview: `https://developers.cloudflare.com/stream/`
