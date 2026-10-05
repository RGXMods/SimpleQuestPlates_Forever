# Forever preview and animation regression checks

Run from this checkout, with the framework's CI dependencies installed:

```powershell
node tools/test/preview-layout-check.mjs "C:\path\to\RGX-Framework"
```

The harness runs the real consumer Lua and framework flow algorithm with
explicit frame seams. It checks toast/reset spacing, animation reset coverage,
unavailable nameplate coordinates, unclamped reference geometry, live/preview
task-icon sizes and anchors, level-chip rendering and selection, canonical
slider baselines, inherited General font defaults, fallback slider calls, and
that the client preview template builds its overlay through the live factory
with identical anchors. It also executes all three inline side selectors,
verifies their card/anchor ownership, and confirms preview decoration suppression
survives Blizzard re-show attempts without affecting live decorations.
It does not emulate WoW rendering or prove
restricted-frame safety.

## Beta validation

After installing the test build and reloading the Forever beta:

- Open Animation. Reset All Animation Settings sits at the bottom of the
  Animation card, below Global intensity without overlap; Toast Size stays
  in the Quest Toast card. Resize/reopen the panel and repeat.
- The options banner should render a real client nameplate (the same
  NamePlatePreviewTemplate mechanism the game's own nameplate settings use).
  Its style, scale, name and level display must match in-world plates;
  if the template is unavailable, a Classic-constant mock is drawn instead —
  report which one you see.
- The preview's Blizzard classification/raid-target decorations and aura
  buff/debuff lists must stay hidden, including after reopening Settings.
  Live plates retain their normal decorations and auras.
- Kill/Loot/Percent Task Icon headers hold only the far-right icon switch.
  Tint/color selection is the first body row, then Left Side/Right Side, followed
  by the size/offset sliders.
  Check button/card clearance at narrow widths.
  Percent's icon switch still defaults off. Loot Text Mode remains in the body.
- Global Display has Task Icons and Text Mode in its first body row, followed
  by centered Left Side/Right Side and then Scale/overlay-position sliders.
- Hover Kill/Loot/% to preview; click to select that page. Framework hover
  colors must remain visible. The divider above Global/Animation must appear.
- Percent sign starts off on a fresh profile and returns off after Reset.
  Its toggle must preserve the number/chip in Icon, Text and Level chip modes.
- Preview toast is centered and plays once on request. Changing unrelated
  controls must not restart it.
- Change global and per-type animation switches/intensities and toast values.
  Reset All Animation Settings must restore `SQP.DEFAULTS`, including Kill,
  Loot and Percent main-animation switches and their displayed controls.
- While a type preview is visible, drag Global intensity: the visible preview
  must stay that type. Child sliders update without flipping the mode.
- The preview banner is tighter and pages are taller: verify the banner has
  less dead space above the nameplate with no clipping at small widths,
  and page content gains vertical room (including Settings-embedded view).
- Profiles: the dropdown is 220px, action buttons 84px, the active box shows
  the profile name in the brand color plus "Character: <name - realm>", and
  the Presets card sits below. Compare directly with the reference page.
- On Kill, Loot and Percent, select Classic and Forever in the dropdown, and
  tick Text mode. The chip must appear in both the preview and live quest
  overlay, drawn with the client's level-indicator texture. Dropdown
  selection preserves Text mode; toggling Text mode preserves the background.
  General's background selection clears only type background overrides;
  a type reset restores General inheritance.
- Tick Text mode, untick back to Classic, then pick Forever, on each type
   and Global. With Text mode off, Classic/Forever use numeric counts (`5`
   for the sample Kill). With Text mode on, Kill/Loot use ratios (`5/8`,
   `2/5`): Forever retains its chip around the ratio, Classic shows bare text.
   Percent retains the numeric chip and configured sign. Check both selection
   orders, switching profiles and `/reload`.
- Sliders display their value on hover without a permanent value above them.
- Profiles: create, switch, copy, rename, reset and delete; duplicate names
  must not overwrite data, Default remains protected, and values/visuals
  survive profile switches and `/reload`. Presets: apply Classic, Text
  Only and Forever in turn; each must update the display, controls, plates
  and preview together.
- With a live quest nameplate visible, compare marker and requirement-icon
  placement at default and changed General scale/X/Y/side settings. Repeat
  with non-default nameplate/UI scales.
- Set a Blizzard raid marker on a quest mob: the quest overlay must hide and
  the marker must be fully visible (the addon never blocks markers). Clear
  the marker: the overlay must return. With the addon enabled, markers must
  appear on every marked target.
- Change individual task sizes and offsets. Each reset/slider default must
  agree with the corresponding canonical `SQP.DEFAULTS` entry. Main overlay
  scale remains the General setting; per-type fonts inherit General unless
  explicitly overridden.
- Reload and verify persistence. Capture any Lua error with its full stack.

Keep issue #7 open until these actual-client checks pass.

## Final-request batch (local beta validation)

- Kill/Loot/Percent: Main Icon above Animation on the left, Task Icon on the
  right. Main Icon owns Background Style, Text Mode and Count Color. Task Icon
  owns its switch, Left Side/Right Side, size/position sliders and icon tint.
  Verify that changing task tint does not change Count Color, and vice versa.

- On individual Kill/Loot/Percent settings pages, hovering other preview buttons
  must not change the displayed type. Button hover styling and click navigation
  still work. Global/Animation retain persistent hover selection.

- Animation header OFF also sets Quest Toast OFF and updates its visible switch.
  Quest Toast OFF never disables the Animation master. Turning Animation back
  ON restores Toast's previous state (ON or OFF); per-type pulse options stay
  saved. Repeat after reload and after switching profiles while the master is OFF.
- Kill/Loot/Percent Animation card headers: each switch gates only that type's
  animations. Kill/Loot default ON; Percent defaults OFF (no animations).
  Reset All Animation Settings and Reset Percent Settings restore Percent OFF.
- Type-page headers read Kill, Loot and Percent, with independent module switches.
  Disable one type: its live overlay and preview disappear; other types remain.
- Global Right Side moves Kill/Loot task badges to the right of the display chip.
  Existing user offset adjustments remain relative to the right-side baseline.
- Text Mode shifts the display baseline left by 3px without rewriting saved X.
  Global Right-side X defaults/resets to +23; Left defaults/resets to 0.
  Left placement task-icon X resets to +1 for Classic Kill, 0 for Forever Kill
  and +3 for Loot; right placement
  resets Kill X to -3 and Loot X to -44. Kill/Loot Y reset to 16. Test both individual
  slider R and per-type reset, then Reset All Settings (Classic Kill X +1).
  Custom saved offsets remain until explicitly reset.
  Switching sides translates default offsets while retaining custom offsets.
  Animate Main Icons pulses the visible ratio text, including Forever + Text.
- Quest Toast enable/disable switch sits at the right of the card header.
  Show Loot Icon also uses a switch in the Loot Task Icon header; verify that it
  hides only the Loot task icon and restores the saved state after reload.
  Preview Toast is centered at the bottom of the body, below Toast Size.
  Check header clearance at the narrowest supported width and toggle persistence.
- Preserve the active "forever holloween" profile; verify switches after reload
  and switching away from/back to the profile. Visual sign-off remains required.

## Operator Default baseline and reset verification

The operator-approved **New baseline task icon positions** profile supplied on
2026-10-05 is the current baseline authority, superseding the earlier Default
snapshot. Canonical settings are checked against that read-only client snapshot before
adoption; profile metadata and redundant false chip overrides are not runtime
defaults. The effective default display remains Classic.

```powershell
node tools/test/reset-settings-check.mjs "<RGX-Framework-checkout>" "<SavedVariables-file>" "<Profile-name>"
```

This compares every explicitly saved canonical value against the selected profile
(Default if the final argument is omitted); absent settings retain inheritance. It
executes the real SQP/framework reset path for Default and a custom profile.
It checks nested colors, optional overrides, legacy-key removal and the options
refresh callback. Visual control restoration and in-world placement still need
the client. Deployment never writes the SavedVariables file.

- Percent Text Mode also enables its task-icon switch; verify preview and live
  percent display when that switch was previously OFF.
- Kill, Loot and Percent Task Icon side-button groups are centered below the tint/color row.
- Every individual Main Icon card keeps Text Mode in row one, Count Color next,
  and Background Style at the bottom. No Text Mode checkbox belongs in its header.
