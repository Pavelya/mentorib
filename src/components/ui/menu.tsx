"use client";

import {
  createContext,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Icon, type IconKey } from "./icon";
import styles from "./menu.module.css";
import { Popover, type PopoverPlacement } from "./popover";

export type MenuItemTone = "default" | "destructive";

export type MenuItemProps = {
  children: ReactNode;
  disabled?: boolean;
  icon?: IconKey;
  onSelect: () => void;
  tone?: MenuItemTone;
};

export type MenuProps = {
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  contentId?: string;
  defaultOpen?: boolean;
  labelledBy?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: PopoverPlacement;
};

type MenuContextValue = {
  registerItem: (node: HTMLButtonElement | null) => () => void;
  close: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function focusableIndex(items: HTMLButtonElement[]): number {
  const active = document.activeElement;
  return items.findIndex((node) => node === active);
}

export function Menu({
  anchorRef,
  children,
  className,
  contentId,
  defaultOpen,
  labelledBy,
  onOpenChange,
  open,
  placement = "bottom-start",
}: MenuProps) {
  const generatedId = useId();
  const id = contentId ?? `menu-${generatedId}`;
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const typeAheadRef = useRef<{ buffer: string; timer: number | null }>({
    buffer: "",
    timer: null,
  });

  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isOpen = isControlled ? Boolean(open) : internalOpen;

  const requestClose = useCallback(() => {
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  const registerItem = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return () => {};
    itemsRef.current.push(node);
    return () => {
      itemsRef.current = itemsRef.current.filter((entry) => entry !== node);
    };
  }, []);

  const focusables = useCallback(() => {
    return itemsRef.current.filter(
      (node) =>
        node.isConnected && node.getAttribute("aria-disabled") !== "true",
    );
  }, []);

  const focusIndex = useCallback(
    (index: number) => {
      const list = focusables();
      if (list.length === 0) return;
      const safe = ((index % list.length) + list.length) % list.length;
      list[safe].focus();
    },
    [focusables],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const list = focusables();
      if (list.length === 0) return;
      const current = focusableIndex(list);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusIndex(current < 0 ? 0 : current + 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusIndex(current < 0 ? list.length - 1 : current - 1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        focusIndex(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        focusIndex(list.length - 1);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        /\S/.test(event.key)
      ) {
        const state = typeAheadRef.current;
        if (state.timer !== null) window.clearTimeout(state.timer);

        const incoming = event.key.toLowerCase();
        const previous = state.buffer;
        const candidateBuffer = previous + incoming;
        const startIndex = current < 0 ? -1 : current;

        function findStartingWith(query: string, from: number) {
          for (let offset = 1; offset <= list.length; offset += 1) {
            const probe = (from + offset + list.length) % list.length;
            const node = list[probe];
            if (
              (node.textContent ?? "").trim().toLowerCase().startsWith(query)
            ) {
              return { node, index: probe };
            }
          }
          return null;
        }

        let match = findStartingWith(candidateBuffer, startIndex);
        let nextBuffer = candidateBuffer;

        if (!match) {
          match = findStartingWith(incoming, startIndex);
          nextBuffer = incoming;
        }

        if (match) {
          match.node.focus();
          state.buffer = nextBuffer;
          state.timer = window.setTimeout(() => {
            state.buffer = "";
            state.timer = null;
          }, 500);
        }
      }
    },
    [focusables, focusIndex, requestClose],
  );

  const contextValue = useMemo<MenuContextValue>(
    () => ({ registerItem, close: requestClose }),
    [registerItem, requestClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      const list = focusables();
      if (list.length > 0) list[0].focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen, focusables]);

  return (
    <MenuContext.Provider value={contextValue}>
      <Popover
        anchorRef={anchorRef}
        className={[styles.menu, className].filter(Boolean).join(" ")}
        contentId={id}
        onOpenChange={(next) => {
          if (!isControlled) setInternalOpen(next);
          onOpenChange?.(next);
        }}
        open={isOpen}
        placement={placement}
        role="menu"
      >
        <div
          aria-labelledby={labelledBy}
          className={styles.list}
          onKeyDown={onKeyDown}
        >
          {children}
        </div>
      </Popover>
    </MenuContext.Provider>
  );
}

export function MenuItem({
  children,
  disabled = false,
  icon,
  onSelect,
  tone = "default",
}: MenuItemProps) {
  const context = useContext(MenuContext);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!context) return;
    return context.registerItem(buttonRef.current);
  }, [context]);

  return (
    <button
      aria-disabled={disabled || undefined}
      className={[styles.item, tone === "destructive" ? styles.destructive : ""]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        if (disabled) return;
        onSelect();
        context?.close();
      }}
      ref={buttonRef}
      role="menuitem"
      tabIndex={-1}
      type="button"
    >
      {icon ? (
        <span aria-hidden="true" className={styles.itemIcon}>
          <Icon name={icon} size={16} />
        </span>
      ) : null}
      <span className={styles.itemLabel}>{children}</span>
    </button>
  );
}

export function MenuSeparator() {
  return <div className={styles.separator} role="separator" />;
}

export type { PopoverPlacement };
