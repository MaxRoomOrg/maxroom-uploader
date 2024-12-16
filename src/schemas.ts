import { z } from "zod";

export const VideoDetailsSchema = z.object({
  title: z.string().min(3),
  description: z.string().nullish(),
  image: z.string().nullish(),
  video: z.string(),
  url: z.string().url().nullish(),
  maxroomID: z.string().nullish(),
});

export type VideoDetails = z.infer<typeof VideoDetailsSchema>;
