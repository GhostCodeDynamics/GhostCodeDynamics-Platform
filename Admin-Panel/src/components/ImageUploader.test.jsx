import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "./ImageUploader";

vi.mock("../services/adminUploadService", () => ({
  uploadAdminImage: vi.fn(),
}));

import { uploadAdminImage } from "../services/adminUploadService";

const fileInputOf = (container) => container.querySelector('input[type="file"]');

function makeFile(name = "shot.png", type = "image/png") {
  return new File(["fake-image-bytes"], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadAdminImage.mockResolvedValue({
    url: "https://res.cloudinary.com/demo/image/upload/v1/ghostcode-dynamics/projects/shot.png",
    publicId: "ghostcode-dynamics/projects/shot",
    width: 1200,
    height: 800,
    format: "png",
  });
});

describe("<ImageUploader />", () => {
  it("renders the dropzone when idle and reports no image", () => {
    render(<ImageUploader label="Project image" folder="projects" />);
    expect(screen.getByRole("button", { name: /upload project image/i })).toBeInTheDocument();
    expect(screen.getByText(/no image yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /replace image/i })).not.toBeInTheDocument();
  });

  it("shows the persisted asset in edit mode and offers replace/remove", () => {
    const value = {
      url: "https://res.cloudinary.com/demo/image/upload/v1/ghostcode-dynamics/covers/old.png",
      publicId: "ghostcode-dynamics/covers/old",
    };
    render(<ImageUploader label="Cover image" value={value} />);
    expect(screen.getByRole("img", { name: "Selected image preview" })).toHaveAttribute(
      "src",
      value.url
    );
    expect(screen.getByRole("button", { name: /replace image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove image/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload cover image/i })).not.toBeInTheDocument();
  });

  it("uploads a valid file and reports the asset to onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader label="Project image" folder="projects" onChange={onChange} />
    );

    fireEvent.change(fileInputOf(container), { target: { files: [makeFile()] } });

    await waitFor(() => expect(uploadAdminImage).toHaveBeenCalledTimes(1));
    expect(uploadAdminImage).toHaveBeenCalledWith(
      expect.objectContaining({ folder: "projects", replacePublicId: null })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("res.cloudinary.com"),
        publicId: "ghostcode-dynamics/projects/shot",
        fileName: "shot.png",
      })
    );
    const statuses = await screen.findAllByRole("status");
    expect(statuses.some((s) => s.textContent.includes("uploaded successfully"))).toBe(true);
  });

  it("passes the persisted public id for replacement uploads", async () => {
    const value = { url: "https://x/old.png", publicId: "ghostcode-dynamics/covers/old" };
    const { container } = render(<ImageUploader folder="covers" value={value} onChange={() => {}} />);

    fireEvent.change(fileInputOf(container), { target: { files: [makeFile()] } });

    await waitFor(() => expect(uploadAdminImage).toHaveBeenCalledTimes(1));
    expect(uploadAdminImage).toHaveBeenCalledWith(
      expect.objectContaining({ folder: "covers", replacePublicId: "ghostcode-dynamics/covers/old" })
    );
  });

  it("rejects unsupported file types locally", async () => {
    const onChange = vi.fn();
    const { container } = render(<ImageUploader onChange={onChange} />);

    fireEvent.change(fileInputOf(container), {
      target: { files: [makeFile("evil.exe", "application/x-msdownload")] },
    });

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((a) => a.textContent.includes("Unsupported file type"))).toBe(true);
    expect(uploadAdminImage).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancelling an in-flight upload resets to the dropzone and clears the field", async () => {
    let resolveUpload;
    uploadAdminImage.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );
    const onChange = vi.fn();
    const { container } = render(<ImageUploader onChange={onChange} />);

    fireEvent.change(fileInputOf(container), { target: { files: [makeFile()] } });

    await waitFor(() => expect(screen.getByRole("button", { name: /cancel upload/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cancel upload/i }));

    expect(onChange).toHaveBeenCalledWith(null);
    resolveUpload({ url: "https://res.cloudinary.com/demo/x.png", publicId: "ghostcode-dynamics/projects/x" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument()
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("surfaces upload failures and still offers restore control", async () => {
    uploadAdminImage.mockRejectedValue(new Error("cloudinary rejected the upload"));
    const { container } = render(<ImageUploader onChange={() => {}} />);

    fireEvent.change(fileInputOf(container), { target: { files: [makeFile()] } });

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((a) => a.textContent.includes("cloudinary rejected the upload"))).toBe(true);
    expect(screen.getByRole("button", { name: /replace image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove image/i })).toBeInTheDocument();
  });

  it("does not react when disabled", () => {
    const onChange = vi.fn();
    render(<ImageUploader disabled onChange={onChange} />);
    expect(screen.getByRole("button", { name: /upload image/i })).toBeDisabled();
  });
});