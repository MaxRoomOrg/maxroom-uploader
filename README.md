## MaxRoom Uploader

An Electron bot that uploads videos to X, FB, YT and TikTok

It has support for:

- TypeScript ✅
- Webpack Bundling and Hot Reloading ✅
- Electron Builder ✅
- Storybook and Loki testing ✅
- React Router DOM integration ✅
- Mantine integration with Dark and Light Themes ✅
- Linting ✅
- Prettifying & package.json sorting ✅
- Pre-commit hooks ✅
- shx for OS agnostic CLI ✅

This template repository is to be used for creating any new Manufac's Electron based project.

## Dev Environment

- NodeJS | `20.18.0`
- yarn | `1.22.22`

## How to run the application?

- Install NodeJS and `yarn`.
- `cd` into the source code and run `yarn install` from the terminal.
- Then run `yarn start` to open the app in dev mode.
- OR, run `yarn package` to package the app from production mode.
- Thereafter, the installable/executable version of the app can be found in `electron-package` folder in the code directory.

## How to run the `.exe` on Windows?

- Navigate to the root directory of the project. 
- Run the `yarn package` command to package the app.
- Once the packaging process is complete, go to the `electron-package` folder.
- Inside this folder, you will find a file named `Electron Setup <version>.exe`.
- Right-click the `Electron Setup <version>.exe` file and select "Reveal in Folder" to find its location.
- Double-click the `Electron Setup <version>.exe` file to start the installation process.
- After installation, you can run the Electron app from the Start menu or directly from the installation folder.

## How to run the `.dmg` on macOS?

- Navigate to the root directory of the project. 
- Run the `yarn package` command to package the app.
- Once the packaging process is complete, go to the `electron-package` folder.
- Inside this folder, you will find a file named `Electron-<version>arm64.dmg`.
- Right-click the `Electron-<version>arm64.dmg` file and select "Reveal in Finder" to find its location.
- Double-click the `Electron-<version>arm64.dmg` and install the package.
- After the installation is complete, you can launch the Electron application.

## How to run the `.AppImage` on Linux?

- Navigate to the root directory of the project. 
- Run the `yarn package` command to package the app.
- Once the packaging process is complete, go to the `electron-package` folder.
- Inside this folder, you will find a file named `Electron-<version>.AppImage`.
- Right-click the `Electron-<version>.AppImage` file and select "Open containing folder" to view its location.
- Double-click the `Electron-<version>.AppImage` file to launch the application.
- If the app does not start when double-clicked, you may need to grant executable permission to the file. To do this, open a terminal in the current directory and run the command `chmod +x Electron-<version>.AppImage`. After executing this command, you should be able to start the app by double-clicking it.
- Alternatively, you can launch the app from the terminal. To do this, open a terminal in the current directory and enter the command `./Electron-<version>.AppImage --no-sandbox`. This will start your app via the terminal.

## Steps to completely uninstall the application:

### Windows

#### Uninstall the Application:

- Open the `Control Panel`.
- Go to `Programs and Features`.
- Find the application in the list, right-click on it, and select Uninstall.

#### Remove AppData:

- AppData will be automatically removed upon app uninstallation.

### Linux

#### Uninstall the Application:

- As the application is an AppImage, it is self-contained and doesn't require installation, meaning there is no need for a formal uninstallation process.
- To remove Application which is an AppImage, navigate to the folder where the application is located.
- Locate the AppImage file, right-click on it, and select `Move to Trash`.

#### Remove AppData:

- Navigate to the folder containing the `uninstall.sh` script.
- Open the folder containing the script in terminal and grant executable permission to the script by running
     - `chmod +x ./uninstall.sh`
- Run the script to remove AppData by running:
     - `./uninstall.sh` 

### macOS

#### Uninstall the Application:

- To remove Application which is a DMG, navigate to the folder where the application is located.
- Locate the application and delete it.

#### Remove AppData:

- `cd` into `~/Library/Application Support`.
- Locate and delete the folder associated with the application (usually named after the app).
