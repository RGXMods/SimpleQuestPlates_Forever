--=====================================================================================
-- RGX | Simple Quest Plates! - options_kill.lua

-- Author: DonnieDice
-- Description: Kill tab — Display, Color, and Animation cards in framework columns
--=====================================================================================

local addonName, SQP = ...

function SQP:CreateKillOptions(content)
    if not self.optionControls then self.optionControls = {} end

    local leftColumn, rightColumn = SQP:CreateOptionColumns(content)

    local function ActivateKill()
        if SQP.previewFrame and SQP.previewFrame.activateKillMode then
            SQP.previewFrame.activateKillMode()
        end
    end

    local function MakeSlider(parent, labelText, key, defaultVal, minVal, maxVal, yOff)
        local slider = SQP:CreateStyledSlider(parent, {
            key = key,
            label = labelText,
            min = minVal,
            max = maxVal,
            step = 1,
            default = defaultVal,
            storage = SQPSettings,
            width = 160,
            onChange = function(val)
                if SQP.previewFrame and SQP.previewFrame.activateKillMode then
                    SQP.previewFrame.activateKillMode()
                end
                SQP:RefreshAllNameplates()
            end,
        })
        slider:SetPoint("TOPLEFT", 8, yOff)
        slider:SetPoint("TOPRIGHT", parent, "TOPRIGHT", -8, yOff)
        SQP.optionControls[key] = slider
        SQP.optionControls[key .. "Label"] = slider.valueLabel
        return yOff - slider:GetHeight() - 8
    end

    -- LEFT: Kill Display (show + side, display style, size/offsets, reset)
    local displayCard = SQP:CreateCard(leftColumn, "Kill Display")
    do
        local c = displayCard.content
        local yOffset = -8

        local showFrame = self:CreateStyledCheckbox(c, "Show Kill Icon")
        showFrame:SetPoint("TOPLEFT", 8, yOffset)
        showFrame.checkbox:SetChecked(SQPSettings.showKillIcon ~= false)
        self.optionControls.showKillIcon = showFrame.checkbox
        showFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('showKillIcon', self:GetChecked())
            ActivateKill()
            SQP:RefreshAllNameplates()
        end)
        self:CreateIconSideSection(c, "kill", ActivateKill, yOffset)
        yOffset = yOffset - 24

        -- Display Style (Classic / Forever dropdown, Text mode tick box)
        yOffset = self:CreateDisplayStyleSection(c, "kill", ActivateKill, yOffset)

        yOffset = MakeSlider(c, "Size",     "killIconSize",    12,  8,  40, yOffset)
        yOffset = MakeSlider(c, "Offset X", "killIconOffsetX",  2, -80,  80, yOffset)
        yOffset = MakeSlider(c, "Offset Y", "killIconOffsetY", 15, -80,  80, yOffset)

        yOffset = yOffset - 10
        local resetBtn = self:CreateStyledButton(c, "Reset Kill Settings", 150, 22)
        resetBtn:SetPoint("TOP", c, "TOP", 0, yOffset)
        resetBtn:SetScript("OnClick", function()
            local D = SQP.DEFAULTS
            local oc = SQP.optionControls
            SQP:SetSetting('showKillIcon',      D.showKillIcon)
            SQP:SetSetting('killShowIconBackground', D.killShowIconBackground)
            SQP:SetSetting('killLevelChip', nil)
            SQP:SetSetting('animateQuestIcons', D.animateQuestIcons)
            SQP:SetSetting('killAnimateMain',   D.killAnimateMain)
            SQP:SetSetting('killAnimationIntensity', D.killAnimationIntensity)
            SQP:SetSetting('killColor',         {unpack(D.killColor)})
            SQP:SetSetting('killTintIcon',      D.killTintIcon)
            SQP:SetSetting('killTintIconColor', {unpack(D.killTintIconColor)})
            SQP:SetSetting('killFontSize',      D.killFontSize)
            SQP:SetSetting('killFontFamily',    D.killFontFamily)
            SQP:SetSetting('killIconSide',      D.killIconSide)
            if oc.killIconSideSideUpdater then oc.killIconSideSideUpdater() end
            if oc.showKillIcon      then oc.showKillIcon:SetChecked(D.showKillIcon) end
            if oc.killShowIconBackgroundStyleUpdater then oc.killShowIconBackgroundStyleUpdater() end
            if oc.animateQuestIcons then oc.animateQuestIcons:SetChecked(D.animateQuestIcons) end
            if oc.animateQuestIconsLoot then oc.animateQuestIconsLoot:SetChecked(D.animateQuestIcons) end
            if oc.animateQuestIconsPercent then oc.animateQuestIconsPercent:SetChecked(D.animateQuestIcons) end
            if oc.killAnimateMain   then oc.killAnimateMain:SetChecked(D.killAnimateMain) end
            if oc.killAnimationIntensity and oc.killAnimationIntensity.SetValue then
                oc.killAnimationIntensity.SetValue(D.killAnimationIntensity)
            end
            if oc.killTintIcon      then oc.killTintIcon:SetChecked(D.killTintIcon) end
            if oc.killColorSwatch              then oc.killColorSwatch:SetColorTexture(unpack(D.killColor)) end
            if oc.killTintIconColorSwatch      then oc.killTintIconColorSwatch:SetColorTexture(unpack(D.killTintIconColor)) end
            if oc.killTintIconAlphaUpdate      then oc.killTintIconAlphaUpdate() end
            if oc.killIconSize    then oc.killIconSize.SetValue(D.killIconSize) end
            if oc.killIconOffsetX then oc.killIconOffsetX.SetValue(D.killIconOffsetX) end
            if oc.killIconOffsetY then oc.killIconOffsetY.SetValue(D.killIconOffsetY) end
            if oc.killFontSize then oc.killFontSize.SetValue(SQP:GetSettingBaseline("killFontSize")) end
            if oc.killFontFamily and type(oc.killFontFamily.Reset) == "function" then
                oc.killFontFamily:Reset()
            elseif oc.killFontFamily and type(oc.killFontFamily.SetPath) == "function" then
                oc.killFontFamily:SetPath(D.killFontFamily)
            elseif oc.killFontFamily and UIDropDownMenu_SetText then
                UIDropDownMenu_SetText(oc.killFontFamily, "Friz Quadrata")
            end
            SQP:RefreshAllNameplates()
            ActivateKill()
        end)
        displayCard:FitContent()
    end

    -- RIGHT: Kill Animation (top of the right column)
    local animCard = SQP:CreateCard(rightColumn, "Kill Animation")
    do
        local c = animCard.content
        local yOffset = -8

        local animFrame = self:CreateStyledCheckbox(c, "Animate Task Icons")
        animFrame:SetPoint("TOPLEFT", 8, yOffset)
        animFrame.checkbox:SetChecked(SQPSettings.animateQuestIcons == true)
        self.optionControls.animateQuestIcons = animFrame.checkbox
        animFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('animateQuestIcons', self:GetChecked())
            if SQP.optionControls and SQP.optionControls.animateQuestIconsLoot then
                SQP.optionControls.animateQuestIconsLoot:SetChecked(self:GetChecked())
            end
            if SQP.optionControls and SQP.optionControls.animateQuestIconsPercent then
                SQP.optionControls.animateQuestIconsPercent:SetChecked(self:GetChecked())
            end
            SQP:RefreshAllNameplates()
        end)
        yOffset = yOffset - 26

        local animMainFrame = self:CreateStyledCheckbox(c, "Animate Main Icon")
        animMainFrame:SetPoint("TOPLEFT", 8, yOffset)
        animMainFrame.checkbox:SetChecked(SQPSettings.killAnimateMain == true)
        self.optionControls.killAnimateMain = animMainFrame.checkbox
        animMainFrame.checkbox:SetScript("OnClick", function(self)
            SQP:SetSetting('killAnimateMain', self:GetChecked())
            SQP:RefreshAllNameplates()
        end)
        yOffset = yOffset - 26

        local killAnimIntensitySlider = SQP:CreateStyledSlider(c, {
            key = "killAnimationIntensity",
            label = "Intensity",
            min = 25,
            max = 200,
            step = 5,
            default = 100,
            storage = SQPSettings,
            width = 160,
            suffix = "%",
            onChange = function(val)
                if SQP.previewFrame and SQP.previewFrame.activateKillMode then
                    SQP.previewFrame.activateKillMode()
                end
                SQP:RefreshAllNameplates()
            end,
        })
        killAnimIntensitySlider:SetPoint("TOPLEFT", 8, yOffset)
        killAnimIntensitySlider:SetPoint("TOPRIGHT", c, "TOPRIGHT", -8, yOffset)
        self.optionControls.killAnimationIntensity = killAnimIntensitySlider
        self.optionControls.killAnimationIntensityLabel = killAnimIntensitySlider.valueLabel
        animCard:FitContent()
    end

    -- RIGHT: Kill Color (under Animation)
    local colorCard = SQP:CreateCard(rightColumn, "Kill Color", { above = animCard })
    do
        local c = colorCard.content
        local yOffset = -8

        -- Kill Color
        local colorHeader = c:CreateFontString(nil, "ARTWORK", "GameFontNormal")
        SQP:ApplyDefaultFont(colorHeader)
        colorHeader:SetPoint("TOPLEFT", 8, yOffset)
        colorHeader:SetText("|cff58be81Color|r")
        yOffset = yOffset - 16

        local killDefault = {1, 0.82, 0}
        local colorBtn = CreateFrame("Button", nil, c)
        colorBtn:SetSize(20, 20)
        colorBtn:SetPoint("TOPLEFT", 8, yOffset)
        local cbg = colorBtn:CreateTexture(nil, "BACKGROUND")
        cbg:SetAllPoints(); cbg:SetColorTexture(0, 0, 0, 1)
        local sw = colorBtn:CreateTexture(nil, "ARTWORK")
        sw:SetSize(16, 16); sw:SetPoint("CENTER")
        sw:SetColorTexture(unpack(SQPSettings.killColor or killDefault))
        SQP.optionControls.killColorSwatch = sw

        local colorLbl = c:CreateFontString(nil, "ARTWORK", "GameFontNormal")
        SQP:ApplyDefaultFont(colorLbl)
        colorLbl:SetPoint("LEFT", colorBtn, "RIGHT", 6, 0)
        colorLbl:SetText("Kill Color")
        colorLbl:SetTextColor(_G.RGXDesign:Unpack("text"))

        local colorReset = self:CreateInlineResetButton(c, function()
            SQP:SetSetting('killColor', {unpack(killDefault)})
            sw:SetColorTexture(unpack(killDefault)); SQP:RefreshAllNameplates()
        end)
        _G.RGXUI:AnchorRowReset(c, colorReset, colorBtn)

        colorBtn:SetScript("OnClick", function()
            ActivateKill()
            local r, g, b = unpack(SQPSettings.killColor or killDefault)
            _G.RGXColors:OpenPicker({
                r = r, g = g, b = b,
                onChanged = function(_, nr, ng, nb)
                    SQP:SetSetting('killColor', {nr, ng, nb})
                    sw:SetColorTexture(nr, ng, nb)
                    SQP:RefreshAllNameplates()
                end,
            })
        end)
        yOffset = yOffset - 28

        -- Kill Icon Tinting (mini icon, compact inline row; reset right-aligned)
        yOffset = self:CreateMiniIconTintSection(c, "kill", ActivateKill, yOffset)
        colorCard:FitContent()
    end
end
