import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
// Real consumer Lua + framework flow algorithm, explicit frame/geometry seams.
// This does not emulate WoW rendering or establish protected-frame safety.
const checkout=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const framework=resolve(process.argv[2] || join(checkout,'../RGX-Framework'));
const require=createRequire(join(framework,'tools/ci/package.json'));
const {Lua}=require('wasmoon-lua5.1');
const root=join(checkout,'data');
const lua=await Lua.create();
const core=readFileSync(`${root}/core.lua`,'utf8');
lua.ctx.baselines=core.slice(core.indexOf('function SQP:GetSettingBaseline'),core.indexOf('-- Declare defaults'));
lua.ctx.defaults=core.slice(core.indexOf('SQP.DEFAULTS = {'),core.indexOf('SQP.defaultMinimapAngle'));
lua.ctx.settingSetter=core.slice(core.indexOf('function SQP:SetSetting'),core.indexOf('-- Reset settings to default'));
for(const name of ['options_general','options_preview','options_widgets','options_kill','options_loot','options_percent','nameplates','quest','events'])lua.ctx[name]=readFileSync(`${root}/${name}.lua`,'utf8');
lua.ctx.layout=readFileSync(join(framework,'modules/ui/layout.lua'),'utf8');
let failed=0;
try{
lua.doStringSync(`
  UI={} RGXFramework={GetDesign=function()return{Unpack=function()return 1,1,1,1 end}end,API={CanAccessValue=function(v)return true end}}
  local methods={}
  local noop=function()end
  local function widget(parent)
    local w={parent=parent,children={},scripts={},w=300,h=20,shown=true,scale=1}
    setmetatable(w,{__index=function(_,k)if methods[k]then return methods[k]end if k:match('^Set')or k:match('^Enable')or k=='Play'or k=='Stop'then return noop end end})
    if parent then table.insert(parent.children,w)end
    return w
  end
  function methods:SetSize(w,h)self.w=w self.h=h end
  function methods:SetWidth(w)self.w=w end
  function methods:SetHeight(h)self.h=h end
  function methods:GetWidth()return self.w end
  function methods:GetHeight()return self.h end
  function methods:GetTop()return 0 end
  function methods:GetBottom()return self.y-self.h end
  function methods:GetLeft()return 0 end
  function methods:GetEffectiveScale()return self.scale*(self.parent and self.parent:GetEffectiveScale() or 1)end
  function methods:SetScale(s)self.scale=s end
  function methods:SetPoint(point,relative,relativePoint,x,y)
    if type(relative)=='number'then x,y=relative,relativePoint relative=self.parent relativePoint=point end
    relative=relative or self.parent relativePoint=relativePoint or point x=x or 0 y=y or 0
     self.point={point,relative,relativePoint,x,y}
     self.anchorCount=(self.anchorCount or 0)+1
    self.y=y
    if relativePoint=='BOTTOMLEFT'or relativePoint=='BOTTOMRIGHT'then
      self.y=-relative:GetHeight()+y
      if point=='BOTTOMLEFT'or point=='BOTTOMRIGHT'then self.y=self.y+self.h end
    end
  end
  function methods:GetPoint()return unpack(self.point or {})end
   function methods:ClearAllPoints()self.point=nil self.anchorCount=0 end
  function methods:SetAllPoints(relative)self.all=relative or self.parent self.w=self.all.w self.h=self.all.h self.y=0 end
  function methods:SetScript(k,fn)self.scripts[k]=fn end
   function methods:HookScript(k,fn)
     local previous=self.scripts[k]
     self.scripts[k]=function(self,...)if previous then previous(self,...)end fn(self,...)end
   end
  function methods:SetText(t)self.text=t end
  function methods:GetText()return self.text end
  function methods:IsShown()return self.shown end
   function methods:Show()
     local changed=not self.shown self.shown=true
     if changed and self.scripts.OnShow then self.scripts.OnShow(self)end
   end
  function methods:Hide()self.shown=false end
  function methods:SetShown(s)self.shown=s end
  function methods:SetChecked(v)self.checked=v end
  function methods:GetChecked()return self.checked end
  function methods:SetFont(_,size)self.fontSize=size end
  function methods:GetFont()return 'font',self.fontSize or 12,'' end
  function methods:GetStringWidth()return #(self.text or '')*6 end
  function methods:SetTexture(t)self.texture=t end
  function methods:GetTexture()return self.texture end
  function methods:CreateTexture()return widget(self)end
  function methods:CreateFontString()return widget(self)end
  function methods:CreateAnimationGroup()return widget(self)end
  function methods:CreateAnimation()return widget(self)end
  function methods:IsPlaying()return false end
  function methods:GetParent()return self.parent end
  function methods:GetFrameLevel()return self.frameLevel or 5 end
  function methods:SetFrameLevel(v)self.frameLevel=v end
  function methods:GetMinMaxValues()return self.min or 0,self.max or 100 end
  function methods:SetMinMaxValues(min,max)self.min=min self.max=max end
  function methods:GetValueStep()return self.step or 1 end
  function methods:SetValueStep(v)self.step=v end
  function methods:GetThumbTexture()return nil end
  CreateFrame=function(kind,_,parent,template)
    local w=widget(parent)w.kind=kind
    if template=='NamePlatePreviewTemplate'then w.NamePlate=widget(w)w.NamePlate.kind='Button' end
    return w
  end
  assert(loadstring(layout))('framework',UI)
  SQP={L={},optionControls={},DEFAULTS={scale=1.1,fontSize=12,anchor='RIGHT',relativeTo='LEFT',offsetX=0,offsetY=0,killIconSide='left',lootIconSide='right',killIconSize=12,lootIconSize=14,percentIconSize=8,killIconOffsetX=2,killIconOffsetY=15,lootIconOffsetX=-38,lootIconOffsetY=16,percentIconOffsetX=18,percentIconOffsetY=0},RefreshAllNameplates=noop,UpdateQuestFont=noop,GetOutlineInfo=function()return 0 end,IsAnimationEnabled=function()return false end,ApplyPulseDuration=noop,GetAnimationDuration=function()return 1 end}
  SQPSettings={scale=1.1,showQuestMarker=true,unifiedNameplates=false}
  assert(loadstring(defaults))()
  assert(loadstring(baselines))()
  function SQP:SetSetting(k,v)SQPSettings[k]=v end
  function SQP:SetControlTooltip()end
  function SQP:CreateOptionColumns(parent)return widget(parent),widget(parent)end
  function SQP:CreateCard(parent)
    local card=widget(parent) card.h=200 card.content=widget(card)
    card.content.h=146
    function card:FitContent()
      local deepest=0
      for _,child in ipairs(self.content.children)do if child.y then deepest=math.max(deepest,-child:GetBottom())end end
      self.h=54+deepest+2 self.content.h=self.h-54
    end
    card.flow=UI:CreateFlowLayout(card.content)
    function card:AutoHeight()self.content.h=self.flow:Apply() self.h=54+self.content.h end
    return card
  end
  function SQP:CreateStyledCheckbox(parent)local w=widget(parent)w.checkbox=widget(w)w.label=widget(w)return w end
  function SQP:CreateStyledButton(parent,text,w,h)local b=widget(parent)b:SetSize(w,h)b:SetText(text)return b end
  function SQP:CreateStyledSlider(parent,opts)
    local s=widget(parent)s.h=38 s.opts=opts s.valueLabel=widget(s)
    s.SetValue=function(a,b)local v=b or a assert(type(v)=='number','reset slider baseline must be numeric')SQPSettings[opts.key]=v end
    return s
  end
  mockCard=SQP.CreateCard mockColumns=SQP.CreateOptionColumns mockSlider=SQP.CreateStyledSlider
  mockButton=SQP.CreateStyledButton mockCheckbox=SQP.CreateStyledCheckbox
  assert(loadstring(options_general))('SQP',SQP)
  assert(loadstring(nameplates))('SQP',SQP)
  assert(loadstring(options_preview))('SQP',SQP)
  host=widget(nil)
`);
for(const [name,body]of [
 ['Forever changes background without inheriting Text ratios',`
    NamePlatePreviewMixin=nil NamePlateDriverFrame=nil
    SQPSettings.killLevelChip=true SQPSettings.killShowIconBackground=false
    local p=SQP:CreatePreviewSection(host) p.questType='kill' p:UpdatePreview()
    assert(p.questChip:IsShown() and p.iconText:GetText()=='5','Forever incorrectly rendered Text ratio '..tostring(p.iconText:GetText()))
    SQPSettings.killLevelChip=nil SQPSettings.killShowIconBackground=nil
 `],
 ['clearing per-type style restores global inheritance rather than forcing Text',`
    local previous=SQP.SetSetting
    assert(loadstring(settingSetter))('SQP',SQP)
    for _,key in ipairs({'kill','loot','percent'})do
      SQP:SetSetting(key..'ShowIconBackground',false)
      SQP:SetSetting(key..'ShowIconBackground',nil)
      assert(SQPSettings[key..'ShowIconBackground']==nil,'style override cleared to false for '..key)
    end
    SQP.SetSetting=previous
 `],
  ['raid marker hides quest overlay without touching Blizzard marker state',`
    UnitName=function() return 'Tester' end
    assert(loadstring(quest))('SQP',SQP)
    local wasEnabled=SQPSettings.enabled
    SQPSettings.enabled=true
    UnitExists=function() return true end
    local seen={}
    GetRaidTargetIndex=function(unit) seen[#seen+1]=unit return 8 end
    local progressCalls=0
    SQP.GetQuestProgress=function(...) progressCalls=progressCalls+1 return '3/5',1,3,0,nil end
    local plate=CreateFrame('Frame') plate._unitID='nameplate1'
    local overlay=CreateFrame('Frame',nil,plate)
    overlay.icon=overlay:CreateTexture()
    overlay.iconText=overlay:CreateFontString()
    overlay.iconTextOutline=overlay:CreateFontString()
    overlay.IsVisible=function() return true end
    overlay:Show()
    SQP.QuestPlates={[plate]=overlay}
    SQP:UpdateQuestIcon(plate,'nameplate1')
    assert(not overlay:IsShown(),'marked unit kept quest overlay')
    assert(#seen==1 and seen[1]=='nameplate1','marker read used wrong unit')
    assert(progressCalls==0,'marked unit ran quest evaluation before hiding')
    GetRaidTargetIndex=function() return nil end
    overlay:Show()
    SQP:UpdateQuestIcon(plate,'nameplate1')
    assert(progressCalls==1,'unmarked unit did not reach quest evaluation')
    assert(overlay:IsShown() and tostring(overlay.iconText:GetText())=='3','unmarked quest unit did not render')
    assert(loadstring(quest))('SQP',SQP)
    SQPSettings.enabled=wasEnabled
    GetRaidTargetIndex=nil UnitExists=nil SQP.QuestPlates={} SQP.ActiveNameplates={}
  `],
  ['raid marker changes re-evaluate visible plates',`
    local registered={}
    RGXFramework.RegisterEvent=function(_,event,fn) registered[event]=fn end
    RGXFramework.OnReady=function() end
    RGXFramework.UnregisterEvent=function() end
    UnitName=function() return 'Tester' end
    assert(loadstring(quest))('SQP',SQP)
    assert(loadstring(events))('SQP',SQP)
    assert(registered.RAID_TARGET_UPDATE,'RAID_TARGET_UPDATE not registered')
    SQPSettings.enabled=true
    UnitExists=function() return true end
    GetRaidTargetIndex=function() return 3 end
    local plate=CreateFrame('Frame') plate._unitID='nameplate1' plate._plateUnitID='nameplate1'
    local overlay=CreateFrame('Frame',nil,plate) overlay:Show()
    SQP.QuestPlates={[plate]=overlay} SQP.ActiveNameplates={[plate]=plate}
    registered.RAID_TARGET_UPDATE()
    assert(not overlay:IsShown(),'marker change did not hide quest overlay')
    GetRaidTargetIndex=nil UnitExists=nil SQP.QuestPlates={} SQP.ActiveNameplates={}
  `],
  ['secret GUIDs fail closed to uncached evaluation instead of erroring',`
    UnitName=function() return 'Tester' end
    assert(loadstring(quest))('SQP',SQP)
    local wasEnabled=SQPSettings.enabled
    SQPSettings.enabled=true
    UnitExists=function() return true end
    UnitGUID=function() return 'Creature-0-1-2-3-4-0000000000' end
    GetRaidTargetIndex=function() return nil end
    SQP.Compat={}
    SQPScanTooltip=CreateFrame('Frame') SQPScanTooltip.NumLines=function() return 0 end
    -- Simulate the client refusing to index with secret keys.
    SQP._questProgressCache=setmetatable({}, {
      __index=function() error('attempted to index a table that cannot be indexed with secret keys') end,
      __newindex=function() error('attempted to index a table that cannot be indexed with secret keys') end})
    local plate=CreateFrame('Frame') plate._unitID='nameplate1'
    local overlay=CreateFrame('Frame',nil,plate)
    overlay.icon=overlay:CreateTexture()
    overlay.iconText=overlay:CreateFontString()
    overlay.iconTextOutline=overlay:CreateFontString()
    overlay.IsVisible=function() return true end
    overlay:Show()
    SQP.QuestPlates={[plate]=overlay} SQP.ActiveNameplates={[plate]=plate}
    SQP:UpdateQuestIcon(plate,'nameplate1')
    assert(not overlay:IsShown(),'secret-keyed unit left a stale overlay')
    assert(loadstring(quest))('SQP',SQP)
    SQP._questProgressCache={}
    SQPSettings.enabled=wasEnabled
    SQP.Compat=nil SQPScanTooltip=nil UnitGUID=nil UnitExists=nil
    GetRaidTargetIndex=nil SQP.QuestPlates={} SQP.ActiveNameplates={}
  `],
  ['preview type buttons mirror the framework divider gap',`
    local banner=CreateFrame('Frame') banner.divider=CreateFrame('Frame',nil,banner) banner.dividerGap=10
    local p=SQP:CreatePreviewSection(banner)
    local kill
    for _,child in ipairs(p.children)do if child.text=='Kill'then kill=child end end
    assert(kill and kill.point[2]==banner.divider and kill.point[3]=='TOP','type buttons are not anchored to divider')
    assert(kill.point[5]==banner.dividerGap,'preview buttons do not mirror framework tab spacing')
 `],
  ['reset button sits below global intensity without overlap',`SQP:CreateAnimationOptions(host) local s=SQP.optionControls.globalAnimationIntensity local b=SQP.optionControls.resetAllAnimations assert(b:GetParent()==s:GetParent(),'reset button left the Animation card') assert(b.y <= s.y-s.h-8,'reset overlaps Global intensity: button top='..b.y..', slider bottom='..(s.y-s.h))`],
 ['reset all animation settings includes per-type switches',`SQPSettings.killAnimateMain=true SQPSettings.lootAnimateMain=true SQPSettings.percentAnimateMain=true SQPSettings.toastDuration=2.5 SQP.optionControls.resetAllAnimations.scripts.OnClick() for _,key in ipairs({'killAnimateMain','lootAnimateMain','percentAnimateMain','toastDuration','questMarkerSize','toastHeight'})do assert(SQPSettings[key]==SQP.DEFAULTS[key],'animation reset missed '..key)end`],
 ['preview survives unavailable plate coordinates',`local plate=CreateFrame('Frame') local unit=CreateFrame('Frame',nil,plate) local bar=CreateFrame('Frame',nil,unit) plate.UnitFrame=unit unit.HealthBarsContainer=bar unit.healthBar=bar bar.healthBar=bar plate.GetLeft=function()error('live plate coordinates restricted')end SQP.ActiveNameplates={[plate]=true} SQP:CreatePreviewSection(host)`],
 ['preview does not distort reference health geometry',`local plate=CreateFrame('Frame') plate:SetSize(320,90) local unit=CreateFrame('Frame',nil,plate) local bar=CreateFrame('StatusBar',nil,unit) bar:SetSize(290,28) plate.UnitFrame=unit unit.HealthBarsContainer=bar unit.healthBar=bar bar.healthBar=bar SQP.ActiveNameplates={[plate]=true} local preview=SQP:CreatePreviewSection(host) local health for _,child in ipairs(preview.nameplate.children)do if child.kind=='StatusBar'then health=child end end assert(health and health:GetWidth()==290 and health:GetHeight()==28,'preview clamps health dimensions independently of its anchor')`],
 ['preview and live task badge baselines agree',`local plate=CreateFrame('Frame') SQP.ActiveNameplates={} SQP:CreateQuestPlate(plate) local live=SQP.QuestPlates[plate] local preview=SQP:CreatePreviewSection(host) for _,key in ipairs({'kill','loot'})do local a=live[key..'Icon'] local b=preview[key..'Icon'] assert(a.w==SQP.DEFAULTS[key..'IconSize'] and a.w==b.w,'badge size baseline differs') for _,index in ipairs({1,3,4,5})do assert(a.point[index]==b.point[index],'badge anchor baseline differs')end end assert(live.levelChip,'chip texture missing in floating mode')`],
 ['level chip preview renders all quest types',`SQPSettings.unifiedNameplates=false SQP.ActiveNameplates={} local p=SQP:CreatePreviewSection(host) for _,key in ipairs({'kill','loot','percent'})do SQPSettings[key..'LevelChip']=true p.questType=key p:UpdatePreview() assert(p.questChip:IsShown() and p.questChip.w>10 and not p.icon:IsShown(),'chip absent for '..key)end`],
 ['level chip is a frame with background artwork, not a highlight',`local parent=CreateFrame('Frame') local chip=SQP:CreateLevelChip(parent) assert(chip.kind=='Frame' and chip.background and chip.background.parent==chip,'chip must own a frame background') assert(chip:GetFrameLevel()==parent:GetFrameLevel(),'background must not occlude count text') assert(chip.glow==nil,'frame correction must not add a selection highlight')`],
 ['canonical defaults preserve explicit offsets and inherit General font',`SQPSettings.offsetX=0 SQPSettings.fontSize=17 assert(SQP:GetSettingValue('offsetX')==0) for _,key in ipairs({'kill','loot','percent'})do assert(SQP:GetSettingBaseline(key..'FontSize')==17,'font reset differs from General') end SQPSettings.killIconSize=25 assert(SQP:GetSettingValue('killIconSize')==25 and SQP:GetSettingBaseline('killIconSize')==12)`],
 ['control defaults use canonical baselines',`assert(loadstring(options_widgets))('SQP',SQP) RGXUI=UI UI.CreateSlider=function(_,_,opts)return opts end local s=SQP:CreateStyledSlider(host,{key='killIconSize',default=999}) assert(s.default==12,'slider default drift') local f=SQP:CreateStyledSlider(host,{key='percentFontSize',default=8}) assert(f.default==17,'percent default ignores General font')`],
  ['display style is a two-way dropdown with a text-only tick box',`SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true SQPSettings.killLevelChip=nil SQPSettings.killShowIconBackground=nil RGXUI=UI UI.CreateCheckbox=mockCheckbox RGXDropdowns={CreateNestedDropdown=function(_,parent,opts)
    local dd={parent=parent,opts=opts}
    function dd:SetPoint() end function dd:SetValue(v) self.selected=v end
    function dd:GetValue() return self.selected or (self.opts and self.opts.value) end
    SQP.optionControls[opts.label=='Style' and 'killShowIconBackgroundStyleDropdown' or 'unused']=dd
    return dd
  end} SQP:CreateDisplayStyleSection(host,'kill',nil,-8)
    local dd=SQP.optionControls['killShowIconBackgroundStyleDropdown']
    assert(dd and dd.opts and #dd.opts.items==2,'display style must be a two-item dropdown')
    local texts={} for _,item in ipairs(dd.opts.items)do texts[item.value]=item.text end
    assert(texts.icon and texts.chip and not texts.text,'text must not be a dropdown entry')
    assert(dd.opts.value=='icon','fresh kill page inherits the icon default')
    local box=SQP.optionControls['killShowIconBackgroundTextOnly']
    assert(box,'text-only tick box missing')
    assert(box:GetChecked()==false,'fresh kill page must not start in text mode')
    box:SetChecked(true); box.scripts.OnClick(box)
    assert(SQPSettings.killShowIconBackground==false and SQPSettings.killLevelChip==false,'ticking text-only must clear the chip')
    assert(SQP:GetDisplayStyle('kill')=='text','text-only tick did not take effect')
    assert(box:GetChecked()==true,'tick box lost its checked state')
    box:SetChecked(false); box.scripts.OnClick(box)
    assert(SQPSettings.killShowIconBackground==nil and SQPSettings.killLevelChip==nil,'unticking must return to inheritance')
    assert(SQP:GetDisplayStyle('kill')=='icon','unticking did not restore the inherited style')
    dd.opts.onChange('chip')
    assert(SQPSettings.killLevelChip==true and SQPSettings.killShowIconBackground==true,'chip mode writes the per-type chip override')
    assert(box:GetChecked()==false,'chip selection left text-only ticked')
    box:SetChecked(true); box.scripts.OnClick(box)
    assert(SQPSettings.killShowIconBackground==false and SQPSettings.killLevelChip==false,'ticking text-only must clear the chip')
    dd.opts.onChange('icon')
    assert(SQPSettings.killLevelChip==false and SQPSettings.killShowIconBackground==true,'icon mode restores the icon toggle and clears text')
    assert(box:GetChecked()==false,'icon selection left text-only ticked')
    SQPSettings.killLevelChip=nil SQPSettings.killShowIconBackground=nil`],
 ['individual layout resets restore canonical offsets and displayed values',`
    RGXUI=UI RGXDesign=RGXFramework:GetDesign()
    UI.CreateCard=mockCard UI.CreateColumns=mockColumns UI.CreateSlider=mockSlider
    UI.CreateButton=mockButton UI.CreateCheckbox=mockCheckbox
    local function find(frame,text)
      if frame.text==text then return frame end
      for _,child in ipairs(frame.children)do local found=find(child,text)if found then return found end end
    end
    for _,key in ipairs({'kill','loot','percent'})do
      assert(loadstring(_G['options_'..key]))('SQP',SQP)
      local page=CreateFrame('Frame')
      local title=key:sub(1,1):upper()..key:sub(2)
      SQP['Create'..title..'Options'](SQP,page)
      SQPSettings[key..'IconSize']=35 SQPSettings[key..'IconOffsetX']=60 SQPSettings[key..'IconOffsetY']=-60
      local button=find(page,'Reset '..title..' Settings') assert(button,'reset button missing')
      button.scripts.OnClick()
      for _,suffix in ipairs({'IconSize','IconOffsetX','IconOffsetY'})do
        local setting=key..suffix assert(SQPSettings[setting]==SQP.DEFAULTS[setting],'reset baseline drift '..setting)
        assert(SQP.optionControls[setting].opts.default==SQP.DEFAULTS[setting],'slider reset default drift '..setting)
      end
    end
 `],
  ['style cycles restore preview state for Classic Text and Forever',`
    SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true
    SQPSettings.showPercentIcon=true SQP.ActiveNameplates={} SQP.QuestPlates={}
    NamePlatePreviewMixin=nil NamePlateDriverFrame=nil
    for _,key in ipairs({'kill','loot','percent'})do
      SQPSettings[key..'LevelChip']=nil SQPSettings[key..'ShowIconBackground']=nil
      local p=SQP:CreatePreviewSection(host) SQP.previewFrame=p p.questType=key
      SQP:CreateDisplayStyleSection(host,key,function()p:UpdatePreview()end,-8)
      local dd=SQP.optionControls[key..'ShowIconBackgroundStyleDropdown']
      local box=SQP.optionControls[key..'ShowIconBackgroundTextOnly']
      box:SetChecked(true); box.scripts.OnClick(box)
      assert(not p.icon:IsShown() and not p.questChip:IsShown(),'Text retained frame for '..key)
      box:SetChecked(false); box.scripts.OnClick(box)
      assert(p.icon:IsShown() and not p.questChip:IsShown(),'Classic was not restored for '..key)
      dd.opts.onChange('chip')
      assert(not p.icon:IsShown() and p.questChip:IsShown(),'Forever was not restored for '..key)
      box:SetChecked(true); box.scripts.OnClick(box)
      assert(not p.icon:IsShown() and not p.questChip:IsShown(),'ticked Text over Forever kept the chip for '..key)
      box:SetChecked(false); box.scripts.OnClick(box)
      dd.opts.onChange('icon')
      assert(p.icon:IsShown() and p.iconText:GetText()~='','Classic text/icon missing after cycle for '..key)
    end
    SQP.previewFrame=nil SQPSettings.showPercentIcon=false
  `],
 ['side controls share the Show Icon row on all three pages',`
    for _,key in ipairs({'kill','loot','percent'})do
      local sideKey=key=='percent' and 'percentSignSide' or key..'IconSide'
      local title=key:sub(1,1):upper()..key:sub(2)
      SQP['Create'..title..'Options'](SQP,CreateFrame('Frame'))
      local buttons=SQP.optionControls[sideKey..'Buttons']
      local group=buttons.left:GetParent()
      assert(group:GetParent()==SQP.optionControls['show'..title..'Icon']:GetParent():GetParent(),'side controls are on another card')
      assert(group.point[1]=='TOPRIGHT' and group.anchorCount==1,'inline group retains its old center anchor')
      buttons.left.scripts.OnClick(); assert(SQPSettings[sideKey]=='left')
      buttons.right.scripts.OnClick(); assert(SQPSettings[sideKey]=='right')
    end
 `],
 ['fallback slider does not recurse and accepts both call forms',`RGXUI=nil local store={amount=12} local s=SQP:CreateStyledSlider(host,{key='amount',storage=store,min=0,max=40,step=1,default=0}) s.SetValue(24) assert(store.amount==24) s:SetValue(30) assert(store.amount==30)`],
 ['client preview template anchors through the live path',`
    NamePlatePreviewMixin={} NamePlateDriverFrame={}
    local p=SQP:CreatePreviewSection(host)
    assert(p.plate,'client preview template not adopted')
    assert(p.plate.kind=='Button','preview plate is not the wrapper child button')
    local unit=CreateFrame('Frame') local container=CreateFrame('Frame',nil,unit)
    local bar=CreateFrame('StatusBar',nil,container) container.healthBar=bar
     p.plate.UnitFrame=unit unit.HealthBarsContainer=container unit.healthBar=bar
     unit.ClassificationFrame=CreateFrame('Frame',nil,unit)
     unit.RaidTargetFrame=CreateFrame('Frame',nil,unit)
     unit.AurasFrame=CreateFrame('Frame',nil,unit)
     p:UpdatePreview()
     for _,key in ipairs({'ClassificationFrame','RaidTargetFrame','AurasFrame'})do
       assert(not unit[key]:IsShown(),'preview decoration was not hidden: '..key)
       unit[key]:Show()
       assert(not unit[key]:IsShown(),'Blizzard re-show brought back decoration: '..key)
     end
    local overlay=SQP.QuestPlates[p.plate]
    assert(overlay,'overlay not built through the live factory')
    assert(overlay.isPreview,'preview overlay not flagged')
    assert(overlay.icon.point[2]==container,'preview icon not anchored to the real health container')
     local livePlate=CreateFrame('Frame') livePlate.UnitFrame={HealthBarsContainer=container,healthBar=bar}
     livePlate.UnitFrame.ClassificationFrame=CreateFrame('Frame',nil,livePlate)
     livePlate.UnitFrame.RaidTargetFrame=CreateFrame('Frame',nil,livePlate)
     livePlate.UnitFrame.AurasFrame=CreateFrame('Frame',nil,livePlate)
     SQP:CreateQuestPlate(livePlate)
     assert(livePlate.UnitFrame.ClassificationFrame:IsShown() and livePlate.UnitFrame.RaidTargetFrame:IsShown() and livePlate.UnitFrame.AurasFrame:IsShown(),'live decorations hidden')
    local live=SQP.QuestPlates[livePlate]
    for i=1,5 do assert(overlay.icon.point[i]==live.icon.point[i],'preview/live anchor divergence at '..i) end
    assert(overlay.w==live.w and overlay.h==live.h,'overlay extent differs from live')
    SQPSettings.unifiedNameplates=true
    p:UpdatePreview()
    overlay=SQP.QuestPlates[p.plate]
    assert(overlay and overlay:GetParent()==p.plate.UnitFrame,'unified rebuild did not reparent to the UnitFrame')
    SQPSettings.unifiedNameplates=false
  `],
 ['type buttons hover-preview and click-commit',`
    SQPSettings.unifiedNameplates=false SQP.ActiveNameplates={}
    SQP:CreatePreviewSection(host)
    local buttons={}
    local function collect(frame)
      if not frame.children then return end
      for _,child in ipairs(frame.children)do
        if child.scripts and child.scripts.OnEnter and child.scripts.OnLeave and child.scripts.OnClick
          and (child.text=='Kill' or child.text=='Loot' or child.text=='%') then
          buttons[#buttons+1]=child
        end
        collect(child)
      end
    end
    collect(host)
    -- Earlier scenarios also build preview sections on the shared host, so
    -- one trio accumulates per CreatePreviewSection call; every trio must
    -- carry the hover + click scripts.
    assert(#buttons>=3 and #buttons%3==0,'expected complete kill/loot/percent trios with hover+click scripts, got '..#buttons)
  `],
]){
  try{lua.doStringSync(body);console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}
}
}finally{lua.global.close();}
process.exitCode=failed?1:0;
