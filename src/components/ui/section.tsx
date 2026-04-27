import type { HTMLAttributes, ReactNode } from "react";

import styles from "./section.module.css";

type SectionTag = "section" | "div" | "article";
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "p";
type SectionDensity = "default" | "compact" | "spacious";
type SectionDivider = "none" | "top" | "bottom";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  action?: ReactNode;
  as?: SectionTag;
  contentClassName?: string;
  density?: SectionDensity;
  description?: ReactNode;
  divider?: SectionDivider;
  eyebrow?: ReactNode;
  headerClassName?: string;
  title?: ReactNode;
  titleAs?: HeadingTag;
};

export function Section({
  action,
  as = "section",
  children,
  className,
  contentClassName,
  density = "default",
  description,
  divider = "none",
  eyebrow,
  headerClassName,
  title,
  titleAs = "h2",
  ...props
}: SectionProps) {
  const Container = as;
  const Heading = titleAs;
  const hasHeader = Boolean(eyebrow || title || description || action);

  return (
    <Container
      {...props}
      className={[
        styles.section,
        density === "compact" ? styles.compact : "",
        density === "spacious" ? styles.spacious : "",
        divider === "top" ? styles.dividerTop : "",
        divider === "bottom" ? styles.dividerBottom : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasHeader ? (
        <div className={[styles.header, headerClassName].filter(Boolean).join(" ")}>
          <div className={styles.headerCopy}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {title ? <Heading className={styles.title}>{title}</Heading> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {action ? <div className={styles.action}>{action}</div> : null}
        </div>
      ) : null}

      {children ? (
        <div className={[styles.content, contentClassName].filter(Boolean).join(" ")}>
          {children}
        </div>
      ) : null}
    </Container>
  );
}
