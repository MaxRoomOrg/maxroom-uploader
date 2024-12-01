import manufacEslintConfig from "@manufac/eslint-config/react.js";

export default [
  ...manufacEslintConfig,
  {
    ignores: ["electron-package/*"],
  },
];
