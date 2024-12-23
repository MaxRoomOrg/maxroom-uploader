import { z } from "zod";

export const VideoDetailsSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long." }),
  description: z.string().min(1, { message: "Description is required." }),
  image: z.string().nullish(),
  video: z.string().min(1, { message: "Video is required." }),
  url: z.string().url().nullish(),
  maxroomID: z.string().nullish(),
});

export type VideoDetails = z.infer<typeof VideoDetailsSchema>;
