export const Platform = {
  Youtube: "youtube",
  X: "x",
  Facebook: "facebook",
  TikTok: "tiktok",
  Pinterest: "pinterest",
  Threads: "threads",
  Instagram: "instagram",
  LinkedIn: "linkedIn",
  Snapchat: "snapchat",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const MediaType = {
  Image: "image",
  Video: "video",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
