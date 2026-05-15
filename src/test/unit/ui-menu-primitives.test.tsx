import { useRef, useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Chip } from "@/components/ui/chip";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { OverflowMenuTrigger } from "@/components/ui/overflow-menu-trigger";
import {
  getPopoverTriggerProps,
  Popover,
} from "@/components/ui/popover";

function PopoverHarness({
  onClose,
}: {
  onClose?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        {...getPopoverTriggerProps({ contentId: "popover-test", haspopup: "dialog", open })}
        onClick={() => setOpen((current) => !current)}
      >
        Open
      </button>
      <Popover
        anchorRef={triggerRef}
        contentId="popover-test"
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onClose?.();
        }}
        open={open}
        role="dialog"
      >
        <button type="button">Inside action</button>
      </Popover>
    </div>
  );
}

describe("Popover", () => {
  it("opens, focuses content, and emits aria-haspopup/expanded on the trigger", async () => {
    const user = userEvent.setup();
    render(<PopoverHarness />);

    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const inside = await screen.findByRole("button", { name: "Inside action" });
    expect(inside).toHaveFocus();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PopoverHarness onClose={onClose} />);

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("button", { name: "Inside action" });

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Inside action" })).toBeNull();
  });

  it("closes on outside pointer down", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <PopoverHarness />
        <span data-testid="outside">outside</span>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("button", { name: "Inside action" });

    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(screen.queryByRole("button", { name: "Inside action" })).toBeNull();
  });
});

function MenuHarness({ onSelect }: { onSelect: (key: string) => void }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <OverflowMenuTrigger
        aria-label="Conversation options"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        {...getPopoverTriggerProps({ contentId: "menu-test", haspopup: "menu", open })}
      />
      <Menu
        anchorRef={triggerRef}
        contentId="menu-test"
        onOpenChange={setOpen}
        open={open}
      >
        <MenuItem onSelect={() => onSelect("mute")}>Mute conversation</MenuItem>
        <MenuItem onSelect={() => onSelect("archive")}>Archive</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => onSelect("block")} tone="destructive">
          Block user
        </MenuItem>
      </Menu>
    </div>
  );
}

describe("Menu + OverflowMenuTrigger", () => {
  it("renders the trigger with the required aria-label and menu wiring", () => {
    render(<MenuHarness onSelect={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Conversation options" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the menu, exposes role='menu' + role='menuitem', and supports arrow + Home/End nav", async () => {
    const user = userEvent.setup();
    render(<MenuHarness onSelect={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Conversation options" });

    await user.click(trigger);
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(3);

    expect(items[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{End}");
    expect(items[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(items[2]).toHaveFocus();
  });

  it("supports type-ahead focus by first letter", async () => {
    const user = userEvent.setup();
    render(<MenuHarness onSelect={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Conversation options" }));
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");

    await user.keyboard("a");
    expect(items[1]).toHaveFocus(); // "Archive"

    await user.keyboard("b");
    expect(items[2]).toHaveFocus(); // "Block user"
  });

  it("activates the focused item on Enter and closes the menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MenuHarness onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Conversation options" });
    await user.click(trigger);
    await screen.findByRole("menu");

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("archive");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("Escape closes without activating", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MenuHarness onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Conversation options" });
    await user.click(trigger);
    await screen.findByRole("menu");

    await user.keyboard("{Escape}");
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
  });
});

describe("Chip pressed state", () => {
  it("emits aria-pressed only when the chip is interactive", () => {
    const { rerender } = render(
      <Chip pressed tone="default">
        Subjects
      </Chip>,
    );
    expect(screen.getByText("Subjects")).not.toHaveAttribute("aria-pressed");

    rerender(
      <Chip onClick={() => {}} pressed tone="default">
        Subjects
      </Chip>,
    );
    expect(screen.getByText("Subjects")).toHaveAttribute("aria-pressed", "true");

    rerender(
      <Chip onClick={() => {}} pressed={false} tone="default">
        Subjects
      </Chip>,
    );
    expect(screen.getByText("Subjects")).toHaveAttribute("aria-pressed", "false");
  });

  it("applies the pressed class so the visual state is distinct from the resting tone", () => {
    render(
      <Chip onClick={() => {}} pressed tone="positive">
        Active
      </Chip>,
    );
    const chip = screen.getByText("Active");
    const classNames = chip.className.split(/\s+/);
    expect(classNames.some((cls) => cls.includes("pressed"))).toBe(true);
    expect(classNames.some((cls) => cls.includes("positive"))).toBe(true);
  });
});
