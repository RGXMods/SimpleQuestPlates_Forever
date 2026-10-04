--=====================================================================================
-- RGX | Simple Quest Plates! - options_general.lua

-- Author: DonnieDice
-- Description: Global card grid and preview-selected per-type settings.
--              Animation and Quest Toast live on the separate Animation tab.
--=====================================================================================

local addonName, SQP = ...

local function Card(host, title, opts)
    return SQP:CreateCard(host, title, opts)
end

-- Global: behavior toggles and the reset action
local function BuildGeneralPage(leftColumn)
    local generalCard = Card(leftColumn, "General")
    do
        local c = generalCard.content
        local yOffset = -8

        local chatFrame = SQP:CreateStyledCheckbox(c, SQP.L["OPTIONS_CHAT_MESSAGES"] or "Show Chat Messages")
        chatFrame:SetPoint("TOPLEFT", 8, yOffset)
        chatFrame.checkbox:SetChecked(SQPSettings.showMessages ~= false)
        SQP.optionControls.showMessages = chatFrame.checkbox
        chatFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('showMessages', self:GetChecked())
        end)
        yOffset = yOffset - 22

        local minimapFrame = SQP:CreateStyledCheckbox(c, "Enable minimap icon")
        minimapFrame:SetPoint("TOPLEFT", 8, yOffset)
        minimapFrame.checkbox:SetChecked(SQPSettings.minimapIconEnabled ~= false)
        SQP.optionControls.minimapIconEnabled = minimapFrame.checkbox
        minimapFrame.checkbox:SetScript("OnClick", function(self)
            SQP:ToggleMinimapIcon(self:GetChecked())
        end)
        SQP:SetControlTooltip(minimapFrame, "Left-click opens options. Drag to move. Ctrl-right-click hides it.")
        yOffset = yOffset - 22

        local combatFrame = SQP:CreateStyledCheckbox(c, SQP.L["OPTIONS_HIDE_COMBAT"] or "Hide Icons in Combat")
        combatFrame:SetPoint("TOPLEFT", 8, yOffset)
        combatFrame.checkbox:SetChecked(SQPSettings.hideInCombat)
        SQP.optionControls.hideInCombat = combatFrame.checkbox
        combatFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('hideInCombat', self:GetChecked()); SQP:RefreshAllNameplates()
        end)
        yOffset = yOffset - 22

        local instanceFrame = SQP:CreateStyledCheckbox(c, SQP.L["OPTIONS_HIDE_INSTANCE"] or "Hide Icons in Instances")
        instanceFrame:SetPoint("TOPLEFT", 8, yOffset)
        instanceFrame.checkbox:SetChecked(SQPSettings.hideInInstance)
        SQP.optionControls.hideInInstance = instanceFrame.checkbox
        instanceFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('hideInInstance', self:GetChecked()); SQP:RefreshAllNameplates()
        end)
        yOffset = yOffset - 30
        local resetButton = SQP:CreateStyledButton(c, SQP.L["OPTIONS_RESET"] or "Reset All Settings", 138, 20)
        resetButton:SetPoint("TOP", c, "TOP", 0, yOffset)
        resetButton:SetAlpha(0.8)
        resetButton:SetScript("OnClick", function() StaticPopup_Show("SQP_RESET_CONFIRM") end)
        generalCard:FitContent()
    end
    return generalCard
end

-- Apply one global display mode everywhere: writes the global background
-- keys, clears per-type overrides, refreshes all style controls, rebuilds
-- plates and the preview. Shared by the Global dropdown and display presets.
-- mode: "icon" | "chip" | "text".
function SQP:ApplyGlobalDisplayStyle(mode)
    assert(mode == "icon" or mode == "chip" or mode == "text", "SQP: unknown display mode")
    SQP:SetSetting('unifiedNameplates', mode == "chip")
    SQP:SetSetting('showIconBackground', mode ~= "text")
    for _, typeKey in ipairs({ "kill", "loot", "percent" }) do
        SQP:SetSetting(typeKey .. "LevelChip", nil)
        SQP:SetSetting(typeKey .. "ShowIconBackground", nil)
        local update = SQP.optionControls[typeKey .. "ShowIconBackgroundStyleUpdater"]
        if update then update() end
    end
    local dd = SQP.optionControls.unifiedDropdown
    if dd and type(dd.SetValue) == "function" then
        dd:SetValue(mode == "chip" and "chip" or "icon")
    end
    local box = SQP.optionControls.showIconBackgroundTextOnly
    if box and type(box.SetChecked) == "function" then
        box:SetChecked(mode == "text")
    end
    SQP:RebuildQuestPlates()
    if SQP.previewFrame and type(SQP.previewFrame.UpdatePreview) == "function" then
        SQP.previewFrame:UpdatePreview()
    end
