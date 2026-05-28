import Link from "next/link";
import type { Route } from "next";
import type { HTMLAttributes, ReactNode } from "react";

import styles from "./page-header.module.css";

type HeadingTag = "h1" | "h2";

type PageHeaderBackLink = {
  href: Route;
  label: string;
};

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  backLink?: PageHeaderBackLink;
  description?: ReactNode;
  eyebrow?: ReactNode;
  status?: ReactNode;
  title: ReactNode;
  titleAs?: HeadingTag;
};

export function PageHeader({
  backLink,
  className,
  description,
  eyebrow,
  status,
  title,
  titleAs = "h1",
  ...props
}: PageHeaderProps) {
  const Heading = titleAs;

  return (
    <header
      {...props}
      className={[styles.header, className].filter(Boolean).join(" ")}
    >
      {backLink ? (
        <Link className={styles.backLink} href={backLink.href} prefetch={false}>
          {backLink.label}
        </Link>
      ) : null}
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <Heading className={styles.title}>{title}</Heading>
      {description ? <p className={styles.description}>{description}</p> : null}
      {status ? <div className={styles.statusRow}>{status}</div> : null}
    </header>
  );
}
