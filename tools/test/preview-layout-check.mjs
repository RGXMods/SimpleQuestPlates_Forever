// Stray editor text preserved: with the g5
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
lua.ctx.animationGate=core.slice(core.indexOf('function SQP:IsAnimationEnabled'),core.indexOf('function SQP:GetAnimationIntensity'));
for(const name of ['options_general','options_preview','options_widgets','options_kill','options_loot','options_percent','nameplates','quest','events'])lua.ctx[name]=readFileSync(`${root}/${name}.lua`,'utf8');
lua.ctx.layout=readFileSync(join(framework,'modules/ui/layout.lua'),'utf8');
let failed=0;
const controls=readFileSync(join(framework,'modules/ui/controls.lua'),'utf8');
lua.ctx.switchFactory=controls.slice(controls.indexOf('function UI:CreateSwitch')).split(/--\[\[=+\s+COLUMNS/)[0];
try{
lua.doStringSync(`
  UI={}
  local design={Unpack=function()return 1,1,1,1 end,CreateSectionHeader=function(self,parent,text,icon)local h=CreateFrame('Frame',nil,parent)h:SetSize(300,32)h.title=text return h end}
  RGXDesign=design
  RGXFramework={GetDesign=function()return design end,API={CanAccessValue=function(v)return true end}}
  local methods={}
  local noop=function()end
  local function widget(parent)
    local w={parent=parent,children={},scripts={},w=300,h=20,shown=true,scale=1}
    setmetatable(w,{__index=function(_,k)if methods[k]then return methods[k]end if k:match('^Set')or k:match('^Enable')or k=='Play'or k=='Stop'then return noop end end})
    if parent then table.insert(parent.children,w)end
    return w
  end
  function methods:SetSize(w,h)self.w=w self.h=h end
  function methods:RegisterForClicks()end
  function methods:Play()self.playing=true end
  function methods:Stop()self.playing=false end
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
     self.pointsList=self.pointsList or{} self.pointsList[#self.pointsList+1]=self.point
     self.anchorCount=(self.anchorCount or 0)+1
    self.y=y
    if relativePoint=='BOTTOMLEFT'or relativePoint=='BOTTOMRIGHT'then
      self.y=-relative:GetHeight()+y
      if point=='BOTTOMLEFT'or point=='BOTTOMRIGHT'then self.y=self.y+self.h end
    end
  end
  function methods:GetPoint()return unpack(self.point or {})end
    function methods:ClearAllPoints()self.point=nil self.anchorCount=0 self.pointsList={} end
   function methods:SetAllPoints(relative)self.all=relative or self.parent self.w=self.all.w self.h=self.all.h self.y=0 self.pointsList=self.pointsList or{} self.pointsList[#self.pointsList+1]={point='ALL',relative=self.all} end
  function methods:SetScript(k,fn)self.scripts[k]=fn end
   function methods:HookScript(k,fn)
     local previous=self.scripts[k]
     self.scripts[k]=function(self,...)if previous then previous(self,...)end fn(self,...)end
   end
  function methods:SetText(t)self.text=t end
  function methods:GetText()return self.text end
  function methods:IsShown()return self.shown end
  function methods:IsVisible()return self.shown and (not self.parent or self.parent:IsVisible())end
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
  function methods:CreateTexture(_,layer,_,sublevel)local t=widget(self)t.textureLayer=layer t.textureSublevel=sublevel return t end
  function methods:CreateFontString()return widget(self)end
  function methods:CreateAnimationGroup()return widget(self)end
  function methods:CreateAnimation()return widget(self)end
   function methods:IsPlaying()return self.playing==true end
  function methods:GetParent()return self.parent end
  function methods:SetParent(parent)
    if self.parent then
      for i,child in ipairs(self.parent.children)do if child==self then table.remove(self.parent.children,i)break end end
    end
    self.parent=parent
    if parent then parent.children[#parent.children+1]=self end
  end
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
  -- Widget factories guard on _G.RGXUI; pages/tests sequence captures need
  -- the same baseline as the real client (framework loads before consumers).
  RGXUI=UI
  function UI:CreateLabel(parent,opts)local label=widget(parent)label:SetText(opts.text)return label end
  function UI:CreateButton(parent,text,width,height)local b=widget(parent)b:SetSize(width,height)b:SetText(text)return b end
  assert(loadstring('local UI,RGX=...; local ApplyDefaultFont=function()end; '..switchFactory))(UI,RGXFramework)
  RGXFonts={Apply=function()end,GetDefault=function()return 'font' end,
    ResolveName=function(self,name,default)return name or default end,
    GetPath=function()return 'Fonts\\FRIZQT__.TTF' end,
    CreateFontSettingControl=function(self,parent,opts)return CreateFrame('Frame',nil,parent)end}
  SQP={L={},optionControls={},DEFAULTS={scale=1.1,fontSize=12,anchor='RIGHT',relativeTo='LEFT',offsetX=0,offsetY=0,killIconSide='left',lootIconSide='right',killIconSize=12,lootIconSize=14,percentIconSize=12,killIconOffsetX=2,killIconOffsetY=15,lootIconOffsetX=-38,lootIconOffsetY=16,percentIconOffsetX=18,percentIconOffsetY=0},RefreshAllNameplates=noop,UpdateQuestFont=noop,GetOutlineInfo=function()return 0 end,IsAnimationEnabled=function()return false end,ApplyPulseDuration=noop,GetAnimationDuration=function()return 1 end}
  SQPSettings={scale=1.1,showQuestMarker=true,unifiedNameplates=false}
  assert(loadstring(defaults))()
  assert(loadstring(baselines))()
  -- Load the widget module first so the harness stubs (so the) stand:
  -- mocks defined after override module-level factories deterministically.
  assert(loadstring(options_widgets))('SQP',SQP)
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
   function SQP:CreateStyledButton(parent,text,w,h)
     local b=widget(parent)b:SetSize(w,h)b:SetText(text)
     b:SetScript('OnEnter',function()b.skinHovered=true end)
     b:SetScript('OnLeave',function()b.skinHovered=false end)
     return b
   end
  function SQP:CreateStyledSlider(parent,opts)
     local s=widget(parent)s.h=38 s.opts=opts s.valueLabel=widget(s) s.resetButton=widget(s)
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
 ['task-icon reset baselines match saved Classic values and tuned right offsets',`
    SQPSettings.anchor='LEFT'
    assert(SQP:GetSettingBaseline('killIconOffsetX')==-3)
    assert(SQP:GetSettingBaseline('lootIconOffsetX')==-44)
    assert(SQP:GetSettingBaseline('killIconOffsetY')==16 and SQP:GetSettingBaseline('lootIconOffsetY')==16)
    SQPSettings.anchor='RIGHT'
    SQPSettings.killLevelChip=false
    assert(SQP:GetSettingBaseline('killIconOffsetX')==1 and SQP:GetSettingBaseline('lootIconOffsetX')==3)
    SQPSettings.killLevelChip=true assert(SQP:GetSettingBaseline('killIconOffsetX')==0)
    SQPSettings.killLevelChip=nil
 `],
 ['Animation master restores the previous Toast state without reverse dependency',`
    SQPSettings.animationsEnabled=true SQPSettings.showQuestMarker=true
    local master=SQP:CreateHeaderSwitch(CreateFrame('Frame'),'animationsEnabled')
    local toast=SQP:CreateHeaderSwitch(CreateFrame('Frame'),'showQuestMarker')
    master.scripts.OnClick(master)
    assert(SQPSettings.animationsEnabled==false and SQPSettings.showQuestMarker==false)
    master.scripts.OnClick(master)
    assert(SQPSettings.animationsEnabled==true and SQPSettings.showQuestMarker==true,'master did not restore previous Toast ON')
    master.scripts.OnClick(master)
    local resumed=SQP:CreateHeaderSwitch(CreateFrame('Frame'),'animationsEnabled')
    resumed.scripts.OnClick(resumed)
    assert(SQPSettings.showQuestMarker==true and SQPSettings.toastBeforeAnimationDisable==nil,'rebuilt switch lost Toast restoration state')
    toast.scripts.OnClick(toast)
    assert(SQPSettings.animationsEnabled==true,'toast OFF disabled master')
    master.scripts.OnClick(master) master.scripts.OnClick(master)
    assert(SQPSettings.showQuestMarker==false,'previous Toast OFF was not preserved')
    assert(SQP.DEFAULTS.percentAnimationsEnabled==false)
    SQPSettings.showQuestMarker=true
 `],
 ['card switches center on the inset header band rather than the outer frame',`
    local card=CreateFrame('Frame') card:SetHeight(240)
    card.headerBand=CreateFrame('Frame',nil,card) card.headerBand:SetHeight(32)
    card.headerBand:SetPoint('TOPRIGHT',card,'TOPRIGHT',-10,-8)
    local switch=SQP:CreateHeaderSwitch(card,'killAnimationsEnabled')
    assert(switch.point[1]=='RIGHT' and switch.point[2]==card.headerBand and switch.point[3]=='RIGHT')
    assert(switch.point[4]==-8 and switch.point[5]==0,'switch is not centered in header')
    local saved=SQPSettings.showPercentIcon SQPSettings.showPercentIcon=nil
    local percent=SQP:CreateHeaderSwitch(card,'showPercentIcon')
    assert(percent.checkbox:GetChecked()==false,'Percent header switch changed its off default')
    SQPSettings.showPercentIcon=saved
 `],
 ['type navigation updates header titles and restores independent module switches',`
    local original=RGXDesign.CreateSectionHeader
    local header
    RGXDesign.CreateSectionHeader=function(self,parent,text)
        header=CreateFrame('Frame',nil,parent) header:SetHeight(32)
        header.label=header:CreateFontString() header.label:SetText(text) return header
    end
    SQP:CreateGlobalOptions(CreateFrame('Frame'))
    local sides=SQP.optionControls.anchorButtons
    local group=sides.left:GetParent()
    assert(sides.left:GetText()=='Left Side' and sides.right:GetText()=='Right Side','Global side labels incorrect')
    assert(group:GetParent():GetParent().content and group.point[1]=='TOP' and group.point[4]==0,'Global sides not centered in body')
    local task=SQP.optionControls.showQuestTypeIcons:GetParent()
    local text=SQP.optionControls.showIconBackgroundTextOnly:GetParent()
    local row=task:GetParent():GetParent()
    assert(row==text:GetParent():GetParent() and row:GetParent()==group:GetParent(),'Global display toggles separated')
    assert(task:GetParent()~=text:GetParent(),'Global display toggles must use separate columns')
    assert(row.point[5]>group.point[5],'Global toggles must be above side row')
    assert(SQP.optionControls.scale.point[5]<group.point[5],'Scale must follow side row')
    SQPSettings.anchor='RIGHT' SQPSettings.offsetX=0
    sides.right.scripts.OnClick()
    assert(SQPSettings.offsetX==23 and SQP:GetSettingBaseline('offsetX')==23,'Right X baseline must be +23')
    SQPSettings.offsetX=41 SQP.optionControls.offsetX.resetButton.scripts.OnClick()
    assert(SQPSettings.offsetX==23,'Right reset did not restore +23')
    sides.left.scripts.OnClick() assert(SQPSettings.offsetX==0,'Left baseline not restored')
    SQPSettings.offsetX=7 sides.right.scripts.OnClick()
    assert(SQPSettings.offsetX==7,'switching sides overwrote custom X')
    SQPSettings.offsetX=23 sides.left.scripts.OnClick()
    local pager=SQP.optionControls.generalPager
    for i,title in ipairs({'Global','Kill','Loot','Percent'})do
        pager:SetPage(i) assert(header.label:GetText()==title,'stale page title')
        local shown=0
        for _,child in ipairs(header.children)do if child.switchFrame and child:IsShown()then shown=shown+1 end end
        assert(shown==(i==1 and 0 or 1),'wrong module switch visibility')
    end
    SQP.optionControls.killEnabled:SetChecked(false)
    assert(SQPSettings.killEnabled==false and SQPSettings.lootEnabled~=false)
    SQP.optionControls.killEnabled:SetChecked(true)
    RGXDesign.CreateSectionHeader=original
 `],
 ['animation gates preserve options and stop visible Text Mode pulses',`
    local previous=SQP.IsAnimationEnabled
    SQP.IsAnimationCombatAllowed=function()return true end
    assert(loadstring(animationGate))()
    SQPSettings.useGlobalAnimationSettings=false SQPSettings.animateMainIcons=true
    SQPSettings.showIconBackground=false
    local q={iconText=CreateFrame('Frame'),iconTextOutline=CreateFrame('Frame')}
    SQP:UpdateTextPulses(q,'kill',true)
    assert(q.iconTextPulse:IsPlaying() and q.iconTextOutlinePulse:IsPlaying())
    SQPSettings.killAnimationsEnabled=false
    SQP:UpdateTextPulses(q,'kill',true)
    assert(not q.iconTextPulse:IsPlaying() and not SQP:IsAnimationEnabled('kill',true))
    assert(SQPSettings.animateMainIcons==true,'gate erased saved option')
    SQPSettings.killAnimationsEnabled=true SQPSettings.animationsEnabled=false
    assert(not SQP:IsAnimationEnabled('loot',false))
    SQPSettings.animationsEnabled=true SQPSettings.animateMainIcons=false SQPSettings.showIconBackground=true
    SQP.IsAnimationEnabled=previous
 `],
 ['Text Mode adds minus-three baseline without changing saved offset and right side moves badges',`
    local q=CreateFrame('Frame') q.icon=CreateFrame('Frame') q.killIcon=CreateFrame('Frame') q.lootIcon=CreateFrame('Frame')
    SQPSettings.offsetX=7 SQPSettings.showIconBackground=false SQPSettings.anchor='LEFT'
    SQP:ApplyQuestLayout(q,host)
    assert(q.icon.point[4]==4 and SQPSettings.offsetX==7)
    assert(q.killIcon.point[1]=='TOPLEFT' and q.killIcon.point[3]=='BOTTOMRIGHT')
    SQPSettings.showIconBackground=true SQP:ApplyQuestLayout(q,host)
    assert(q.icon.point[4]==7)
    SQPSettings.offsetX=0 SQPSettings.anchor='RIGHT'
 `],
 ['Forever retains its chip while Text Mode renders ratios',`
    NamePlatePreviewMixin=nil NamePlateDriverFrame=nil
    SQPSettings.killLevelChip=true SQPSettings.killShowIconBackground=false
    local p=SQP:CreatePreviewSection(host) p.questType='kill' p:UpdatePreview()
     assert(p.questChip:IsShown() and p.iconText:GetText()=='5/8','Forever + Text must retain chip and ratio, got '..tostring(p.iconText:GetText()))
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
  ['quest toast starts behind the quest display',`
    local plate=CreateFrame('Frame') SQP.ActiveNameplates={} SQP.QuestPlates={}
    SQP:CreateQuestPlate(plate)
    local qf=SQP.QuestPlates[plate]
    assert(qf and qf.qmark,'toast texture missing')
    -- CreateTexture currently receives (name, layer, inherit, sublevel); the
    -- harness records the last call as textureLayer.
    assert(qf.qmark.textureLayer=='BACKGROUND','toast texture must render BACKGROUND behind icon and text, got '..tostring(qf.qmark.textureLayer))
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
     SQPSettings.killEnabled=false SQP:UpdateQuestIcon(plate,'nameplate1')
     assert(not overlay:IsShown(),'disabled Kill module remained visible')
     SQPSettings.killEnabled=true SQP:UpdateQuestIcon(plate,'nameplate1')
     assert(overlay:IsShown(),'reenabling Kill failed to restore overlay')
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
  ['control defaults use canonical baselines',`assert(loadstring(options_widgets))('SQP',SQP) RGXUI=UI UI.CreateSlider=function(_,_,opts)return opts end local s=SQP:CreateStyledSlider(host,{key='killIconSize',default=999}) assert(s.default==12,'slider default drift') local f=SQP:CreateStyledSlider(host,{key='percentFontSize',default=8}) assert(f.default==17,'percent default ignores General font') assert(SQP.DEFAULTS.percentIconSize==12,'percent sign default does not match the kill slider')`],
  ['display style is a two-way dropdown with a text-only tick box',`SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true SQPSettings.killLevelChip=nil SQPSettings.killShowIconBackground=nil RGXUI=UI UI.CreateCheckbox=mockCheckbox RGXDropdowns={CreateNestedDropdown=function(_,parent,opts)
    local dd={parent=parent,opts=opts}
    function dd:SetPoint(point,relative,relativePoint,x,y)
      if type(relative)=='number'then self.point={point,self.parent,point,relative,relativePoint}
      else self.point={point,relative,relativePoint,x,y}end
    end
    function dd:SetValue(v) self.selected=v end
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
     assert(SQPSettings.killShowIconBackground==false and SQPSettings.killLevelChip==nil,'text toggle must preserve background inheritance')
    assert(SQP:GetDisplayStyle('kill')=='text','text-only tick did not take effect')
    assert(box:GetChecked()==true,'tick box lost its checked state')
    box:SetChecked(false); box.scripts.OnClick(box)
    assert(SQPSettings.killShowIconBackground==nil and SQPSettings.killLevelChip==nil,'unticking must return to inheritance')
    assert(SQP:GetDisplayStyle('kill')=='icon','unticking did not restore the inherited style')
    dd.opts.onChange('chip')
     assert(SQPSettings.killLevelChip==true and SQPSettings.killShowIconBackground==nil,'background selection must preserve text-format inheritance')
    assert(box:GetChecked()==false,'chip selection left text-only ticked')
    box:SetChecked(true); box.scripts.OnClick(box)
     assert(SQPSettings.killShowIconBackground==false and SQPSettings.killLevelChip==true,'Text Mode must retain selected Forever frame')
    dd.opts.onChange('icon')
     assert(SQPSettings.killLevelChip==false and SQPSettings.killShowIconBackground==false,'background selection must not clear Text Mode')
     assert(box:GetChecked()==true,'background selection cleared Text Mode')
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
  ['right-side task reset buttons restore tuned offsets then left restores zero',`
    local function find(frame,text)
      if frame.text==text then return frame end
      for _,child in ipairs(frame.children)do local found=find(child,text)if found then return found end end
    end
    for _,key in ipairs({'kill','loot'})do
      local title=key:sub(1,1):upper()..key:sub(2)
      SQPSettings.anchor='LEFT'
      local page=CreateFrame('Frame') SQP['Create'..title..'Options'](SQP,page)
      local slider=SQP.optionControls[key..'IconOffsetX']
      SQPSettings[key..'IconOffsetX']=61
      slider.resetButton.scripts.OnClick()
      assert(SQPSettings[key..'IconOffsetX']==(key=='kill' and -3 or -44))
      find(page,'Reset '..title..' Settings').scripts.OnClick()
      assert(SQPSettings[key..'IconOffsetX']==(key=='kill' and -3 or -44))
      SQPSettings.anchor='RIGHT'
      slider.resetButton.scripts.OnClick()
      assert(SQPSettings[key..'IconOffsetX']==(key=='kill' and 1 or 3),'left Classic reset incorrect')
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
       assert(not p.icon:IsShown() and p.questChip:IsShown(),'Forever + Text lost the chip for '..key)
      box:SetChecked(false); box.scripts.OnClick(box)
      dd.opts.onChange('icon')
      assert(p.icon:IsShown() and p.iconText:GetText()~='','Classic text/icon missing after cycle for '..key)
    end
    SQP.previewFrame=nil SQPSettings.showPercentIcon=false
  `],
  ['global display presets apply background, chip, and text modes',`
    SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true
    SQPSettings.killLevelChip=true SQPSettings.killShowIconBackground=false
    SQP.ActiveNameplates={} SQP.QuestPlates={} SQP.previewFrame=nil
    SQP:ApplyGlobalDisplayStyle('chip')
    assert(SQPSettings.unifiedNameplates==true and SQPSettings.showIconBackground==true,
      'chip preset missed the global background keys')
    assert(SQPSettings.killLevelChip==nil and SQPSettings.killShowIconBackground==nil,
      'chip preset left stale per-type overrides')
    SQP:ApplyGlobalDisplayStyle('text')
    assert(SQPSettings.unifiedNameplates==false and SQPSettings.showIconBackground==false,
      'text preset missed the global background keys')
    assert(SQP:GetDisplayStyle('kill')=='text','text preset did not take effect')
    SQP:ApplyGlobalDisplayStyle('icon')
    assert(SQPSettings.unifiedNameplates==false and SQPSettings.showIconBackground==true,
      'icon preset missed the global background keys')
    assert(SQP:GetDisplayStyle('kill')=='icon','icon preset did not take effect')
    SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true
  `],
  ['global quest-icon master drives per-type switches',`
    SQPSettings.showKillIcon=true SQPSettings.showLootIcon=false SQPSettings.showPercentIcon=true
    local active={kill=nil,loot=nil,percent=nil}
    SQP.ActiveNameplates={} SQP.QuestPlates={} SQP.previewFrame=nil
    SQP:CreateGlobalOptions(CreateFrame('Frame'))
    local master=SQP.optionControls.showQuestTypeIcons
    assert(master,'master toggle missing')
    master:SetChecked(false); master.scripts.OnClick(master)
    assert(SQPSettings.showKillIcon==false and SQPSettings.showLootIcon==false and SQPSettings.showPercentIcon==false,'master-off did not clear all three')
    assert(master:GetChecked()==false)
    master:SetChecked(true); master.scripts.OnClick(master)
    assert(SQPSettings.showKillIcon==true and SQPSettings.showLootIcon==true and SQPSettings.showPercentIcon==true,'master-on did not restore all three')
  `],
  ['type Task Icon cards keep side buttons in the body below header switches',`
    for _,key in ipairs({'kill','loot','percent'})do
      local sideKey=key=='percent' and 'percentSignSide' or key..'IconSide'
      local title=key:sub(1,1):upper()..key:sub(2)
      SQP['Create'..title..'Options'](SQP,CreateFrame('Frame'))
      local buttons=SQP.optionControls[sideKey..'Buttons']
      local group=buttons.left:GetParent()
      local card=group:GetParent():GetParent()
      local switch
      local iconKey='show'..title..'Icon'
      for _,child in ipairs(card.children)do if child.checkbox==SQP.optionControls[iconKey] then switch=child end end
      assert(switch and switch.point[1]=='RIGHT' and switch.point[4]==-8,'icon switch not at far-right header')
      assert(group:GetParent()==card.content and group.point[1]=='TOP' and group.point[4]==0,'side controls must stay centered in the body')
      local tint=SQP.optionControls[key..'TintIconColorSwatch']:GetParent()
      assert(tint.point[5]>group.point[5],'task tint selector must be above side buttons')
      local size=SQP.optionControls[key..'IconSize']
      assert(size.point[5]<=group.point[5]-group:GetHeight(),'side buttons overlap Size slider')
      SQPSettings[iconKey]=true switch.scripts.OnClick(switch)
      assert(SQPSettings[iconKey]==false,'header switch did not save')
      switch.scripts.OnClick(switch)
      assert(group.anchorCount==1,'side group retains competing anchor')
      assert(buttons.left:GetWidth()==68 and buttons.right:GetWidth()==68,'header buttons must fit Side labels')
      buttons.left.scripts.OnClick(); assert(SQPSettings[sideKey]=='left')
      buttons.right.scripts.OnClick(); assert(SQPSettings[sideKey]=='right')
    end
 `],
   ['type pages separate main display controls from task icon controls',`
    local savedCreateCard=SQP.CreateCard
    for _,key in ipairs({'kill','loot','percent'})do
      local title=key:sub(1,1):upper()..key:sub(2)
      local seen={}
      local oldColumns=SQP.CreateOptionColumns
      local left,right
      SQP.CreateOptionColumns=function(self,parent)
        left,right=oldColumns(self,parent) return left,right
      end
      -- Builders call SQP:CreateCard with colon syntax (self first); record
      -- each card shell with its title and host column for layout asserts.
      SQP.CreateCard=function(self,parent,cardTitle,opts)
        local card=CreateFrame('Frame',nil,parent)
        card.mockTitle=cardTitle
        card.above=opts and opts.above
        card.content=CreateFrame('Frame',nil,card)
        function card:FitContent() end
        seen[#seen+1]=card
        return card
      end
      SQP['Create'..title..'Options'](SQP,CreateFrame('Frame'))
      SQP.CreateCard=savedCreateCard
      SQP.CreateOptionColumns=oldColumns
      local byTitle={} for _,c in ipairs(seen)do byTitle[c.mockTitle]=c end
      local main=byTitle[title..' Main Icon'] local task=byTitle[title..' Task Icon']
      assert(main and task and byTitle[title..' Animation'],'type page cards missing for '..key)
      assert(byTitle[title..' Animation']:GetParent()==left and main:GetParent()==left,'main/animation not in left column')
      assert(not main.above and byTitle[title..' Animation'].above==main,'Main Icon must lead Animation')
      assert(task:GetParent()==right,'task not in right column')
      assert(SQP.optionControls[key..'ShowIconBackgroundTextOnly']:GetParent():GetParent()==main.content,'Text Mode not in Main Icon')
      assert(SQP.optionControls[key..'ShowIconBackgroundTextOnly']:GetParent().point[5]==-8,'Text Mode must be body row one')
      local background=SQP.optionControls[key..'ShowIconBackgroundStyleDropdown']
      local color=SQP.optionControls[key..'ColorSwatch']:GetParent()
      assert(background.point[5]<color.point[5],'Background Style must be below Count Color')
      assert(SQP.optionControls[key..'IconSize']:GetParent()==task.content,'task size not in Task Icon')
      assert(SQP.optionControls[key..'TintIcon']:GetParent():GetParent()==task.content,'task tint not in Task Icon')
      if key=='percent' then
        local previous=SQPSettings.showPercentIcon
        SQPSettings.showPercentIcon=false
        local text=SQP.optionControls.percentShowIconBackgroundTextOnly
        text:SetChecked(true); text.scripts.OnClick(text)
        assert(SQPSettings.showPercentIcon==true and SQP.optionControls.showPercentIcon:GetChecked(),'Percent Text Mode did not enable its task icon')
        SQPSettings.showPercentIcon=previous
      end
    end
  `],
  ['global intensity cascade never flips the preview mode',`
    SQPSettings.animateQuestIcons=true SQP.ActiveNameplates={} SQP.QuestPlates={}
    local activates={kill=0,loot=0,percent=0} local renders=0
    SQP.previewFrame={questType='kill',
      activateKillMode=function()activates.kill=activates.kill+1 pcall(function()SQP.previewFrame.questType='kill'end)end,
      activateLootMode=function()activates.loot=activates.loot+1 SQP.previewFrame.questType='loot' end,
      activatePercentMode=function()activates.percent=activates.percent+1 SQP.previewFrame.questType='percent' end,
      UpdatePreview=function()renders=renders+1 end}
    SQP:CreateAnimationOptions(CreateFrame('Frame'))
    local g=SQP.optionControls.globalAnimationIntensity
    local k=SQP.optionControls.killAnimationIntensity
    local p=SQP.optionControls.percentAnimationIntensity
    g.opts.onChange(150)
    assert(SQP.previewFrame.questType=='kill','cascade flipped the preview to '..tostring(SQP.previewFrame.questType))
    assert(activates.kill==0 and activates.loot==0 and activates.percent==0,'cascade activated a type preview')
    assert(SQPSettings.killAnimationIntensity==150 and SQPSettings.lootAnimationIntensity==150 and SQPSettings.percentAnimationIntensity==150,'global cascade did not write child settings')
    assert(renders>=2,'global cascade must re-render current preview via refresh + manual update, got '..renders)
    assert(SQP._cascadingGlobalIntensity==false,'cascade flag left set')
    local rendersBefore=renders
    p.opts.onChange(175)
    assert(activates.percent==1 and SQP.previewFrame.questType=='percent','direct percent slider edit did not activate its preview')
    assert(renders>rendersBefore,'percent activate did not render its preview')
    assert(SQP._cascadingGlobalIntensity==false)
    SQP.previewFrame=nil
  `],
  ['page content lives below the header inset',`
    local gpage=CreateFrame('Frame')
    SQP:CreateGlobalOptions(gpage)
    local header,inset
    for _,child in ipairs(gpage.children or {})do
      if child.title=='Global' then header=child
      elseif type(child.pointsList)=='table' then
        for _,p in ipairs(child.pointsList)do
          if p[1]=='TOPLEFT' and p[3]=='TOPLEFT' and p[5]==-40 then inset=child break end
        end
      end
    end
    assert(header,'Global header missing')
    assert(inset,'Global page inset missing below header')
    local pagesInside=0
    for _,child in ipairs(inset.children or {})do if child:GetParent()==inset then pagesInside=pagesInside+1 end end
    assert(pagesInside>=1,'subpages did not parent to the inset')
  `],
  ['page header helper builds the framework section header',`
    local PageHeader=assert(SQP.CreatePageHeader,'helper missing')
    local made={}
    local realDesign=RGXDesign
    local calls={}
    RGXDesign={CreateSectionHeader=function(self,parent,text,icon)local h=CreateFrame('Frame',nil,parent)h.title=text calls[#calls+1]={text=text,icon=icon}return h end,Unpack=function()return 1,1,1 end}
    local h=SQP:CreatePageHeader(CreateFrame('Frame'),'Test Page',nil)
    RGXDesign=realDesign
    assert(h.title=='Test Page' and #calls==1,'helper did not build via design section header')
    assert(calls[1].icon==SQP.ICON_TEXTURE or calls[1].icon==nil,'helper dropped icon default')
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
 ['type-button hover persists after mouse leaves and click navigates',`
     SQPSettings.unifiedNameplates=false SQP.ActiveNameplates={}
     NamePlatePreviewMixin=nil NamePlateDriverFrame=nil
     local createButton=SQP.CreateStyledButton
     SQP.CreateStyledButton=function(self,...)
       local b=createButton(self,...)
       b:SetScript('OnEnter',function()b.skinHovered=true end)
       b:SetScript('OnLeave',function()b.skinHovered=false end)
       return b
     end
     local p=SQP:CreatePreviewSection(CreateFrame('Frame'))
     SQP.CreateStyledButton=createButton
     local buttons={}
     for _,child in ipairs(p.children)do
       if child.text=='Kill' or child.text=='Loot' or child.text=='%' then buttons[child.text]=child end
     end
     local page,selectedTab
     SQP.optionsPanel={SelectTabByName=function(_,name)selectedTab=name end,ClearTabHighlight=function()end}
     SQP.optionControls.generalPager={SetPage=function(_,n)page=n end}
     p.activateKillMode()
     for _,test in ipairs({{'Loot','loot',3},{'%','percent',4},{'Kill','kill',2}})do
       local button=assert(buttons[test[1]])
       button.scripts.OnEnter(button)
       assert(p.questType==test[2] and button.skinHovered,'hover must show type and preserve skin')
       button.scripts.OnLeave(button)
       assert(p.questType==test[2],'mouse leave reverted '..test[2]..' preview to '..tostring(p.questType))
       assert(not button.skinHovered,'leaving must still restore button skin')
       button.scripts.OnClick(button)
       assert(page==test[3] and selectedTab=='Global','click failed to navigate to type settings')
     end
      local pageHost=CreateFrame('Frame')
      local pager={page=2,frames={}}
      for i=2,4 do pager.frames[i]=CreateFrame('Frame',nil,pageHost) end
      SQP.optionControls.generalPager=pager
      for _,test in ipairs({{2,'kill',p.activateKillMode},{3,'loot',p.activateLootMode},{4,'percent',p.activatePercentMode}})do
        pager.page=test[1] test[3]()
        for _,button in pairs(buttons)do
          button.scripts.OnEnter(button)
          assert(p.questType==test[2],'hover changed pinned settings-page preview')
          assert(button.skinHovered,'pinned preview removed button hover skin')
          button.scripts.OnLeave(button)
        end
      end
      pageHost:Hide() buttons.Loot.scripts.OnEnter(buttons.Loot)
      assert(p.questType=='loot','hidden type page blocked Animation hover')
      pageHost:Show() pager.page=1 buttons.Kill.scripts.OnEnter(buttons.Kill)
      assert(p.questType=='kill','Global hover was blocked')
      SQP.optionsPanel=nil SQP.optionControls.generalPager=nil
  `],
  ['Global background and Text Mode controls combine in either order',`
    RGXUI=UI
    SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true
    for _,key in ipairs({'kill','loot','percent'})do
      SQPSettings[key..'LevelChip']=nil SQPSettings[key..'ShowIconBackground']=nil
    end
    SQP.ActiveNameplates={} SQP.QuestPlates={}
    local p=SQP:CreatePreviewSection(CreateFrame('Frame')) SQP.previewFrame=p p.questType='kill'
    SQP:CreateGlobalOptions(CreateFrame('Frame'))
    local dd=SQP.optionControls.unifiedDropdown
    local box=SQP.optionControls.showIconBackgroundTextOnly
    dd.opts.onChange('chip')
    box:SetChecked(true);box.scripts.OnClick(box)
    assert(SQPSettings.unifiedNameplates==true and p.questChip:IsShown()
      and p.iconText:GetText()=='5/8','Text checkbox cleared Forever or failed to format ratio')
    dd.opts.onChange('icon')
    assert(box:GetChecked() and not p.questChip:IsShown() and p.iconText:GetText()=='5/8',
      'Classic background selection cleared text format')
    dd.opts.onChange('chip')
    assert(box:GetChecked() and p.questChip:IsShown() and p.iconText:GetText()=='5/8',
      'Forever selection cleared text format')
    box:SetChecked(false);box.scripts.OnClick(box)
    assert(SQPSettings.unifiedNameplates==true and p.questChip:IsShown() and p.iconText:GetText()=='5',
      'Text off changed Forever background')
    SQP.previewFrame=nil SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true
  `],
 ['toast switch lives in the card header and preview remains in the body',`
     RGXUI=UI
     SQP:CreateAnimationOptions(CreateFrame('Frame'))
      local preview=SQP.optionControls.toastPreviewButton
      local card=preview:GetParent():GetParent()
      local toggle
      for _,child in ipairs(card.children)do if child.switchFrame then toggle=child end end
      assert(toggle and toggle:GetParent()==card,'toast switch must belong to card header')
      assert(toggle.point[1]=='RIGHT' and toggle.point[5]==0,'header switch misplaced')
      assert(preview:GetParent()==card.content and preview.point[5]<=-8,'preview must remain below the header')
      local size=SQP.optionControls.questMarkerSize
      assert(preview.point[5]<=size.point[5]-size:GetHeight(),'Preview Toast must sit below Toast Size')
      SQPSettings.showQuestMarker=true toggle.scripts.OnClick(toggle)
      assert(SQPSettings.showQuestMarker==false,'header switch did not disable toast')
      toggle.scripts.OnClick(toggle) assert(SQPSettings.showQuestMarker==true)
 `],
 ['live overlays combine Forever frame and Text Mode for kill loot and percent',`
     local getProgress=SQP.GetQuestProgress
     local marker=GetRaidTargetIndex
     GetRaidTargetIndex=function()return nil end
     SQPSettings.enabled=true SQPSettings.hideInCombat=false SQPSettings.hideInInstance=false
     SQPSettings.unifiedNameplates=true SQPSettings.showIconBackground=false SQPSettings.showPercentIcon=true
     for _,key in ipairs({'kill','loot','percent'})do
       SQPSettings[key..'LevelChip']=nil SQPSettings[key..'ShowIconBackground']=nil
     end
     for _,test in ipairs({{'kill','Target slain: 5/8',1,3,0,'5/8'},
         {'loot','Item collected: 2/5',1,0,3,'2/5'},{'percent','Progress: 75%',3,75,0,'75'}})do
       SQP.GetQuestProgress=function()return test[2],test[3],test[4],test[5]end
       local plate=CreateFrame('Frame') SQP:CreateQuestPlate(plate)
       SQP:UpdateQuestIcon(plate,'nameplate1')
       local q=SQP.QuestPlates[plate]
       assert(q.levelChip:IsShown() and tostring(q.iconText:GetText())==test[6],
         'live Forever+Text lost frame or text for '..test[1])
     end
     SQP.GetQuestProgress=getProgress GetRaidTargetIndex=marker
     SQPSettings.unifiedNameplates=false SQPSettings.showIconBackground=true SQPSettings.showPercentIcon=false
 `],
 ['slider purpose stays visible while values are hover-only',`
     assert(loadstring(options_widgets))('SQP',SQP)
     local received
     RGXUI={CreateSlider=function(_,parent,opts)received=opts return CreateFrame('Frame',nil,parent)end}
     SQP:CreateStyledSlider(host,{key='scale',label='Scale',storage=SQPSettings})
     assert(received.label=='Scale' and received.noLabel==false and received.valueDisplay=='hover',
       'slider purpose must remain visible and only its numeric value hover-only')
 `],
]){
  try{lua.doStringSync(body);console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}
}
}finally{lua.global.close();}
process.exitCode=failed?1:0;