end

-- Page 2: Display — background style, text-only, position & scale, nameplate
-- side, plus the font card on the left.
local function BuildDisplayPage(leftColumn, rightColumn, generalCard)
    -- RIGHT: Display (quest display style + position & scale in one card)
    local displayCard = Card(rightColumn, "Display")
    do
        local c = displayCard.content
        local yOffset = -8

        local Drops = _G.RGXDropdowns
        if Drops and type(Drops.CreateNestedDropdown) == "function" then
            -- Two-way background: Classic icon or the Forever level chip.
            -- Text-only lives in the tick box below. Storage stays backward
            -- compatible: showIconBackground = icon/text toggle,
            -- unifiedNameplates = chip.
            local function CurrentMode()
                if SQPSettings.unifiedNameplates == true then return "chip" end
                return "icon"
            end
            local function RefreshPlatesAndPreview()
                SQP:RebuildQuestPlates()
                if SQP.previewFrame and type(SQP.previewFrame.UpdatePreview) == "function" then
                    SQP.previewFrame:UpdatePreview()
                end
            end
            local dd = Drops:CreateNestedDropdown(c, {
                label = "Background style",
                width = 300,
                buttonWidth = 290,
                triggerStyle = "retail",
                value = CurrentMode(),
                items = {
                    { text = "Classic (default)", value = "icon" },
                    { text = "Forever",               value = "chip" },
                },
                onChange = function(value)
                    SQP:ApplyGlobalDisplayStyle(value)
                end,
            })
            if dd then
                if dd.label then dd.label:SetTextColor(0.345, 0.745, 0.506) end
                dd:SetPoint("TOPLEFT", c, "TOPLEFT", 8, -8)
                dd:SetPoint("TOPRIGHT", c, "TOPRIGHT", -8, -8)
                SQP:SetControlTooltip(dd, "Pick every quest type's background: Classic icon or the Forever level-frame style.")
                SQP.optionControls.unifiedDropdown = dd
            end
            yOffset = yOffset - ((dd and dd:GetHeight()) or 56) - 8

            local textFrame = SQP:CreateStyledCheckbox(c, "Text mode")
            textFrame:SetPoint("TOPLEFT", 8, yOffset)
            textFrame.checkbox:SetChecked(SQPSettings.showIconBackground == false)
            SQP.optionControls.showIconBackgroundTextOnly = textFrame.checkbox
            textFrame.checkbox:SetScript("OnClick", function(self)
                if self:GetChecked() then
                    SQP:SetSetting('showIconBackground', false)
                    SQP:SetSetting('unifiedNameplates', false)
                else
                    SQP:SetSetting('showIconBackground', nil)
                    SQP:SetSetting('unifiedNameplates', nil)
                end
                for _, typeKey in ipairs({ "kill", "loot", "percent" }) do
                    SQP:SetSetting(typeKey .. "LevelChip", nil)
                    SQP:SetSetting(typeKey .. "ShowIconBackground", nil)
                    local update = SQP.optionControls[typeKey .. "ShowIconBackgroundStyleUpdater"]
                    if update then update() end
                end
                RefreshPlatesAndPreview()
            end)
            SQP:SetControlTooltip(textFrame, "Show only the count text, no icon background or chip.")
            yOffset = yOffset - 22
        end

        -- Range 0.5–1.5 centers the slider on 1; 1.1 is the baseline default.
        local scaleSlider = SQP:CreateStyledSlider(c, {
            key = "scale", label = "Scale", min = 0.5, max = 1.5, step = 0.1,
            default = 1.1, storage = SQPSettings, suffix = "", width = 160,
            onChange = function(value) SQP:RefreshAllNameplates() end,
        })
        scaleSlider:SetPoint("TOPLEFT", 8, yOffset)
        scaleSlider:SetPoint("TOPRIGHT", c, "TOPRIGHT", -8, yOffset)
        SQP.optionControls.scale = scaleSlider
        SQP.optionControls.scaleLabel = scaleSlider.valueLabel
        yOffset = yOffset - 42

        local xSlider = SQP:CreateStyledSlider(c, {
            key = "offsetX", label = "Offset X", min = -100, max = 100, step = 1,
            default = 0, storage = SQPSettings, width = 160,
            onChange = function(value) SQP:RefreshAllNameplates() end,
        })
        xSlider:SetPoint("TOPLEFT", 8, yOffset)
        xSlider:SetPoint("TOPRIGHT", c, "TOPRIGHT", -8, yOffset)
        SQP.optionControls.offsetX = xSlider
        SQP.optionControls.offsetXLabel = xSlider.valueLabel
        yOffset = yOffset - 42

        local ySlider = SQP:CreateStyledSlider(c, {
            key = "offsetY", label = "Offset Y", min = -100, max = 100, step = 1,
            default = 0, storage = SQPSettings, width = 160,
            onChange = function(value) SQP:RefreshAllNameplates() end,
        })
        ySlider:SetPoint("TOPLEFT", 8, yOffset)
        ySlider:SetPoint("TOPRIGHT", c, "TOPRIGHT", -8, yOffset)
        SQP.optionControls.offsetY = ySlider
        SQP.optionControls.offsetYLabel = ySlider.valueLabel
        yOffset = yOffset - 46

        local sideHeader = c:CreateFontString(nil, "ARTWORK", "GameFontNormal")
        SQP:ApplyDefaultFont(sideHeader)
        sideHeader:SetPoint("TOPLEFT", 8, yOffset)
        sideHeader:SetText("|cff58be81Nameplate Side|r")
        yOffset = yOffset - 18

        local sides = _G.RGXUI:CreateButtonGroup(c, { "Left Side", "Right Side" },
            { buttonWidth = 84, height = 20, gap = 8, y = yOffset })
        local leftBtn, rightBtn = sides.buttons[1], sides.buttons[2]
        SQP.optionControls.anchorButtons = {left = leftBtn, right = rightBtn}

        local function UpdateAnchorButtons()
            leftBtn:SetAlpha( SQPSettings.anchor == "RIGHT" and 1 or 0.6)
            rightBtn:SetAlpha(SQPSettings.anchor == "LEFT"  and 1 or 0.6)
        end
        SQP.optionControls.updateAnchorButtons = UpdateAnchorButtons
        UpdateAnchorButtons()

        leftBtn:SetScript("OnClick", function()
            SQP:SetSetting('anchor', "RIGHT")
            SQP:SetSetting('relativeTo', "LEFT")
            UpdateAnchorButtons()
            SQP:RefreshAllNameplates()
        end)
        rightBtn:SetScript("OnClick", function()
            SQP:SetSetting('anchor', "LEFT")
            SQP:SetSetting('relativeTo', "RIGHT")
            UpdateAnchorButtons()
            SQP:RefreshAllNameplates()
        end)
        displayCard:FitContent()
    end

    -- LEFT: Font
    local fontCard = Card(leftColumn, "Font", { above = generalCard })
    SQP:CreateFontSection(fontCard.content, nil, -8)
    fontCard:FitContent()
