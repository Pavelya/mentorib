import type { HTMLAttributes, ReactNode } from "react";

import styles from "./panel.module.css";

type PanelTone = "default" | "soft" | "mist" | "warm" | "raised" | "forest";
type PanelTag = "article" | "div" | "section";
type HeadingTag = "h1" | "h2" | "h3" | "p";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelTag;
  contentClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  eyebrow?: ReactNode;
  eyebrowClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
  headerClassName?: string;
  title?: ReactNode;
  titleAs?: HeadingTag;
  titleClassName?: string;
  tone?: PanelTone;
};

export function Panel({
  as = "section",
  children,
  className,
  contentClassName,
  description,
  descriptionClassName,
  eyebrow,
  eyebrowClassName,
  footer,
  footerClassName,
  headerClassName,
  title,
  titleAs = "h2",
  titleClassName,
  tone = "default",
  ...props
}: PanelProps) {
  const Container = as;
  const Heading = titleAs;

  return (
    <Container
      {...props}
      className={[styles.panel, styles[tone], className].filter(Boolean).join(" ")}
    >
      {eyebrow || title || description ? (
        <div className={[styles.header, headerClassName].filter(Boolean).join(" ")}>
          {eyebrow ? (
            <p className={[styles.eyebrow, eyebrowClassName].filter(Boolean).join(" ")}>
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <Heading className={[styles.title, titleClassName].filter(Boolean).join(" ")}>
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className={[styles.description, descriptionClassName].filter(Boolean).join(" ")}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children ? (
        <div className={[styles.content, contentClassName].filter(Boolean).join(" ")}>
          {children}
        </div>
      ) : null}

      {footer ? (
        <p className={[styles.footer, footerClassName].filter(Boolean).join(" ")}>{footer}</p>
      ) : null}
    </Container>
  );
}
