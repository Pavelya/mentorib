import { render, screen, within } from "@testing-library/react";
import type { Route } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
let currentPathname = "/results";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => currentPathname,
}));

import { AppFrameNav } from "@/components/shell/app-frame-nav";
import type { NavItem } from "@/lib/routing/navigation";

const studentItems: NavItem[] = [
  { href: "/match" as Route, label: "Get Matched", group: "Find" },
  { href: "/results" as Route, label: "My matches", group: "Find" },
  { href: "/tutors" as Route, label: "Find Tutors", group: "Find" },
  { href: "/saved" as Route, label: "Saved", group: "Decide" },
  { href: "/compare" as Route, label: "Compare", group: "Decide" },
];

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("AppFrameNav", () => {
  beforeEach(() => {
    pushMock.mockClear();
    currentPathname = "/results";
    vi.stubGlobal("ResizeObserver", StubResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every nav item as a link by default", () => {
    render(<AppFrameNav ariaLabel="Student navigation" items={studentItems} />);

    const nav = screen.getByRole("navigation", { name: "Student navigation" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(studentItems.length);
    expect(links[0]).toHaveTextContent("Get Matched");
    expect(links[4]).toHaveTextContent("Compare");
  });

  it("marks the active link with aria-current matching the active pathname", () => {
    currentPathname = "/results/123";
    render(<AppFrameNav ariaLabel="Student navigation" items={studentItems} />);

    const nav = screen.getByRole("navigation", { name: "Student navigation" });
    const active = within(nav).getByRole("link", { name: "My matches" });
    expect(active).toHaveAttribute("aria-current", "page");

    const inactive = within(nav).getByRole("link", { name: "Saved" });
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("does not render a More trigger when nothing overflows", () => {
    render(<AppFrameNav ariaLabel="Student navigation" items={studentItems} />);
    expect(screen.queryByRole("button", { name: /More/ })).toBeNull();
  });
});
