import {
  VideoDetailsFormPlaceholders,
  VideoDetailsFormLabels,
  VideoDetailsFormNames,
} from "./utils";
import { VideoDetailsSchema } from "../../../schemas";
import { MediaType, Platform } from "../../../utils";
import { Button, MultiSelect, Stack, TextInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useState } from "react";
import type { VideoDetails } from "../../../schemas";
import type { JSX } from "react";

const handleUpload = (platforms: Platform[], video: VideoDetails) => {
  window.electronAPI
    ?.upload(platforms, video)
    .then(() => {
      console.log("Videos uploaded");
    })
    .catch((error: unknown) => {
      console.log(error);
    });
};

export function VideoPublishForm(): JSX.Element {
  const { getInputProps, key, values, setFieldValue } = useForm<VideoDetails>({
    initialValues: {
      title: "",
      description: "",
      image: "",
      video: "",
      url: "",
    },
    validate: zodResolver(VideoDetailsSchema),
    validateInputOnBlur: true,
    validateInputOnChange: true,
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const handleSelect = (mediaType: MediaType) => {
    window.electronAPI
      ?.selectMedia(mediaType)
      .then((result) => {
        // Only the set the file path, if the dialog box was not closed(Closes when we click "cancel" button) and the file was not selected
        if (result.canceled === false) {
          const fieldName =
            mediaType === MediaType.Image
              ? VideoDetailsFormNames.image
              : VideoDetailsFormNames.video;

          setFieldValue(fieldName, result.filePaths[0]);
        }
      })
      .catch((error: unknown) => {
        console.log(error);
      });
  };

  return (
    <Stack>
      <form>
        <Stack>
          <TextInput
            {...getInputProps(VideoDetailsFormNames.title)}
            key={key(VideoDetailsFormNames.title)}
            label={VideoDetailsFormLabels.title}
            placeholder={VideoDetailsFormPlaceholders.title}
          />
          <TextInput
            {...getInputProps(VideoDetailsFormNames.description)}
            key={key(VideoDetailsFormNames.description)}
            label={VideoDetailsFormLabels.description}
            placeholder={VideoDetailsFormPlaceholders.description}
          />
          <TextInput
            {...getInputProps(VideoDetailsFormNames.image)}
            key={key(VideoDetailsFormNames.image)}
            label={VideoDetailsFormLabels.image}
            placeholder={VideoDetailsFormPlaceholders.image}
            onClick={() => {
              handleSelect(MediaType.Image);
            }}
          />
          <TextInput
            {...getInputProps(VideoDetailsFormNames.video)}
            key={key(VideoDetailsFormNames.video)}
            label={VideoDetailsFormLabels.video}
            placeholder={VideoDetailsFormPlaceholders.video}
            onClick={() => {
              handleSelect(MediaType.Video);
            }}
          />
          <TextInput
            {...getInputProps(VideoDetailsFormNames.url)}
            key={key(VideoDetailsFormNames.url)}
            label={VideoDetailsFormLabels.url}
            placeholder={VideoDetailsFormPlaceholders.url}
          />
        </Stack>
      </form>
      <MultiSelect
        data={Object.entries(Platform).map(([label, value]) => {
          return {
            value,
            label,
          };
        })}
        label="Platforms"
        placeholder="Choose platforms for video upload"
        value={platforms}
        onChange={(value) => {
          setPlatforms(value as Platform[]);
        }}
      />
      <Button
        onClick={() => {
          handleUpload(platforms, values);
        }}
      >
        Publish
      </Button>
    </Stack>
  );
}
