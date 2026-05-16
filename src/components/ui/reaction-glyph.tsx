import { Icon, type IconKey } from "./icon";

import type { MessageReactionKey } from "@/modules/messages/constants";

const reactionGlyphRegistry = {
  thumbs_up: { iconName: "reactionThumbsUp", label: "Thumbs up" },
  heart: { iconName: "reactionHeart", label: "Heart" },
  laugh: { iconName: "reactionLaugh", label: "Laugh" },
  celebrate: { iconName: "reactionCelebrate", label: "Celebrate" },
  thinking: { iconName: "reactionThinking", label: "Thinking" },
  clap: { iconName: "reactionClap", label: "Clap" },
} satisfies Record<MessageReactionKey, { iconName: IconKey; label: string }>;

export function getReactionLabel(key: MessageReactionKey): string {
  return reactionGlyphRegistry[key].label;
}

type ReactionGlyphProps = {
  "aria-hidden"?: boolean;
  className?: string;
  reactionKey: MessageReactionKey;
  size?: number;
};

export function ReactionGlyph({
  "aria-hidden": ariaHidden = true,
  className,
  reactionKey,
  size = 16,
}: ReactionGlyphProps) {
  const entry = reactionGlyphRegistry[reactionKey];

  return (
    <Icon
      aria-label={ariaHidden ? undefined : entry.label}
      className={className}
      name={entry.iconName}
      size={size}
    />
  );
}
