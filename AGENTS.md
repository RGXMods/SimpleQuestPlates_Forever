# SimpleQuestPlates_Forever

SimpleQuestPlates_Forever is the WoW Forever (classic beta, interface `16001`) fork of SimpleQuestPlates; it overlays quest-objective progress on enemy nameplates on the Forever client. `SQP_Forever.toc` is the load manifest and requires `RGX-Framework`; settings live in `SQPForeverSettings`. Retail support stays in the `SimpleQuestPlates` repository and Classic Era/Anniversary/Mists support in `SimpleQuestPlates_Classic`; do not port their flavor targets into this TOC. (The previous revision of this document was copied from the Retail repository and named that addon's TOC, flavors, and SavedVariables; this revision replaces those with the fork's actual facts.)

## Layout

- `SQP_Forever.toc` loads `SimpleQuestPlates.xml`, which defines localization and runtime load order.
- `locales/` contains the `enUS` baseline and locale overrides.
- `data/` contains core settings, compatibility helpers, quest/nameplate logic, events, commands, previews, widgets, and option sections.
- `media/` contains addon images; `docs/` contains current release notes, per-version changelogs, and roadmap material.

## Fork Rules

- Keep the WoW Forever interface target (`16001`) and the `-forever` version identity; do not merge Retail or Classic branches into this repository or assume API parity.
- Preserve the Forever client's guarded API usage — the beta client can lack globals the Retail runtime relies on; guard before calling and keep the existing compatibility helpers.
- Use the RGX database, event, timer, minimap, and slash-command integrations already present (`/sqp` is registered through the framework), and preserve raw event/timer compatibility paths where the fork currently needs them.
- Preserve the script order in `SimpleQuestPlates.xml`. Keep `SQP_Forever.toc` and `SQP.VERSION` in `data/core.lua` synchronized when changing versions.
- `docs/CHANGES.md` contains only the current release section.

## Testing And Release

- For options, preview, animation, or baseline changes, run `node tools/test/preview-layout-check.mjs "<RGX-Framework-checkout>"`. For Reset All behavior, run `node tools/test/reset-settings-check.mjs "<RGX-Framework-checkout>"`. Quest matching uses `node tools/test/quest-matching-check.mjs`. These execute real Lua with explicit seams; rendering and protected-action safety require the client.
- Before beta deployment, build the runtime allowlist with the framework's `tools/release/build-addon-package.mjs "<checkout>" SQP_Forever.toc "<output-directory>"`; preserve the prior install and verify source/archive/installed hashes. The local beta test folder is `SimpleQuestPlates` with an adapted `SimpleQuestPlates.toc`; retain `SQPForeverSettings` and the framework dependency. SavedVariables are never overwritten during deployment.
- For actual-client acceptance, follow `docs/PREVIEW-TESTING.md`, including reload/profile persistence, nameplate parity, resizing, control state, and full Lua error stacks. Passing mocks or a beta copy does not establish release readiness.
- Releases use GitLab's shared in-house pipeline and protected tags matching the TOC's `-forever.beta.N` version; GitHub is downstream distribution. Update version/changelog metadata only when releasing is requested, and verify actual CI plus required manual gates before publication.

## Options And Baseline Contract

- Before changing options, defaults, profiles, resets, or animations, read `docs/PREVIEW-TESTING.md` and the affected `data/options_*.lua` implementation. The operator targets below are acceptance criteria; verify their implementation rather than assuming every local change is deployed or approved.
- **Default authority:** the operator-designated saved profile snapshot defines new defaults and slider baselines; it may be Default or an explicitly named baseline profile. When baseline adoption is requested, capture that profile read-only, record its name/provenance, and compare every explicitly saved canonical value with `SQP.DEFAULTS`; absent keys retain existing inheritance/defaults. Preserve user profiles; omit profile/account metadata and normalize redundant inheritance overrides without changing effective behavior. Runtime defaults and reset/slider baselines must agree.
- **Separate owners:** Main Icon means the quest amount/count background, Text Mode, and count color. Task Icon means the kill/loot/percent symbol, its switch, side, size/offset sliders, and tint. Keep controls with the visual they affect.
- **Individual pages:** Main Icon sits above Animation in the left column; Task Icon is on the right. Main Icon's Text Mode is body row one, Background Style is the bottom row. Task Icon bodies place tint/color above centered side-button groups on Kill/Loot/Percent. Headers hold switches/pagination; use the real header band for alignment. Animation lists Main Icon before Task Icons. Percent animations default OFF.
- **Global Display:** Task Icons and Text Mode sit above centered Left Side/Right Side in the body, followed by Scale and overlay-position sliders. Keep full side labels and sufficient button padding. This supersedes the older General-card Text Mode/header-side-button arrangement.
- **Preview:** individual Kill/Loot/Percent settings pages pin their matching preview; hover cannot change it. Global/Animation allow persistent hover selection. Button skin feedback and click navigation remain functional.
- **Animation/Toast:** master OFF temporarily disables Toast and its visible switch; master ON restores Toast's prior state, including a prior OFF state. Toast OFF never disables the master. Preserve restoration across reload/profile changes. Preview Toast belongs at the bottom of its card.
- **Percent Text Mode:** enabling it also enables the percent task icon and refreshes the corresponding control and live/preview rendering.
- **Reset completeness:** Reset All restores all declared defaults, nested colors, optional overrides, controls, preview, and live plates. Side/style-specific slider R and type resets resolve the current canonical baseline at click time. A passing storage-only check does not prove visible restoration; record any unresolved client symptom explicitly.

