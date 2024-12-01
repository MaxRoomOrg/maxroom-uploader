import { App } from "./app";
import { ErrorPage } from "./pages/ErrorPage";
import { Upload } from "./pages/Upload";
import { createHashRouter } from "react-router";
export const Router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Upload />,
      },
    ],
  },
]);
