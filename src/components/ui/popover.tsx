"use client";

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

const subscribeNoop = () => () => {};
const hasDocument = () => typeof document !== "undefined";
const noDocument = () => false;

import styles from "./popover.module.css";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";

export type PopoverProps = {
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  contentId?: string;
  defaultOpen?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: PopoverPlacement;
  returnFocus?: boolean;
  role?: "dialog" | "menu" | "listbox" | "group";
};

type Position = { left: number; top: number; placement: PopoverPlacement };

const VIEWPORT_PADDING = 8;

function resolvePlacement(
  anchorRect: DOMRect,
  surface: { width: number; height: number },
  desired: PopoverPlacement,
  viewport: { width: number; height: number },
): Position {
  const spaceBelow = viewport.height - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  const wantsTop = desired.startsWith("top");
  const flipsVertically = wantsTop
    ? spaceAbove < surface.height + VIEWPORT_PADDING &&
      spaceBelow > spaceAbove
    : spaceBelow < surface.height + VIEWPORT_PADDING &&
      spaceAbove > spaceBelow;

  const verticalSide = flipsVertically
    ? wantsTop
      ? "bottom"
      : "top"
    : wantsTop
      ? "top"
      : "bottom";

  const desiredEnd = desired.endsWith("end");
  let horizontalAlign: "start" | "end" = desiredEnd ? "end" : "start";

  let left =
    horizontalAlign === "end"
      ? anchorRect.right - surface.width
      : anchorRect.left;

  if (left < VIEWPORT_PADDING) {
    left = anchorRect.left;
    horizontalAlign = "start";
  }
  if (left + surface.width > viewport.width - VIEWPORT_PADDING) {
    left = anchorRect.right - surface.width;
    horizontalAlign = "end";
  }
  if (left < VIEWPORT_PADDING) {
    left = Math.max(VIEWPORT_PADDING, Math.min(left, viewport.width - surface.width - VIEWPORT_PADDING));
  }

  const top =
    verticalSide === "top"
      ? anchorRect.top - surface.height
      : anchorRect.bottom;

  const placement = `${verticalSide}-${horizontalAlign}` as PopoverPlacement;

  return { left, top, placement };
}

function isFocusable(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  const tabIndex = element.getAttribute("tabindex");
  if (tabIndex !== null && Number(tabIndex) < 0) return false;
  const tag = element.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
    return true;
  }
  return tabIndex !== null;
}

function collectFocusable(root: HTMLElement): HTMLElement[] {
  const candidates = root.querySelectorAll<HTMLElement>(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="menuitem"]:not([aria-disabled="true"])',
  );
  return Array.from(candidates).filter(isFocusable);
}

export function usePopoverState(controlled?: boolean, defaultOpen = false) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlled !== undefined;
  const open = isControlled ? Boolean(controlled) : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
    },
    [isControlled],
  );
  return { open, setOpen, isControlled };
}

type TriggerWiringOptions = {
  contentId: string;
  haspopup?: "menu" | "dialog" | "listbox" | "true";
  open: boolean;
};

export function getPopoverTriggerProps({
  contentId,
  haspopup = "menu",
  open,
}: TriggerWiringOptions) {
  return {
    "aria-controls": open ? contentId : undefined,
    "aria-expanded": open,
    "aria-haspopup": haspopup,
  } as const;
}

export function Popover({
  anchorRef,
  children,
  className,
  contentId,
  defaultOpen = false,
  initialFocusRef,
  onOpenChange,
  open: openProp,
  placement = "bottom-start",
  returnFocus = true,
  role = "dialog",
}: PopoverProps) {
  const generatedId = useId();
  const id = contentId ?? `popover-${generatedId}`;
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? Boolean(openProp) : internalOpen;

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const mounted = useSyncExternalStore(subscribeNoop, hasDocument, noDocument);

  const requestClose = useCallback(() => {
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const surface = surfaceRef.current;
    if (!anchor || !surface) return;

    function update() {
      if (!anchor || !surface) return;
      const rect = anchor.getBoundingClientRect();
      const size = {
        width: surface.offsetWidth,
        height: surface.offsetHeight,
      };
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setPosition(resolvePlacement(rect, size, placement, viewport));
    }

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, placement, anchorRef]);

  useEffect(() => {
    if (!open || !mounted) return;
    const surface = surfaceRef.current;
    if (!surface) return;

    const target =
      initialFocusRef?.current ?? collectFocusable(surface)[0] ?? surface;
    target.focus({ preventScroll: true });
    // Intentionally fires only when the popover first opens (gated by `open`
    // and `mounted`). Consumers like Menu manage their own internal focus
    // after mount, and we don't want layout-driven position updates to steal
    // focus back to the surface.
  }, [open, mounted, initialFocusRef]);

  useEffect(() => {
    if (open) return;
    if (!returnFocus) return;
    const previous = previousFocusRef.current;
    if (previous && typeof previous.focus === "function") {
      previous.focus({ preventScroll: true });
    }
  }, [open, returnFocus]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const surface = surfaceRef.current;
      if (!surface) return;
      const focusable = collectFocusable(surface);
      if (focusable.length === 0) {
        event.preventDefault();
        surface.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !surface.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(event: MouseEvent) {
      const surface = surfaceRef.current;
      const anchor = anchorRef.current;
      const target = event.target as Node | null;
      if (!target) return;
      if (surface?.contains(target)) return;
      if (anchor?.contains(target)) return;
      requestClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, anchorRef, requestClose]);

  const surfaceStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!position) {
      return { visibility: "hidden", left: 0, top: 0 };
    }
    return { left: position.left, top: position.top };
  }, [position]);

  if (!mounted || !open) return null;

  const surface = (
    <div
      aria-modal={role === "dialog" ? "false" : undefined}
      className={[styles.surface, className].filter(Boolean).join(" ")}
      data-placement={position?.placement ?? placement}
      id={id}
      ref={surfaceRef}
      role={role}
      style={surfaceStyle}
      tabIndex={-1}
    >
      {children}
    </div>
  );

  return createPortal(surface, document.body);
}
