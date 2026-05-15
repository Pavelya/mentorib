"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

import { getButtonClassName } from "./button";
import { Icon } from "./icon";

type Orientation = "horizontal" | "vertical";

export type OverflowMenuTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  "aria-label": string;
  orientation?: Orientation;
};

export const OverflowMenuTrigger = forwardRef<
  HTMLButtonElement,
  OverflowMenuTriggerProps
>(function OverflowMenuTrigger(
  { className, orientation = "horizontal", type = "button", ...props },
  ref,
) {
  const iconName = orientation === "vertical" ? "moreVertical" : "moreHorizontal";

  return (
    <button
      {...props}
      className={getButtonClassName({
        className,
        size: "compact",
        variant: "ghost",
      })}
      ref={ref}
      type={type}
    >
      <Icon name={iconName} size={18} />
    </button>
  );
});
