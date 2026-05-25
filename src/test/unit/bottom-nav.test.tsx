import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Route } from "next";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
let currentPathname = "/results";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => currentPathname,
}));

import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";
import type { NavItem } from "@/lib/routing/navigation";

const studentCore: BottomNavItem[] = [
  { href: "/match" as Route, label: "Get Matched", iconKey: "studentRole" },
  { href: "/results" as Route, label: "My matches", iconKey: "users" },
  { href: "/lessons" as Route, label: "Lessons", iconKey: "calendar" },
  { href: "/messages" as Route, label: "Messages", iconKey: "messageSquare" },
];

const studentOverflow: NavItem[] = [
  { href: "/tutors" as Route, label: "Find Tutors" },
  { href: "/saved" as Route, label: "Saved" },
  { href: "/compare" as Route, label: "Compare" },
];

describe("BottomNav", () => {
  it("renders the four core slots plus a More trigger", () => {
    currentPathname = "/results";
    render(
      <BottomNav
        aria-label="Student primary navigation"
        items={studentCore}
        overflowItems={studentOverflow}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Student primary navigation" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);

    expect(within(nav).getByRole("link", { name: /Get Matched/ })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Lessons/ })).toBeInTheDocument();

    const more = within(nav).getByRole("button", { name: /More/ });
    expect(more).toHaveAttribute("aria-haspopup", "menu");
    expect(more).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the slot matching the active pathname with aria-current", () => {
    currentPathname = "/lessons/123";
    render(
      <BottomNav
        aria-label="Student primary navigation"
        items={studentCore}
        overflowItems={studentOverflow}
      />,
    );

    const active = screen.getByRole("link", { name: /Lessons/ });
    expect(active).toHaveAttribute("aria-current", "page");

    const inactive = screen.getByRole("link", { name: /Messages/ });
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("opens the More menu and exposes overflow items", async () => {
    currentPathname = "/results";
    const user = userEvent.setup();
    render(
      <BottomNav
        aria-label="Student primary navigation"
        items={studentCore}
        overflowItems={studentOverflow}
      />,
    );

    const trigger = screen.getByRole("button", { name: /More/ });
    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Find Tutors");
    expect(items[2]).toHaveTextContent("Compare");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("routes via router.push when an overflow item is selected", async () => {
    pushMock.mockClear();
    currentPathname = "/results";
    const user = userEvent.setup();
    render(
      <BottomNav
        aria-label="Student primary navigation"
        items={studentCore}
        overflowItems={studentOverflow}
      />,
    );

    await user.click(screen.getByRole("button", { name: /More/ }));
    const menu = await screen.findByRole("menu");
    const compare = within(menu).getByRole("menuitem", { name: "Compare" });
    await user.click(compare);

    expect(pushMock).toHaveBeenCalledWith("/compare");
  });

  it("renders without a More trigger when overflowItems is omitted", () => {
    currentPathname = "/match";
    render(<BottomNav aria-label="Test" items={studentCore} />);

    expect(screen.queryByRole("button", { name: /More/ })).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});
