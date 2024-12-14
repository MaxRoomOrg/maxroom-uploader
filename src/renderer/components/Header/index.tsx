import { AppShell, ActionIcon, Group, Title, Button } from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons-react";
import React from "react";
import type { MantineColorScheme } from "@mantine/core";

export interface HeaderProps {
  colorScheme: MantineColorScheme;
  onToggleColorScheme: () => void;
}

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

export function Header({ colorScheme, onToggleColorScheme }: HeaderProps): React.JSX.Element {
  return (
    <AppShell.Header p="xs">
      <Group justify="space-between" align="center">
        <Title order={5}>MaxRoom Uploader</Title>
        <Group wrap="nowrap">
          <Button onClick={handleOpen}>Open Browser</Button>
        </Group>
        <ActionIcon onClick={onToggleColorScheme} variant="default">
          {colorScheme === "dark" ? <IconSun /> : <IconMoonStars />}
        </ActionIcon>
      </Group>
    </AppShell.Header>
  );
}
