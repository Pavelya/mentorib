import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

import styles from "./card.module.css";

type CardVariant = "static" | "select" | "instantSubmit";

type SharedCardProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  selected?: boolean;
  variant?: CardVariant;
};

type StaticCardProps = SharedCardProps &
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> & {
    as?: "div" | "article" | "section";
  };

type ButtonCardProps = SharedCardProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "type"> & {
    as: "button";
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  };

type AnchorCardProps = SharedCardProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    as: "a";
    href: string;
  };

export type CardProps = StaticCardProps | ButtonCardProps | AnchorCardProps;

function getCardClassName(
  variant: CardVariant,
  selected: boolean,
  fullWidth: boolean,
  extra?: string,
) {
  return [
    styles.card,
    styles[variant],
    selected ? styles.selected : "",
    fullWidth ? styles.fullWidth : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function splitCardProps<T extends SharedCardProps>(props: T) {
  const {
    children,
    className,
    fullWidth = false,
    selected = false,
    variant = "static" as CardVariant,
    ...rest
  } = props;
  return {
    children,
    classes: getCardClassName(variant, selected, fullWidth, className),
    rest,
  };
}

export function Card(props: CardProps) {
  if (props.as === "button") {
    const { as: _as, type = "button", ...sharedAndButton } = props;
    void _as;
    const { children, classes, rest } = splitCardProps(sharedAndButton);
    return (
      <button {...rest} className={classes} type={type}>
        {children}
      </button>
    );
  }

  if (props.as === "a") {
    const { as: _as, ...sharedAndAnchor } = props;
    void _as;
    const { children, classes, rest } = splitCardProps(sharedAndAnchor);
    return (
      <a {...rest} className={classes}>
        {children}
      </a>
    );
  }

  const { as = "div", ...sharedAndDiv } = props;
  const { children, classes, rest } = splitCardProps(sharedAndDiv);
  const Tag = as;
  return (
    <Tag {...rest} className={classes}>
      {children}
    </Tag>
  );
}
