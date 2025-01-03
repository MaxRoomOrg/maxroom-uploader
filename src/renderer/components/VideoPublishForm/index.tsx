import {
  VideoDetailsFormPlaceholders,
  VideoDetailsFormLabels,
  VideoDetailsFormNames,
  getVideoDetails,
} from "./utils";
import { VideoDetailsSchema } from "../../../schemas";
import { MediaType, OGTag, Platform } from "../../../utils";
import { useAppContext } from "../../context";
import { Button, MultiSelect, Stack, TextInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useCallback, useEffect, useState } from "react";
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
  const {
    getInputProps,
    key,
    values,
    setFieldValue,
    setValues,
    onSubmit: onFormSubmit,
  } = useForm<VideoDetails>({
    initialValues: {
      title: "",
      description: "",
      video: "",
    },
    validate: zodResolver(VideoDetailsSchema),
    validateInputOnBlur: true,
    validateInputOnChange: true,
  });
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>(Object.values(Platform));
  const { isVisible } = useAppContext();

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

  const handleGetDetails = useCallback(
    (maxroomID: string) => {
      if (maxroomID.length > 0) {
        setIsFetching(true);

        getVideoDetails(maxroomID)
          .then((results) => {
            const video: VideoDetails = {
              title: results[OGTag.Title],
              description: results[OGTag.Description],
              url: results[OGTag.URL],
              video: results[OGTag.Video],
              image: results[OGTag.Image],
              maxroomID: maxroomID,
            };
            // Set the fetch details
            setValues(video);

            // Update loading states
            setIsFetching(false);
            setIsDownloading(true);

            // Start the video and image downloading and update the path once they are downloaded.
            window.electronAPI
              ?.downloadMedia(video)
              .then((paths) => {
                setFieldValue(VideoDetailsFormNames.video, paths[0]);
                setFieldValue(VideoDetailsFormNames.image, paths[1]);
                setIsDownloading(false);
              })
              .catch((error: unknown) => {
                console.log(error);
                setIsDownloading(false);
              });
          })
          .catch((error: unknown) => {
            console.log(error);
            setIsFetching(false);
          });
      }
    },
    [setValues, setIsFetching, setIsDownloading, setFieldValue],
  );

  useEffect(() => {
    window.electronAPI?.onMessage((_event, message) => {
      if (typeof message === "string") {
        const deepLinkParts = message.split("//");
        if (deepLinkParts.length > 1) {
          const id = deepLinkParts[deepLinkParts.length - 1].replace(/\/$/, ""); // Remove trailing "/" from the last element if it exists
          setFieldValue(VideoDetailsFormNames.maxroomID, id);
          handleGetDetails(id);
        }
      }
    });
  }, [setFieldValue, handleGetDetails]);

  return (
    <form
      onSubmit={onFormSubmit((data) => {
        handleUpload(platforms, data);
      })}
    >
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
        {isVisible === true ? (
          <>
            <TextInput
              {...getInputProps(VideoDetailsFormNames.maxroomID)}
              key={key(VideoDetailsFormNames.maxroomID)}
              label={VideoDetailsFormLabels.maxroomID}
              placeholder={VideoDetailsFormPlaceholders.maxroomID}
            />
            <Button
              onClick={() => {
                if (typeof values.maxroomID === "string") {
                  handleGetDetails(values.maxroomID);
                }
              }}
              loading={isFetching === true || isDownloading === true}
              loaderProps={{
                children:
                  isFetching === true ? "Fetching Details..." : "Downloading video and image...",
              }}
            >
              Get details from Maxroom
            </Button>
          </>
        ) : null}
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
        <Button loading={isFetching === true || isDownloading === true} type="submit">
          Publish
        </Button>
      </Stack>
    </form>
  );
}
