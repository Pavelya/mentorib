import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import {
  AvatarMenu,
  DEFAULT_AVATAR_MENU_ITEMS,
} from "@/components/shell/avatar-menu";
import type { ViewerIdentity } from "@/lib/identity/viewer";

const viewer: ViewerIdentity = {
  avatarUrl: null,
  displayName: "Pavel Yampolsky",
};

describe("AvatarMenu", () => {
  it("renders a button trigger that exposes the menu-button wiring", () => {
    render(<AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on click, focuses the first item, and exposes the five default entries", async () => {
    const user = userEvent.setup();
    render(<AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });

    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent("Settings");
    expect(items[4]).toHaveTextContent("Sign out");
    expect(items[0]).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("cycles focus with arrow keys", async () => {
    const user = userEvent.setup();
    render(<AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />);
    await user.click(screen.getByRole("button", { name: "Account menu" }));

    const items = within(await screen.findByRole("menu")).getAllByRole("menuitem");

    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(items[0]).toHaveFocus();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />);
    const trigger = screen.getByRole("button", { name: "Account menu" });
    await user.click(trigger);
    await screen.findByRole("menu");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("navigates via router.push when a link-style item is selected", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />);
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await screen.findByRole("menu");

    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });

  it("submits the hidden sign-out form when the destructive item is selected", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    const { container } = render(
      <AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />,
    );

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    const submitSpy = vi
      .spyOn(form as HTMLFormElement, "requestSubmit")
      .mockImplementation(() => {});

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    const items = within(await screen.findByRole("menu")).getAllByRole("menuitem");

    await user.keyboard("{End}");
    expect(items[4]).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(submitSpy).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    submitSpy.mockRestore();
  });
});
