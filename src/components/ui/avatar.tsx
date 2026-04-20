/* eslint-disable @next/next/no-img-element */
import type { HTMLAttributes } from "react";

import styles from "./avatar.module.css";

type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  alt?: string;
  decorative?: boolean;
  name: string;
  size?: "sm" | "md" | "lg";
  src?: string;
};

function getInitials(name: string) {
  const segments = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = segments.map((segment) => segment[0]?.toUpperCase() ?? "").join("");

  return initials || "?";
}

export function Avatar({
  alt,
  className,
  decorative = false,
  name,
  size = "md",
  src,
  ...props
}: AvatarProps) {
  const label = alt ?? name;

  return (
    <span
      {...props}
      aria-hidden={decorative || undefined}
      aria-label={!decorative && !src ? label : undefined}
      className={[styles.avatar, styles[size], className].filter(Boolean).join(" ")}
      role={!decorative && !src ? "img" : undefined}
    >
      {src ? <img alt={decorative ? "" : label} className={styles.image} src={src} /> : getInitials(name)}
    </span>
  );
}
