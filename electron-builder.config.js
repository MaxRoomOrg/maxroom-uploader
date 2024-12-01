const { readFileSync } = require("fs");
const path = require("path");

function getElectronVersion() {
  const packageJSON = JSON.parse(readFileSync(path.join(process.cwd(), "./package.json")));
  const versionInfo = packageJSON.devDependencies.electron.replace("^", "");
  return versionInfo;
}

module.exports = {
  appId: "com.electron.maxroom.uploader", // The application id. Used as CFBundleIdentifier for MacOS and as Application User Model ID for Windows (NSIS target only, Squirrel.Windows not supported). It is strongly recommended that an explicit ID is set.
  productName: "MaxRoom Uploader", // As name, but allows you to specify a product name for your executable which contains spaces and other special characters not allowed in the name property.
  copyright: `© ${new Date().getFullYear()} | Manufac Analytics Private Limited | All Rights Reserved`, // The human-readable copyright line for the app.
  directories: {
    buildResources: "electron-builder-resources", // The path to build resources.
    output: "electron-package", // The output directory. File macros are supported.
  },
  protocols: [
    {
      name: "MaxRoom Uploader",
      schemes: ["maxroom-uploader"],
    },
  ],
  mac: {
    target: {
      target: "dmg",
      arch: ["x64", "arm64"],
    },
    // https://www.electron.build/configuration/mac
    category: "public.app-category.productivity", // The application category type, as shown in the Finder via View -> Arrange by Application Category when viewing the Applications directory. Category list: https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html#//apple_ref/doc/uid/TP40009250-SW8
    icon: "icon.png", // The path to application icon. | https://www.electron.build/icons.html
  },
  win: {
    // https://www.electron.build/configuration/win
    icon: "electron-builder-resources/icon.png", // The path to application icon.
    legalTrademarks: "Manufac™", // The trademarks and registered trademarks.
    target: ["nsis"],
  },
  nsis: {
    deleteAppDataOnUninstall: true,
    oneClick: false, // The installer will present a traditional installation wizard, allowing users to select installation options such as installation directory, shortcut creation, etc. | Ref: https://www.electron.build/electron-builder.interface.nsisweboptions#permachine
  },
  linux: {
    // https://www.electron.build/configuration/linux
    category: "science",
    target: ["AppImage"],
    executableName: "MaxRoom Uploader", // The executable name. Defaults to productName. Cannot be specified per target, allowed only in the linux.
    extraFiles: [
      {
        from: "uninstall.sh",
        to: path.join(process.cwd(), "electron-package/uninstall.sh"),
      },
    ],
    artifactName: "${productName}-${version}.${ext}", // https://github.com/electron-userland/electron-builder/issues/3440#issuecomment-470688752
  },
  removePackageScripts: true, // Whether to remove scripts field from package.json files.
  files: ["**/dist/**/*"], // A glob patterns array relative to the app directory, which specifies which files to include when copying files to create the package. | https://www.electron.build/configuration/contents | node_modules & package.json included by default
  extraResources: ["src/assets/**/*"], // added the video for packaged app
  asar: true, // Whether to package the application’s source code into an archive, using Electron’s archive format.
  electronVersion: getElectronVersion(),
  publish: null, // https://www.electron.build/configuration/publish | https://github.com/electron-userland/electron-builder/issues/2153,
};
