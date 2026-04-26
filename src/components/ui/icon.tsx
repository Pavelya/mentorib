import {
  Atom,
  BadgeCheck,
  BookOpen,
  Brain,
  Briefcase,
  ChartBar,
  Check,
  Clock,
  FlaskConical,
  GraduationCap,
  Landmark,
  Leaf,
  type LucideIcon,
  MessagesSquare,
  Pause,
  Presentation,
  Sigma,
  TrendingUp,
} from "lucide-react";

const iconRegistry = {
  biology: Leaf,
  business: Briefcase,
  chemistry: FlaskConical,
  check: Check,
  clock: Clock,
  economics: TrendingUp,
  english: BookOpen,
  history: Landmark,
  math_aa: Sigma,
  math_ai: ChartBar,
  pause: Pause,
  physics: Atom,
  psychology: Brain,
  reviewed: BadgeCheck,
  studentRole: GraduationCap,
  tok: MessagesSquare,
  tutorRole: Presentation,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof iconRegistry;

type IconProps = {
  "aria-label"?: string;
  className?: string;
  name: IconKey;
  size?: number | string;
  strokeWidth?: number;
};

export function Icon({
  "aria-label": ariaLabel,
  className,
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
      role={isDecorative ? undefined : "img"}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
