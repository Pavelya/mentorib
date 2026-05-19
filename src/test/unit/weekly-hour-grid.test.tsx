import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WeeklyHourGrid, type SlotKey } from "@/components/ui/weekly-hour-grid";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function Harness({
  initial = new Set<SlotKey>(),
  onChangeSpy,
  startHour,
  endHour,
}: {
  initial?: Set<SlotKey>;
  onChangeSpy?: (next: Set<SlotKey>) => void;
  startHour?: number;
  endHour?: number;
}) {
  const [value, setValue] = useState<Set<SlotKey>>(initial);
  return (
    <WeeklyHourGrid
      aria-label="Weekly availability"
      dayLabels={DAY_LABELS}
      endHour={endHour}
      onChange={(next) => {
        setValue(next);
        onChangeSpy?.(next);
      }}
      startHour={startHour}
      value={value}
    />
  );
}

describe("WeeklyHourGrid", () => {
  it("renders a 7-column × 24-row grid by default", () => {
    render(<Harness />);

    const grid = screen.getByRole("grid", { name: "Weekly availability" });
    expect(grid).toHaveAttribute("aria-rowcount", "25");
    expect(grid).toHaveAttribute("aria-colcount", "8");
    expect(screen.getAllByRole("gridcell").length).toBe(7 * 24);
  });

  it("clicking a cell toggles aria-pressed and fires onChange with the updated set", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);

    const cell = screen.getByRole("gridcell", {
      name: "Mon 09:00, unavailable",
    });
    expect(cell).toHaveAttribute("aria-pressed", "false");

    await user.click(cell);

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    const firstCall = onChangeSpy.mock.calls[0][0] as Set<SlotKey>;
    expect(Array.from(firstCall)).toEqual(["1:9"]);

    const updated = screen.getByRole("gridcell", {
      name: "Mon 09:00, available",
    });
    expect(updated).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking a selected cell unmarks it", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Harness
        initial={new Set<SlotKey>(["1:9"])}
        onChangeSpy={onChangeSpy}
      />,
    );

    const cell = screen.getByRole("gridcell", {
      name: "Mon 09:00, available",
    });
    await user.click(cell);

    const lastCall = onChangeSpy.mock.calls.at(-1)?.[0] as Set<SlotKey>;
    expect(lastCall.size).toBe(0);
  });

  it("supports arrow / Home / End keyboard navigation", async () => {
    render(<Harness />);

    const start = screen.getByRole("gridcell", {
      name: "Sun 00:00, unavailable",
    });
    start.focus();

    fireEvent.keyDown(start, { key: "ArrowRight" });
    expect(
      screen.getByRole("gridcell", { name: "Mon 00:00, unavailable" }),
    ).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(
      screen.getByRole("gridcell", { name: "Mon 01:00, unavailable" }),
    ).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(
      screen.getByRole("gridcell", { name: "Sat 01:00, unavailable" }),
    ).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(
      screen.getByRole("gridcell", { name: "Sun 01:00, unavailable" }),
    ).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(
      screen.getByRole("gridcell", { name: "Sun 00:00, unavailable" }),
    ).toHaveFocus();
  });

  it("Page Up / Page Down move focus by six rows", () => {
    render(<Harness />);

    const start = screen.getByRole("gridcell", {
      name: "Sun 00:00, unavailable",
    });
    start.focus();

    fireEvent.keyDown(start, { key: "PageDown" });
    expect(
      screen.getByRole("gridcell", { name: "Sun 06:00, unavailable" }),
    ).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: "PageUp" });
    expect(
      screen.getByRole("gridcell", { name: "Sun 00:00, unavailable" }),
    ).toHaveFocus();
  });

  it("Space and Enter toggle the focused cell", () => {
    const onChangeSpy = vi.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);

    const cell = screen.getByRole("gridcell", {
      name: "Sun 00:00, unavailable",
    });
    cell.focus();

    fireEvent.keyDown(cell, { key: " " });
    expect(onChangeSpy).toHaveBeenLastCalledWith(new Set<SlotKey>(["0:0"]));

    const refreshed = screen.getByRole("gridcell", {
      name: "Sun 00:00, available",
    });
    refreshed.focus();
    fireEvent.keyDown(refreshed, { key: "Enter" });
    expect(onChangeSpy).toHaveBeenLastCalledWith(new Set<SlotKey>());
  });

  it("disables interaction when disabled prop is set", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();

    function DisabledHarness() {
      const [value] = useState<Set<SlotKey>>(new Set());
      return (
        <WeeklyHourGrid
          aria-label="Weekly availability"
          dayLabels={DAY_LABELS}
          disabled
          onChange={onChangeSpy}
          value={value}
        />
      );
    }

    render(<DisabledHarness />);

    const cell = screen.getByRole("gridcell", {
      name: "Sun 00:00, unavailable",
    });
    expect(cell).toBeDisabled();
    await user.click(cell);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });
});
