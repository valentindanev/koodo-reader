const {build, Platform, Arch} = require("electron-builder");
const config = require("../package.json").build;
// Requires Electron and native modules prepared for the configured Electron version.
build({targets: Platform.WINDOWS.createTarget("dir", Arch.x64), publish: "never", config: {
  ...config, npmRebuild: false, directories: {...config.directories, output: "dist-default"}
}}).catch(error => { console.error(error.message); process.exitCode = 1; });
