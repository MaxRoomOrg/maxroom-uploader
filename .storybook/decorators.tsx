import { Decorator } from "@storybook/react";
import React, { useEffect } from "react";
import { addons } from "@storybook/preview-api";
import { DARK_MODE_EVENT_NAME } from "storybook-dark-mode";
import { MantineProvider, useMantineColorScheme } from "@mantine/core";
import { BrowserRouter } from "react-router";
import type { PropsWithChildren } from "react";
import "@mantine/core/styles.css"; //Ref: https://mantine.dev/styles/global-styles/

const Channel = addons.getChannel(); // Ref: https://mantine.dev/guides/storybook/

function ColorSchemeWrapper({ children }: PropsWithChildren) {
  const { setColorScheme } = useMantineColorScheme();
  const handleColorScheme = (value: boolean) => setColorScheme(value ? "dark" : "light");

  useEffect(() => {
    Channel.on(DARK_MODE_EVENT_NAME, handleColorScheme);
    return () => Channel.off(DARK_MODE_EVENT_NAME, handleColorScheme);
  }, []);

  return <BrowserRouter>{children}</BrowserRouter>;
}

export const decorators: Decorator[] = [
  (renderStory) => <ColorSchemeWrapper>{renderStory()}</ColorSchemeWrapper>,
  (renderStory) => <MantineProvider>{renderStory()}</MantineProvider>,
];
