# Local reader changes - 09-10-2026

Branch: lab/voice-provider-visibility. Upstream dev stays clean for synchronization.

The read-aloud panel now has a Voice integrations menu. Show/hide system voices, official Pro voices and individual installed voice plugins. Settings persist; disabled providers are filtered from ordinary and multi-role voice menus. Local Kokoro is distinctly labeled. Hiding providers stops narration, clears invalid role selections and selects an available free voice, or asks the user to choose when only paid voices remain. All providers can be hidden and re-enabled without uninstalling them.

Validation: four behavioral React/Jest tests, TypeScript noEmit check, production frontend build and isolated Electron startup/database smoke check. Manual acceptance with the user's real book remains pending. Highlighting and auto-scroll are unchanged.

## Build
Use upstream's yarn.lock and documented dependencies. On the tested workstation Node 24 and Yarn 1.22.22 were used.

- Frontend: corepack yarn build
- Tests: corepack yarn test --watchAll=false --runInBand --testPathPattern=providerVisibility
- Type checking: node node_modules/typescript/bin/tsc --noEmit
- Separate Windows x64 directory build: node scripts/build-lab.cjs

The directory build is named Koodo Reader Lab, with a separate package name and app ID. It is unsigned and does not publish a release. The build script assumes Electron and its native dependencies have been prepared. The lab's initial dependency installation used frozen-lockfile and ignore-scripts, then downloaded Electron and rebuilt better-sqlite3 for Electron. A subsequent optional cpu-features rebuild failed; ssh2 tolerates its absence. The resulting packaged SQLite binary passed an in-memory query in Electron.

## Update strategy
Keep origin pointing to Valentin's fork and upstream pointing to the original repository. Merge chosen upstream updates into this feature branch, resolve conflicts and rerun the validation. Do not use the original app's updater to replace a custom build.
