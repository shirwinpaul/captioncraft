// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ImageProcessingError,
  MAX_DIMENSION,
  MAX_UPLOAD_BYTES,
  dataUrlBytes,
  fitWithin,
  isHeic,
  prepareImage,
  validateImageFile,
} from "@/lib/image";

describe("fitWithin (resize helper)", () => {
  it("scales the longest side down to 1280", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 960, height: 1280 });
    expect(fitWithin(5000, 5000)).toEqual({ width: MAX_DIMENSION, height: MAX_DIMENSION });
  });

  it("never upscales small images", () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 });
  });

  it("keeps very thin images at least 1px", () => {
    expect(fitWithin(100_000, 10)).toEqual({ width: 1280, height: 1 });
  });

  it("handles zero sizes", () => {
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 });
  });
});

describe("validateImageFile", () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size });

  it("accepts JPG, PNG, WebP and HEIC", () => {
    for (const f of [file("a.jpg", "image/jpeg"), file("a.png", "image/png"), file("a.webp", "image/webp"), file("a.heic", "image/heic")]) {
      expect(validateImageFile(f).ok).toBe(true);
    }
  });

  it("accepts HEIC with an empty MIME type (Windows)", () => {
    expect(validateImageFile(file("IMG_1.HEIC", "")).ok).toBe(true);
    expect(isHeic(file("IMG_1.HEIC", ""))).toBe(true);
  });

  it("rejects other types, empty files and files over 15 MB", () => {
    expect(validateImageFile(file("a.gif", "image/gif")).ok).toBe(false);
    expect(validateImageFile(file("a.pdf", "application/pdf")).ok).toBe(false);
    expect(validateImageFile(file("a.jpg", "image/jpeg", 0)).ok).toBe(false);
    expect(validateImageFile(file("a.jpg", "image/jpeg", MAX_UPLOAD_BYTES + 1)).ok).toBe(false);
  });
});

describe("dataUrlBytes", () => {
  it("computes the decoded size", () => {
    expect(dataUrlBytes("data:image/jpeg;base64,QUJD")).toBe(3);
    expect(dataUrlBytes("data:image/jpeg;base64,QUI=")).toBe(2);
    expect(dataUrlBytes("data:image/jpeg;base64,QQ==")).toBe(1);
  });
});

describe("prepareImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resizes to 1280px and exports a JPEG at quality 0.8", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 4000, height: 2000, close })));
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,QUJD");
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === "canvas") {
        Object.assign(el, {
          getContext: () => ({ fillRect: vi.fn(), drawImage, fillStyle: "", imageSmoothingQuality: "" }),
          toDataURL,
        });
      }
      return el;
    });

    const photo = await prepareImage(new File([new Uint8Array(10)], "beach.png", { type: "image/png" }));
    expect(photo).toMatchObject({ width: 1280, height: 640, mimeType: "image/jpeg", name: "beach.png", bytes: 3 });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1280, 640);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8);
    expect(close).toHaveBeenCalled();
  });

  it("rejects unsupported files with a friendly error", async () => {
    await expect(prepareImage(new File(["x"], "doc.txt", { type: "text/plain" }))).rejects.toBeInstanceOf(ImageProcessingError);
  });
});
