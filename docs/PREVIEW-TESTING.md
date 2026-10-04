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
- On Kill, Loot and Percent, Left/Right is inline with Show Icon. Clicking
  checkbox text must toggle just like clicking the box; side buttons must not
  overlap/intercept the text. Check the narrowest supported panel width.
- Hover Kill/Loot/% to preview; click to select that page. Framework hover
  colors must remain visible. The divider above Global/Animation must appear.
- Percent sign starts off on a fresh profile and returns off after Reset.
  Its toggle must preserve the number/chip in Icon, Text and Level chip modes.
- Preview toast is centered and plays once on request. Changing unrelated
  controls must not restart it.
- Change global and per-type animation switches/intensities and toast values.
  Reset All Animation Settings must restore `SQP.DEFAULTS`, including Kill,
  Loot and Percent main-animation switches and their displayed controls.
- On Kill, Loot and Percent, select Classic and Forever in the dropdown, and
  tick Text only. The chip must appear in both the preview and live quest
  overlay, drawn with the client's level-indicator texture. Dropdown
  selection clears Text only; unticking returns to the inherited style.
  General's background selection clears type overrides; a type reset
  restores General inheritance.
- Tick Text only, untick back to Classic, then pick Forever, on each type
  and Global. Classic/Forever retain numeric counts (`5` for the sample
  Kill), while only Text only shows `5/8`. Ticking Text only while Forever
  is selected must hide the chip, not stack on it.
- Sliders display their value on hover without a permanent value above them.
- Profiles: create, switch, copy, rename, reset and delete; duplicate names
  must not overwrite data, Default remains protected, and values/visuals
  survive profile switches and `/reload`.
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