## Repository Workflow

- The GitLab project under `rgxmods/warcraft` is authoritative. Normal work belongs on task branches and must merge through GitLab merge requests, never directly to the default branch.
- Shared CI is included from `rgxmods/warcraft/RGX-Framework` at `/.gitlab/ci/addon.yml`; validation must pass before publishing to the GitHub mirror.
- The GitHub `RGXMods` repository is downstream distribution, not development authority.
- Keep GitLab and GitHub release tags identical, and use protected GitLab release tags.
- Preserve any existing working Wago connection and ID exactly. Never create a new Wago connection without explicit user direction.
- Publishing integrations prohibited by the shared validation policy are retired and must not be restored.
- The root `README.md` must remain detailed and project-specific. Narrow distribution edits must not replace or truncate installation, features, compatibility, usage, media, or support content.
- Verify relative README assets. Do not overwrite newer compatibility facts with stale monorepo or history text.

## Building With RGX-Framework

- Contract first: build addon behavior from the declarative `RGXAddon(name, opts)` table using only keys the framework ships today. Read `docs/DECLARATIVE-API.md` in `rgxmods/warcraft/RGX-Framework` before writing code; tier 4 keys are future targets, not runtime features. Use `onInit` and addon-scoped methods only where the shipped declarative surface genuinely cannot express the behavior.
- MCP tool loop: before writing UI, timer, event, aura, or slash code, run the rgx-framework MCP tools in order: `rgx_get_contract` -> `rgx_generate_addon` -> `rgx_validate_addon` -> `rgx_audit_lua`. Compare generated Lua with existing integration, validate the actual opts table, and audit every changed Lua file. Never hand-roll what the framework ships.
- Prefer framework subsystems over raw WoW API: timers and repeating schedules, event registration, slash commands, minimap button, saved-settings database, aura watching, UI controls and dropdowns, colors, fonts, theming, tooltips, and sound. Migrate existing raw compatibility paths deliberately, never silently.
- Forbidden patterns that fail `rgx_audit_lua`: raw `C_Timer`, manual event frames, `SLASH_` globals, unguarded `SetAttribute`, raw aura plumbing, and raw hook reassignment.
- Validation: Lua 5.1 (`luac5.1 -p`) and XML (`xmllint`) must pass through the shared CI include before every MR, and the root README stays nonempty and substantive.
- Dependencies: keep `## RequiredDeps: RGX-Framework` and any `## X-RGX-Framework-MinVersion` accurate against the framework version line, and match the TOC SavedVariables name (`SQPForeverSettings`) with the declarative `dbName`.
- Repo facts: this fork serves WoW Forever only (interface `16001`), installs as `SQP_Forever`, and commands run through `/sqp` (`/sqp help`, `/sqp status`, `/sqp test`). The TOC owns the `X.Y.Z-forever.beta.N` version; `SQP.VERSION` in `data/core.lua` bumps with it. Recheck facts in the TOC and README when they change.

## Keeping Interface Versions Current

- Ground truth is the game client's own `.build.info` in the WoW installation root: one pipe-delimited row per installed product; the Product column names the flavor and the Version column gives `major.minor.patch.build`. Read it immediately before changing a TOC or releasing.
- Derive `## Interface:` as `major * 10000 + minor * 100 + patch` (verified: `1.60.1` -> `16001`, `1.15.9` -> `11509`, `2.5.6` -> `20506`, `5.5.4` -> `50504`). WoW Forever is the classic beta product row.
- Online cross-checks for builds not installed locally: the wago.tools build pages and versions.wowtools.io. Verify a feed is reachable at runtime before trusting it; if it is unreachable, the installed client's `.build.info` is authoritative.
- A stale `## Interface:` value is a bug: fix it in a task-branch MR with green shared validation before any release.
- Release through GitLab MR and green shared validation, then patch-bump through the same discipline and create a protected GitLab release tag matching the TOC version. Verify the identical tag on the downstream `RGXMods/SimpleQuestPlates_Forever` mirror before reporting distribution pickup.
