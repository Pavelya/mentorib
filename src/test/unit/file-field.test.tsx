import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileField } from "@/components/ui/file-field";

describe("FileField", () => {
  it("renders the label, description, and a branded trigger button", () => {
    render(
      <FileField
        accept="application/pdf"
        description="PDF up to 15 MB."
        label="Credential file"
        name="file"
      />,
    );

    expect(screen.getByText("Credential file")).toBeInTheDocument();
    expect(screen.getByText("PDF up to 15 MB.")).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Choose file" });
    expect(trigger).toBeInTheDocument();
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("renders the error message and marks the trigger invalid", () => {
    render(
      <FileField
        error="Please attach a file."
        label="Credential file"
        name="file"
      />,
    );

    expect(screen.getByText("Please attach a file.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose file" })).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("passes the accept attribute through to the native input", () => {
    const { container } = render(
      <FileField
        accept="application/pdf,image/jpeg"
        label="Credential file"
        name="file"
      />,
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "application/pdf,image/jpeg");
    expect(input).toHaveAttribute("name", "file");
  });

  it("respects the disabled prop on both the trigger and the input", () => {
    const { container } = render(
      <FileField disabled label="Credential file" name="file" />,
    );

    expect(screen.getByRole("button", { name: "Choose file" })).toBeDisabled();
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  it("clicking the trigger opens the native file picker", () => {
    const { container } = render(
      <FileField label="Credential file" name="file" />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const inputClick = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "Choose file" }));

    expect(inputClick).toHaveBeenCalledTimes(1);
  });

  it("shows the chosen filename when a file is selected", () => {
    const { container } = render(
      <FileField label="Credential file" name="file" />,
    );

    expect(screen.getByText("No file chosen")).toBeInTheDocument();

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["data"], "diploma.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("diploma.pdf")).toBeInTheDocument();
  });

  it("emits onFilesChange with the selected FileList", () => {
    const onFilesChange = vi.fn();
    const { container } = render(
      <FileField
        label="Credential file"
        name="file"
        onFilesChange={onFilesChange}
      />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["data"], "diploma.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesChange).toHaveBeenCalledTimes(1);
    const files = onFilesChange.mock.calls[0][0] as FileList;
    expect(files?.[0].name).toBe("diploma.pdf");
  });
});
