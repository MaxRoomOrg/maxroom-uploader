import type { VideoDetails } from "../../../schemas";

export const VideoDetailsFormNames: Record<keyof VideoDetails, keyof VideoDetails> = {
  title: "title",
  description: "description",
  image: "image",
  video: "video",
  url: "url",
};

export const VideoDetailsFormLabels: Record<keyof VideoDetails, string> = {
  title: "Title",
  description: "Description",
  image: "Image",
  video: "Video",
  url: "URL",
};

export const VideoDetailsFormPlaceholders: Record<keyof VideoDetails, string> = {
  title: "Enter a title",
  description: "Enter a description",
  image: "Select an image",
  video: "Select a video",
  url: "Enter a URL",
};
