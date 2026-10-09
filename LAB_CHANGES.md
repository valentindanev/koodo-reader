# Local reader changes - 09-10-2026

Branch: lab/voice-provider-visibility. Upstream dev stays clean for synchronization.

The read-aloud panel now has a Voice integrations menu. Show/hide system voices, official Pro voices and individual installed voice plugins. Settings persist; disabled providers are filtered from ordinary and multi-role voice menus. Local Kokoro is distinctly labeled. Hiding providers stops narration, clears invalid role selections and selects an available free voice, or asks the user to choose when only paid voices remain. All providers can be hidden and re-enabled without uninstalling them.

The panel resizes to expanded/collapsed content, anchored at the bottom, with a scrollbar only when the viewport height is exceeded.

Continuous-scroll narration leaves the view still until the active sentence reaches two-thirds down the viewport, then follows it with small smooth movements. Full-screen next-page jumps are suppressed in continuous text mode; chapter transitions are retained. Single-page, two-page and raw-PDF navigation remain unchanged.

Non-PDF sentence highlighting now uses sequence-aware DOM ranges shared with auto-follow. It paints across inline emphasis, bold text and links without changing book formatting, tracks repeated sentences and previous/resumed playback, and removes stale narration spans. Matching tolerates whitespace dropped after punctuation by the existing long-sentence speech chunker. This changes neither the book text nor audio generation. Raw PDF retains its original highlight path.

Validation: fifteen tests, TypeScript noEmit checking, production frontend build, Electron highlighting/formatting/scrolling checks and earlier packaged startup/database smoke check. The missing-highlight case was reproduced in the owner's installed EPUB: long-sentence splitting produced two chunks with no exact source-text match; corrected range matching located both. No book text is included in the public tests. Owner tested and accepted the menu, resizing, continuous following and final highlighting fix on Windows with local Kokoro on 09-10-2026.

## Build
Use upstream's yarn.lock and documented dependencies. On the tested workstation Node 24 and Yarn 1.22.22 were used.

- Frontend: corepack yarn build
- Tests: corepack yarn test --watchAll=false --runInBand --testPathPattern="providerVisibility|narrationFollow|narrationHighlight"
- Type checking: node node_modules/typescript/bin/tsc --noEmit
- Separate Windows x64 directory build: node scripts/build-lab.cjs
- Windows x64 directory build retaining the original profile identity: node scripts/build-default.cjs

The directory build is named Koodo Reader Lab, with a separate package name and app ID. It is unsigned and does not publish a release. The build script assumes Electron and its native dependencies have been prepared. The lab's initial dependency installation used frozen-lockfile and ignore-scripts, then downloaded Electron and rebuilt better-sqlite3 for Electron. A subsequent optional cpu-features rebuild failed; ssh2 tolerates its absence. The resulting packaged SQLite binary passed an in-memory query in Electron.

## Update strategy
Keep origin pointing to Valentin's fork and upstream pointing to the original repository. Merge chosen upstream updates into this feature branch, resolve conflicts and rerun the validation. Do not use the original app's updater to replace a custom build.

This is maintained for personal use. Upstream PR submission was abandoned after the repository restricted submissions to collaborators. No upstream PRs were created.
