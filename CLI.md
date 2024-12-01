### CLI Scripts:

1. `yarn compile`: Compiles the TS source code into JS using `tsc`.
2. `yarn start`: Deploys the bundled code in a demo app on localhost.
3. `yarn build`: Compiles, bundles, and minifies the source code for production.
4. `yarn dev`: Compiles and bundles the source code for development. It doesn't minify the bundle. It also emits relevant source-maps too to recreate JS/TS source files. Both these features are helpful for debugging.
5. `yarn refresh`: Deletes all the build/docs artifacts and caches. Example: `dist`, `storybook-static`, `.eslintcache` etc.
6. `yarn lint`: Lints the source code.
7. `yarn pretty`: Prettifies the source code.
8. `yarn clean`: Deletes all the build/docs artifacts, caches, and other relatively-less-sensitive artifacts like `node_modules`.
9. `yarn start:sb`: Compiles and serves a development build of the [Storybook](https://storybook.js.org/docs/react/api/cli-options#dev) that reflects the source code changes in the browser in real-time.
10. `yarn build:sb`: Compiles & bundles the [Storybook](https://storybook.js.org/docs/react/api/cli-options#build) code into the `storybook-static` directory, so it can be deployed.
11. `yarn test:loki`: Capture screenshots of [Storybook](https://storybook.js.org/)'s stories and compare them against the reference files. [Source](https://loki.js.org/command-line-arguments.html#loki-test)
12. `yarn update:loki`: Capture screenshots of [Storybook](https://storybook.js.org/)'s stories and update the reference files. [Source](https://loki.js.org/command-line-arguments.html#loki-update)
13. `yarn prune:loki`: Updates screenshots, test them, and then prunes old reference files. [Source](https://loki.js.org/command-line-arguments.html#loki-approve)
14. `yarn prepare`: Enable Git hooks. [Source](https://typicode.github.io/husky/getting-started.html#automatic-recommended)
