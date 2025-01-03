import { useAppContext } from "../../context";
import { AppShell, Group, Title, Button, ActionIcon } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
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
  const { isVisible, toggleVisibility } = useAppContext();

  return (
    <AppShell.Header p="xs">
      <Group justify="space-between" align="center">
        <Title order={5}>MaxRoom Uploader</Title>
        <Group wrap="nowrap">
          <Button onClick={handleOpen}>Open Browser</Button>
        </Group>
        <ActionIcon size="lg" onClick={toggleVisibility}>
          {isVisible === true ? <IconMinus /> : <IconPlus />}
        </ActionIcon>
      </Group>
    </AppShell.Header>
  );
}
