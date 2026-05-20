import {
  AlertTriangle,
  Atom,
  BadgeCheck,
  Ban,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  Camera,
  ChartBar,
  Check,
  CircleCheck,
  CircleDashed,
  Clock,
  FileText,
  FlaskConical,
  GraduationCap,
  Hand,
  HandHeart,
  Landmark,
  Leaf,
  type LucideIcon,
  MessageSquare,
  MessagesSquare,
  MoreHorizontal,
  MoreVertical,
  PartyPopper,
  Pause,
  Play,
  Presentation,
  Sigma,
  Smile,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";

const iconRegistry = {
  alertTriangle: AlertTriangle,
  ban: Ban,
  biology: Leaf,
  business: Briefcase,
  calendar: Calendar,
  camera: Camera,
  chemistry: FlaskConical,
  check: Check,
  checkCircle: CircleCheck,
  circleDashed: CircleDashed,
  clock: Clock,
  economics: TrendingUp,
  english: BookOpen,
  fileText: FileText,
  history: Landmark,
  math_aa: Sigma,
  math_ai: ChartBar,
  messageSquare: MessageSquare,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  pause: Pause,
  physics: Atom,
  play: Play,
  psychology: Brain,
  reactionCelebrate: PartyPopper,
  reactionClap: Hand,
  reactionHeart: HandHeart,
  reactionLaugh: Smile,
  reactionThinking: Brain,
  reactionThumbsUp: ThumbsUp,
  reviewed: BadgeCheck,
  star: Star,
  studentRole: GraduationCap,
  tok: MessagesSquare,
  tutorRole: Presentation,
  users: Users,
  video: Video,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof iconRegistry;

type IconProps = {
  "aria-label"?: string;
  className?: string;
  filled?: boolean;
  name: IconKey;
  size?: number | string;
  strokeWidth?: number;
};

export function Icon({
  "aria-label": ariaLabel,
  className,
  filled,
  name,
  size = 20,
  strokeWidth = 1.75,
}: IconProps) {
  const Component = iconRegistry[name];
  const isDecorative = !ariaLabel;

  return (
    <Component
      aria-hidden={isDecorative ? true : undefined}
      aria-label={ariaLabel}
      className={className}
      fill={filled ? "currentColor" : "none"}
      role={isDecorative ? undefined : "img"}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
