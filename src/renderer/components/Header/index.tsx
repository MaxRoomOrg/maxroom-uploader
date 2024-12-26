import { AppShell, Group, Title, Button } from "@mantine/core";
import React from "react";

const handleOpen = () => {
  window.electronAPI
    ?.openBrowser()
    .then(() => {
      console.log("Browser opened successfully");
    })
    .catch((error: unknown) => {
      console.error("Error opening browser:", error);
    });
};

export function Header(): React.JSX.Element {
  return (
    <AppShell.Header p="xs">
      <Group justify="space-between" align="center">
        <Title order={5}>MaxRoom Uploader</Title>
        <Group wrap="nowrap">
          <Button onClick={handleOpen}>Open Browser</Button>
        </Group>
      </Group>
    </AppShell.Header>
  );
}
