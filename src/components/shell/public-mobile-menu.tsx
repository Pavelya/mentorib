"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { Icon, Menu, MenuItem, MenuSeparator } from "@/components/ui";
import type { NavItem } from "@/lib/routing/navigation";

import styles from "./public-mobile-menu.module.css";

export type PublicMobileMenuProps = {
  navItems: NavItem[];
  signInHref?: Route;
  workspaceShortcut?: { href: Route; label: string };
};

export function PublicMobileMenu({
  navItems,
  signInHref,
  workspaceShortcut,
}: PublicMobileMenuProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className={styles.root}>
      <button
        aria-controls={open ? contentId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open navigation menu"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <Icon name="menu" size={20} />
      </button>

      <Menu
        anchorRef={triggerRef}
        className={styles.drawer}
        contentId={contentId}
        onOpenChange={setOpen}
        open={open}
        placement="bottom-start"
      >
        {workspaceShortcut ? (
          <MenuItem
            icon="users"
            onSelect={() => router.push(workspaceShortcut.href)}
          >
            {workspaceShortcut.label}
          </MenuItem>
        ) : null}
        {workspaceShortcut ? <MenuSeparator /> : null}
        {navItems.map((item) => (
          <MenuItem
            key={item.href as string}
            onSelect={() => router.push(item.href)}
          >
            {item.label}
          </MenuItem>
        ))}
        {signInHref ? <MenuSeparator /> : null}
        {signInHref ? (
          <MenuItem onSelect={() => router.push(signInHref)}>Sign in</MenuItem>
        ) : null}
      </Menu>
    </div>
  );
}
