import type { PreparedPhoto } from "@/types";

/**
 * Browser-side photo pipeline: validate → (HEIC → JPEG) → resize → compress.
 * Everything happens on the user's device; only the small JPEG is sent to our
 * API, which keeps requests far below Vercel's 4.5 MB body limit.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_DIMENSION = 1280;
export const JPEG_QUALITY = 0.8;
/** If a JPEG is still bigger than this, compress harder. */
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
/** For the `accept` attribute of file inputs. */
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_MIME_TYPES, ...ACCEPTED_EXTENSIONS.map((e) => `.${e}`)].join(",");

function extension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Windows and some Android browsers report HEIC files with an empty MIME type, so check the extension too. */
export function isHeic(file: Pick<File, "name" | "type">): boolean {
  return /image\/hei[cf]/i.test(file.type) || ["heic", "heif"].includes(extension(file.name));
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateImageFile(file: Pick<File, "name" | "type" | "size">): ValidationResult {
  const typeOk = ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase()) || ACCEPTED_EXTENSIONS.includes(extension(file.name));
  if (!typeOk) return { ok: false, error: "That file type isn't supported. Please use a JPG, PNG, WebP or HEIC photo." };
  if (file.size === 0) return { ok: false, error: "That file looks empty. Please try another photo." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "That photo is over 15 MB. Please pick a smaller one." };
  return { ok: true };
}

/** Scale (width, height) down so the longest side is at most `max`. Never upscales. */
export function fitWithin(width: number, height: number, max = MAX_DIMENSION): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Approximate decoded byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function convertHeic(file: Blob): Promise<Blob> {
  // Loaded on demand: heic2any is large and most photos aren't HEIC.
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(result) ? result[0] : result;
}

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(blob: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      // "from-image" applies the EXIF rotation, so phone photos aren't sideways.
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to <img>, which some older browsers decode more leniently.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

export class ImageProcessingError extends Error {}

/** Turn any accepted photo into a small JPEG data URL. Throws ImageProcessingError with a friendly message. */
export async function prepareImage(file: File): Promise<PreparedPhoto> {
  const validation = validateImageFile(file);
  if (!validation.ok) throw new ImageProcessingError(validation.error);

  let decoded: Decoded;
  try {
    // Safari can decode HEIC natively; everyone else needs heic2any.
    decoded = await decode(file).catch(async (error) => {
      if (!isHeic(file)) throw error;
      return decode(await convertHeic(file));
    });
  } catch {
    throw new ImageProcessingError(
      isHeic(file)
        ? "We couldn't convert this HEIC photo. Try exporting it as JPG, or pick another photo."
        : "We couldn't read this photo. It may be damaged. Please try another one.",
    );
  }

  try {
    const { width, height } = fitWithin(decoded.width, decoded.height);
    if (!width || !height) throw new ImageProcessingError("That image has no size. Please try another photo.");

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageProcessingError("Your browser couldn't process the photo. Please try another browser.");
    // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, width, height);

    let dataUrl = canvasToJpeg(canvas, JPEG_QUALITY);
    if (dataUrlBytes(dataUrl) > TARGET_MAX_BYTES) dataUrl = canvasToJpeg(canvas, 0.6);
    // Release the pixel memory right away (matters on low-end phones).
    canvas.width = canvas.height = 0;

    return { dataUrl, mimeType: "image/jpeg", width, height, bytes: dataUrlBytes(dataUrl), name: file.name };
  } finally {
    decoded.close();
  }
}