end

-- Page 3: Animation — animation switches, global intensity, and the quest toast
local function BuildAnimationPage(page)
    if not page then return end
    local leftColumn, rightColumn = SQP:CreateOptionColumns(page)

    -- LEFT: Animation (applies across all quest types)
    local animationCard = Card(leftColumn, "Animation")
    do
        local c = animationCard.content
        local yOffset = -8

        local taskFrame = SQP:CreateStyledCheckbox(c, "Animate task icons")
        taskFrame:SetPoint("TOPLEFT", 8, yOffset)
        taskFrame.checkbox:SetChecked(SQPSettings.animateQuestIcons == true)
        SQP.optionControls.animateQuestIcons = taskFrame.checkbox
        taskFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('animateQuestIcons', self:GetChecked())
            SQP:RefreshAllNameplates()
        end)
        SQP:SetControlTooltip(taskFrame, "Pulse the small kill, loot and percent task icons on plates.")
        yOffset = yOffset - 22

        local mainFrame = SQP:CreateStyledCheckbox(c, "Animate Main Icons")
        mainFrame:SetPoint("TOPLEFT", 8, yOffset)
        mainFrame.checkbox:SetChecked(SQPSettings.animateMainIcons == true)
        SQP.optionControls.animateMainIcons = mainFrame.checkbox
        mainFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('animateMainIcons', self:GetChecked())
            SQP:RefreshAllNameplates()
        end)
        SQP:SetControlTooltip(mainFrame, "Animate every main quest icon. When off, Kill, Loot and Percent use their individual switches.")
        yOffset = yOffset - 22

        local syncFrame = SQP:CreateStyledCheckbox(c, "Sync icon animations")
        syncFrame:SetPoint("TOPLEFT", 8, yOffset)
        syncFrame.checkbox:SetChecked(SQPSettings.syncAnimations == true)
        SQP.optionControls.syncAnimations = syncFrame.checkbox
        syncFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('syncAnimations', self:GetChecked())
            SQP:RefreshAllNameplates()
        end)
        SQP:SetControlTooltip(syncFrame, "Play the main, kill, loot and percent pulses in phase.")
        yOffset = yOffset - 22

        local globalFrame = SQP:CreateStyledCheckbox(c, "Use global intensity for all icons")
        globalFrame:SetPoint("TOPLEFT", 8, yOffset)
        globalFrame.checkbox:SetChecked(SQPSettings.useGlobalAnimationSettings == true)
        SQP.optionControls.useGlobalAnimationSettings = globalFrame.checkbox
        globalFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('useGlobalAnimationSettings', self:GetChecked())
            SQP:RefreshAllNameplates()
        end)
        SQP:SetControlTooltip(globalFrame, "When checked, the global intensity below drives every icon. When off, Kill, Loot and Percent use their individual intensity sliders.")
        yOffset = yOffset - 24

        local intensityReady = false
        local globalIntensitySlider = SQP:CreateStyledSlider(c, {
            key = "globalAnimationIntensity",
            label = "Global intensity",
            min = 25,
            max = 200,
            step = 5,
            default = 100,
            storage = SQPSettings,
            width = 160,
            suffix = "%",
            onChange = function(val)
                -- The framework invokes onChange once during construction;
                -- do not overwrite saved per-type intensities at panel open.
                if not intensityReady then return end
                for _, key in ipairs({ "killAnimationIntensity", "lootAnimationIntensity", "percentAnimationIntensity" }) do
                    SQP:SetSetting(key, val)
                    local slider = SQP.optionControls[key]
                    if slider and slider.SetValue then slider.SetValue(val) end
                end
                SQP:RefreshAllNameplates()
            end,
        })
        intensityReady = true
        globalIntensitySlider:SetPoint("TOPLEFT", 8, yOffset)
        globalIntensitySlider:SetPoint("TOPRIGHT", c, "TOPRIGHT", -8, yOffset)
        SQP.optionControls.globalAnimationIntensity = globalIntensitySlider
        SQP.optionControls.globalAnimationIntensityLabel = globalIntensitySlider.valueLabel
        yOffset = yOffset - 48

        -- Bottom of the card: restores every SQP animation setting, not just
        -- the toast trio. Baselines match SQP.DEFAULTS exactly.
        local animationKeys = {
            "animateQuestIcon", "animateQuestIcons", "animateMainIcons",
            "killAnimateMain", "lootAnimateMain", "percentAnimateMain",
            "syncAnimations", "useGlobalAnimationSettings", "globalAnimationEnabled",
            "animationCombatMode", "globalAnimationIntensity", "killAnimationIntensity",
            "lootAnimationIntensity", "percentAnimationIntensity", "showQuestMarker",
            "questMarkerSize", "toastDuration", "toastHeight",
        }
        local resetAll = SQP:CreateStyledButton(c, "Reset All Animation Settings", 190, 20)
        resetAll:SetPoint("TOP", c, "TOP", 0, yOffset)
        resetAll:SetScript("OnClick", function()
            local animationDefaults = {}
            for _, key in ipairs(animationKeys) do
                local value = SQP.DEFAULTS[key]
                animationDefaults[key] = value
                SQP:SetSetting(key, value)
            end
            for key, control in pairs(SQP.optionControls or {}) do
                if animationDefaults[key] ~= nil then
                    if control.SetChecked then
                        control:SetChecked(animationDefaults[key] == true)
                    elseif control.SetValue then
                        control.SetValue(animationDefaults[key])
                    end
                end
            end
            for _, key in ipairs({ "animateQuestIconsLoot", "animateQuestIconsPercent" }) do
                local control = SQP.optionControls[key]
                if control then control:SetChecked(SQP.DEFAULTS.animateQuestIcons) end
            end
            SQP:RefreshAllNameplates()
            if SQP.previewFrame and SQP.previewFrame.UpdatePreview then
                SQP.previewFrame:UpdatePreview()
            end
        end)
        SQP.optionControls.resetAllAnimations = resetAll
        animationCard:FitContent()
    end

    -- RIGHT: Quest Toast (the on-target question-mark pop)
    local toastCard = Card(rightColumn, "Quest Toast")
    do
        local c = toastCard.content
        local flow = toastCard.flow

        local toastFrame = SQP:CreateStyledCheckbox(c, "Quest toast (on target)")
        flow:Add(toastFrame, { fill = true })
        toastFrame.checkbox:SetChecked(SQPSettings.showQuestMarker ~= false)
        SQP.optionControls.showQuestMarker = toastFrame.checkbox
        toastFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('showQuestMarker', self:GetChecked())
            SQP:RefreshAllNameplates()
        end)
        SQP:SetControlTooltip(toastFrame, "Quest marker toast: the question-mark pop that plays when you target a mob with a quest icon.")

        local toastDurationSlider = SQP:CreateStyledSlider(c, {
            key = "toastDuration", label = "Toast Duration", min = 0.3, max = 2.5, step = 0.1,
            default = 1.3, storage = SQPSettings, suffix = "s", width = 160,
        })
        flow:Add(toastDurationSlider, { fill = true })
        SQP.optionControls.toastDuration = toastDurationSlider
        SQP.optionControls.toastDurationLabel = toastDurationSlider.valueLabel

        -- Selecting the toast card's preview is the only way the toast replays;
        -- typing random animation options must not fire it. Toast stays
        -- selected only while this tab is open and the feature is enabled.
        -- The button sits centered on its own row via a full-width host so
        -- the flow layout keeps its vertical rhythm.
        local toastPreviewHost = CreateFrame("Frame", nil, c)
        toastPreviewHost:SetHeight(20)
        local toastPreview = SQP:CreateStyledButton(toastPreviewHost, "Preview toast", 88, 20)
        toastPreview:SetPoint("TOP", toastPreviewHost, "TOP", 0, 0)
        flow:Add(toastPreviewHost, { fill = true })
        SQP.optionControls.toastPreviewButton = toastPreview
        toastPreview:SetScript("OnClick", function()
            if SQP.previewFrame and SQP.previewFrame.questFrame then
                SQP:SetQuestToastSelected(SQP.previewFrame.questFrame, true)
            end
        end)

        local toastHeightSlider = SQP:CreateStyledSlider(c, {
            key = "toastHeight", label = "Toast Height", min = 0, max = 60, step = 2,
            default = 30, storage = SQPSettings, suffix = "", width = 160,
        })
        flow:Add(toastHeightSlider, { fill = true })
        SQP.optionControls.toastHeight = toastHeightSlider
        SQP.optionControls.toastHeightLabel = toastHeightSlider.valueLabel

        local toastSizeSlider = SQP:CreateStyledSlider(c, {
            key = "questMarkerSize", label = "Toast Size", min = 12, max = 48, step = 2,
            default = 40, storage = SQPSettings, suffix = "", width = 160,
            onChange = function(value) SQP:RefreshAllNameplates() end,
        })
        flow:Add(toastSizeSlider, { fill = true })
        SQP.optionControls.questMarkerSize = toastSizeSlider
        SQP.optionControls.questMarkerSizeLabel = toastSizeSlider.valueLabel
        toastCard:AutoHeight()
    end
