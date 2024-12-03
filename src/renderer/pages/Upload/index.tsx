import { Platform } from "../../../main/utils";
import { Button, MultiSelect, Stack } from "@mantine/core";
import { useState } from "react";

const handleUpload = (platforms: Platform[]) => {
  window.electronAPI
    ?.upload(platforms)
    .then(() => {
      console.log("Videos uploaded");
    })
    .catch((error: unknown) => {
      console.log(error);
    });
};

export function Upload() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  return (
    <Stack>
      <MultiSelect
        data={Object.entries(Platform).map(([label, value]) => {
          return {
            value,
            label,
          };
        })}
        value={platforms}
        onChange={(values) => {
          setPlatforms(values as Platform[]);
        }}
      />
      <Button
        onClick={() => {
          handleUpload(platforms);
        }}
      >
        Publish
      </Button>
    </Stack>
  );
}
