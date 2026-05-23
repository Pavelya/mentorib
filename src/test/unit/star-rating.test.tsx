import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StarRating } from "@/components/ui/star-rating";

describe("StarRating display mode", () => {
  it("renders the default 5 stars with the value count filled", () => {
    render(<StarRating mode="display" value={3} />);

    const group = screen.getByRole("img", { name: "3 out of 5 stars" });
    expect(group).toBeInTheDocument();

    const icons = group.querySelectorAll("svg");
    expect(icons).toHaveLength(5);

    const filledCount = Array.from(icons).filter(
      (icon) => icon.getAttribute("fill") === "currentColor",
    ).length;
    expect(filledCount).toBe(3);
  });

  it("respects custom max and aria-label", () => {
    render(
      <StarRating
        aria-label="Rated 2 out of 4 stars"
        max={4}
        mode="display"
        value={2}
      />,
    );

    const group = screen.getByRole("img", { name: "Rated 2 out of 4 stars" });
    expect(group.querySelectorAll("svg")).toHaveLength(4);
  });

  it("clamps values outside [0, max]", () => {
    render(<StarRating max={5} mode="display" value={9} />);

    const group = screen.getByRole("img", { name: "5 out of 5 stars" });
    const filledCount = Array.from(group.querySelectorAll("svg")).filter(
      (icon) => icon.getAttribute("fill") === "currentColor",
    ).length;
    expect(filledCount).toBe(5);
  });
});

describe("StarRating input mode", () => {
  function Harness({
    initial = 0,
    onChangeSpy,
    error,
  }: {
    initial?: number;
    onChangeSpy?: (next: number) => void;
    error?: string;
  }) {
    const [value, setValue] = useState<number>(initial);
    return (
      <StarRating
        error={error}
        legend="Rate this lesson"
        mode="input"
        name="ratingValue"
        onChange={(next) => {
          setValue(next);
          onChangeSpy?.(next);
        }}
        value={value}
      />
    );
  }

  it("renders a fieldset with the legend and the configured number of radio inputs", () => {
    render(<Harness />);

    const group = screen.getByRole("group", { name: "Rate this lesson" });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "ratingValue");
    });
  });

  it("submits the chosen integer via the named field when clicked", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);

    const fourth = screen.getByRole("radio", { name: "4 stars" });
    await user.click(fourth);

    expect(onChangeSpy).toHaveBeenLastCalledWith(4);
    expect((fourth as HTMLInputElement).checked).toBe(true);
    expect((fourth as HTMLInputElement).value).toBe("4");
  });

  it("supports arrow / Home / End keyboard navigation", () => {
    const onChangeSpy = vi.fn();
    render(<Harness initial={3} onChangeSpy={onChangeSpy} />);

    const radios = screen.getAllByRole("radio");
    const third = radios[2];
    third.focus();

    fireEvent.keyDown(third, { key: "ArrowRight" });
    expect(onChangeSpy).toHaveBeenLastCalledWith(4);

    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(onChangeSpy).toHaveBeenLastCalledWith(3);

    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);

    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(onChangeSpy).toHaveBeenLastCalledWith(1);
  });

  it("Space and Enter select the focused option", () => {
    const onChangeSpy = vi.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);

    const radios = screen.getAllByRole("radio");
    const second = radios[1];
    second.focus();

    fireEvent.keyDown(second, { key: " " });
    expect(onChangeSpy).toHaveBeenLastCalledWith(2);

    const fifth = radios[4];
    fifth.focus();
    fireEvent.keyDown(fifth, { key: "Enter" });
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);
  });

  it("renders an error message with role=alert when provided", () => {
    render(<Harness error="Pick a rating between 1 and 5 stars." />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Pick a rating between 1 and 5 stars.");
    const group = screen.getByRole("group", { name: "Rate this lesson" });
    expect(group).toHaveAttribute("aria-invalid", "true");
  });
});