end

-- The preview selectors own the per-type pages; the tab row stays global.
function SQP:CreateGlobalOptions(content)
    if not self.optionControls then self.optionControls = {} end
    local pages = {}
    for i = 1, 4 do
        local page = CreateFrame("Frame", nil, content)
        page:SetAllPoints()
        page:SetShown(i == 1)
        pages[i] = page
    end
    local pager = { frames = pages, page = 1 }
    function pager:SetPage(n)
        self.page = n
        for i, page in ipairs(self.frames) do page:SetShown(i == n) end
    end
    self.optionControls.generalPager = pager
    local leftColumn, rightColumn = SQP:CreateOptionColumns(pages[1])
    local generalCard = BuildGeneralPage(leftColumn)
    BuildDisplayPage(leftColumn, rightColumn, generalCard)
    -- Build each type page when shown: framework cards measure their children
    -- against visible geometry, which is unavailable on a hidden page.
    local builders = { SQP.CreateKillOptions, SQP.CreateLootOptions, SQP.CreatePercentOptions }
    for i = 2, 4 do
        local page = pages[i]
        local builder = builders[i - 1]
        page:SetScript("OnShow", function(self)
            if not self._built then
                self._built = true
                local design = _G.RGXDesign
                if design and design.WithTheme and SQP.optionsTheme then
                    design:WithTheme(SQP.optionsTheme, function() builder(SQP, self) end)
                else
                    builder(SQP, self)
                end
            end
        end)
    end
end

function SQP:CreateAnimationOptions(content)
    if not self.optionControls then self.optionControls = {} end
    BuildAnimationPage(content)
end
