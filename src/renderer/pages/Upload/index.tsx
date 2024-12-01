import { Platform } from "../../../main/utils";
import { Button, SimpleGrid } from "@mantine/core";

export function Upload() {
  const handleUpload = (platform: Platform) => {
    window.electronAPI
      ?.upload(platform)
      .then(() => {
        console.log(`video uploaded to ${platform}`);
      })
      .catch((error: unknown) => {
        console.log(error);
      });
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" p="sm" w="100%">
      <Button
        onClick={() => {
          handleUpload(Platform.Youtube);
        }}
      >
        Youtube
      </Button>
      <Button
        onClick={() => {
          handleUpload(Platform.X);
        }}
      >
        X
      </Button>
      <Button
        onClick={() => {
          handleUpload(Platform.TikTok);
        }}
      >
        TikTok
      </Button>
      <Button
        onClick={() => {
          handleUpload(Platform.Facebook);
        }}
      >
        Facebook
      </Button>
    </SimpleGrid>
  );
}
