import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const framework=resolve(process.argv[2] || join(root,'../RGX-Framework'));
const {Lua}=createRequire(join(framework,'tools/ci/package.json'))('wasmoon-lua5.1');
const core=readFileSync(join(root,'data/core.lua'),'utf8');
const lua=await Lua.create();
const profileName=process.argv[4] || 'Default';
lua.ctx.profileName=profileName;
const profileWire=process.argv[3] ? readFileSync(process.argv[3],'utf8') : '';
lua.ctx.profileWire=profileWire;
lua.ctx.database=readFileSync(join(framework,'core/systems/database.lua'),'utf8');
lua.ctx.defaults=core.slice(core.indexOf('SQP.DEFAULTS = {'),core.indexOf('SQP.defaultMinimapAngle'));
lua.ctx.setup=core.slice(core.indexOf('SQP.db = RGX:NewDatabase'),core.indexOf('-- Animation setting helpers'));
lua.ctx.reset=core.slice(core.indexOf('function SQP:ResetSettings'),core.indexOf('-- Enable addon'));
try {
  lua.doStringSync(`
    RGX={_databases={}}; function RGX:Print()end; function RGX:Debug()end; function RGX:Error(msg)error(msg)end
    UnitName=function()return 'ResetTester'end; GetRealmName=function()return 'TestRealm'end
    assert(loadstring(database))('RGX-Framework',RGX)
    SQP={L={},QuestPlates={}}; function SQP:PrintMessage()end; function SQP:RefreshAllNameplates()end
    assert(loadstring(defaults))()
    local operatorDefault
    if profileWire~=''then
      assert(loadstring(profileWire))()
      operatorDefault=assert(SQPForeverSettings.profiles[profileName],'Requested baseline profile is absent')
      SQPForeverSettings=nil
    end
    assert(loadstring(setup))()
    assert(loadstring(reset))()
    local function same(a,b)
      if type(a)~=type(b)then return false end
      if type(a)~='table'then return a==b end
      for k,v in pairs(a)do if not same(v,b[k])then return false end end
      for k in pairs(b)do if a[k]==nil then return false end end
      return true
    end
    if operatorDefault then
      snapshotMatched=0; snapshotInherited=0
      for key,value in pairs(SQP.DEFAULTS)do
        if operatorDefault[key]~=nil then
          assert(same(value,operatorDefault[key]),'Canonical default differs from operator snapshot: '..key)
          snapshotMatched=snapshotMatched+1
        else
          snapshotInherited=snapshotInherited+1
        end
      end
    end
    for _,profile in ipairs({'Default','Custom'})do
      if profile~='Default'then assert(SQP.db:CreateProfile(profile)) end
      for key,value in pairs(SQP.DEFAULTS)do
        if type(value)=='boolean'then SQPSettings[key]=not value
        elseif type(value)=='number'then SQPSettings[key]=value+37
        elseif type(value)=='string'then SQPSettings[key]='changed'
        elseif type(value)=='table'then SQPSettings[key]={0.123,0.456,0.789}end
      end
      SQPSettings.killLevelChip=true; SQPSettings.lootShowIconBackground=false
      SQPSettings.extraLegacySetting=true
      SQPSettings.toastBeforeAnimationDisable=true
      local refreshed=0
      SQP.optionsPanel={InvalidateAllTabs=function()end,Refresh=function()refreshed=refreshed+1 end}
      SQP:ResetSettings()
      for key,value in pairs(SQP.DEFAULTS)do assert(same(SQPSettings[key],value),'Reset retained nondefault '..key..' in '..profile) end
      assert(SQPSettings.killLevelChip==nil and SQPSettings.lootShowIconBackground==nil,'Reset retained optional overrides')
      assert(SQPSettings.extraLegacySetting==nil,'Reset retained legacy setting')
      assert(SQPSettings.toastBeforeAnimationDisable==nil,'Reset retained suspended Toast state')
      assert(refreshed==1,'Reset did not refresh options')
    end
  `);
  console.log('PASS real SQP Reset All + framework database: all defaults, nested colors, optional overrides, legacy keys, active custom profiles, options refresh');
  if(process.argv[3])console.log('PASS operator profile '+profileName+': '+lua.ctx.snapshotMatched+' explicit defaults match; '+lua.ctx.snapshotInherited+' absent settings retain inheritance');
  if(profileWire)console.log('Operator snapshot SHA256 '+createHash('sha256').update(profileWire).digest('hex'));
} catch(error) { console.error('FAIL '+error.message); process.exitCode=1; }
finally {lua.global.close();}
