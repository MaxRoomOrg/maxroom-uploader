import { OGTag } from "../../../utils";
import type { VideoDetails } from "../../../schemas";

export const VideoDetailsFormNames: Record<keyof VideoDetails, keyof VideoDetails> = {
  title: "title",
  description: "description",
  image: "image",
  video: "video",
  url: "url",
  maxroomID: "maxroomID",
};

export const VideoDetailsFormLabels: Record<keyof VideoDetails, string> = {
  title: "Title",
  description: "Description",
  image: "Image",
  video: "Video",
  url: "URL",
  maxroomID: "Maxroom ID",
};

export const VideoDetailsFormPlaceholders: Record<keyof VideoDetails, string> = {
  title: "Enter a title",
  description: "Enter a description",
  image: "Select an image",
  video: "Select a video",
  url: "Enter a URL",
  maxroomID: "Enter a Maxroom ID",
};

export async function getVideoDetails(id: string): Promise<Record<string, string>> {
  const response = await fetch(`https://maxroom.co/videos/${id}`);
  const htmlContent = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(htmlContent, "text/html");
  const metaTags = document.getElementsByTagName("meta");

  const ogTags = Object.values(OGTag);

  const specificOgTags = Array.from(metaTags)
    .filter((tag) => {
      const property = tag.getAttribute("property") as OGTag;
      return typeof property === "string" && ogTags.includes(property);
    })
    .reduce<Record<string, string>>((acc, cur) => {
      const property = cur.getAttribute("property");
      const content = cur.getAttribute("content");
      if (typeof property === "string" && typeof content === "string") {
        acc[property] = content;
      }
      return acc;
    }, {});
  return specificOgTags;
}
