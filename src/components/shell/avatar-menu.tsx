"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import {
  Avatar,
  type IconKey,
  Menu,
  MenuItem,
  MenuSeparator,
} from "@/components/ui";
import type { ViewerIdentity } from "@/lib/identity/viewer";

import styles from "./avatar-menu.module.css";

export type AvatarMenuItem = {
  href?: Route;
  iconKey?: IconKey;
  label: string;
  onSelect?: () => void;
  tone?: "default" | "danger";
};

export type AvatarMenuProps = {
  "aria-label"?: string;
  items: AvatarMenuItem[];
  signOutAction?: Route;
  viewer: ViewerIdentity;
};

const DEFAULT_SIGN_OUT_ACTION = "/auth/sign-out" as Route;

export const DEFAULT_AVATAR_MENU_ITEMS: AvatarMenuItem[] = [
  { href: "/settings" as Route, iconKey: "users", label: "Settings" },
  {
    href: "/notifications" as Route,
    iconKey: "messageSquare",
    label: "Notifications",
  },
  { href: "/privacy" as Route, iconKey: "shield", label: "Privacy" },
  { href: "/billing" as Route, iconKey: "fileText", label: "Billing" },
  { iconKey: "x", label: "Sign out", tone: "danger" },
];

export function AvatarMenu({
  "aria-label": ariaLabel = "Account menu",
  items,
  signOutAction = DEFAULT_SIGN_OUT_ACTION,
  viewer,
}: AvatarMenuProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const signOutFormRef = useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = useState(false);
  const contentId = useId();

  function handleSelect(item: AvatarMenuItem) {
    if (item.onSelect) {
      item.onSelect();
      return;
    }
    if (item.tone === "danger") {
      signOutFormRef.current?.requestSubmit();
      return;
    }
    if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <>
      <button
        aria-controls={open ? contentId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <Avatar
          decorative
          name={viewer.displayName}
          size="sm"
          src={viewer.avatarUrl ?? undefined}
        />
      </button>

      <Menu
        anchorRef={triggerRef}
        contentId={contentId}
        onOpenChange={setOpen}
        open={open}
        placement="bottom-end"
      >
        {items.map((item, index) => {
          const isSeparatorBeforeDanger =
            item.tone === "danger" && index > 0 && items[index - 1].tone !== "danger";
          return (
            <MenuMaybeWithSeparator
              item={item}
              key={`${item.label}-${index}`}
              onSelect={() => handleSelect(item)}
              withSeparator={isSeparatorBeforeDanger}
            />
          );
        })}
      </Menu>

      <form
        action={signOutAction}
        className={styles.signOutForm}
        method="post"
        ref={signOutFormRef}
      />
    </>
  );
}

type MenuMaybeWithSeparatorProps = {
  item: AvatarMenuItem;
  onSelect: () => void;
  withSeparator: boolean;
};

function MenuMaybeWithSeparator({ item, onSelect, withSeparator }: MenuMaybeWithSeparatorProps) {
  return (
    <>
      {withSeparator ? <MenuSeparator /> : null}
      <MenuItem
        icon={item.iconKey}
        onSelect={onSelect}
        tone={item.tone === "danger" ? "destructive" : "default"}
      >
        {item.label}
      </MenuItem>
    </>
  );
}

