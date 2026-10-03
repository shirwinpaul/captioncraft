/** A photo after in-browser conversion and resizing. Lives only in React state, never in storage. */
export interface PreparedPhoto {
  /** `data:image/jpeg;base64,...`, ready to preview and to send to the API. */
  dataUrl: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  /** Size of the compressed JPEG in bytes. */
  bytes: number;
  /** Original file name, used only for alt text and the preview label. */
  name: string;
}

export const HASHTAG_STYLES = ["popular", "niche", "trending"] as const;
export type HashtagStyle = (typeof HASHTAG_STYLES)[number];

/** Tabs on /create, also used as the `?mode=` URL value. */
export const STUDIO_MODES = ["captions", "bio", "replies"] as const;
export type StudioMode = (typeof STUDIO_MODES)[number];
