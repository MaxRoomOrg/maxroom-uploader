import { Router } from "./routes";
import { MantineProvider, createTheme } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "@fontsource/ruda/400.css";
import "@fontsource/ruda/500.css";
import "@fontsource/ruda/600.css";
import "@fontsource/ruda/700.css";
import "@fontsource/ruda/800.css";
import "@fontsource/ruda/900.css";

const MantineTheme = createTheme({
  fontFamily: "Ruda, san-serif",
}); // Ref: https://mantine.dev/theming/theme-object/#store-theme-override-object-in-a-variable

const root = createRoot(document.getElementById("root") as HTMLDivElement);
root.render(
  <StrictMode>
    <MantineProvider theme={MantineTheme}>
      <RouterProvider router={Router} />
    </MantineProvider>
  </StrictMode>,
);
