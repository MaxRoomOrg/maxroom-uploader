import { Header } from ".";
import { AppShell } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react";

export default {
  title: "Header",
  component: Header,
} as Meta<typeof Header>;

export const Template: StoryObj<typeof Header> = {
  render: function Wrapper() {
    return (
      <AppShell>
        <Header />
      </AppShell>
    );
  },
};
