const {build, Platform, Arch} = require("electron-builder");
const config = require("../package.json").build;
build({targets: Platform.WINDOWS.createTarget("dir", Arch.x64), publish: "never", config: {
  ...config, npmRebuild: false, productName: "Koodo Reader Lab", appId: "info.danevi.koodo-reader-lab",
  extraMetadata: { name: "koodo-reader-lab", productName: "Koodo Reader Lab" }
}}).catch(error => { console.error(error.message); process.exitCode=1; });
