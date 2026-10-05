import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const framework=resolve(process.argv[2] || '../RGX-Framework');
const require=createRequire(resolve(framework,'tools/ci/package.json'));
const {Lua}=require('wasmoon-lua5.1');
const source=readFileSync(new URL('../../data/quest.lua',import.meta.url),'utf8');
let failed=0;
for (const test of [
 {name:'same-family non-target gets no count',unit:'Rot Hide Gnoll',text:'Rot Hide Mongrel slain: 1/5',expected:false},
 {name:'actual incomplete target retains count',unit:'Rot Hide Mongrel',text:'Rot Hide Mongrel slain: 1/5',expected:true},
 {name:'finished objective contributes no count',unit:'Rot Hide Mongrel',text:'Rot Hide Mongrel slain: 1/5',finished:true,expected:false},
 {name:'partial single-word target gets no count',unit:'Wolf',text:'Direwolf slain: 1/5',expected:false},
]) {
 const lua=await Lua.create();
 try {
  lua.ctx.source=source;
  lua.ctx.unitName=test.unit;
  lua.ctx.objectiveText=test.text;
  lua.ctx.finished=test.finished === true;
  lua.ctx.expected=test.expected;
  lua.doStringSync(`
   SQPSettings={}
   UnitName=function(unit)return unit=='player' and 'Tester' or unitName end
   UnitExists=function()return true end
   GetTime=function()return 1 end
   C_TooltipInfo={GetUnit=function()return {lines={}} end}
   SQP={Compat={GetNumQuestLogEntries=function()return 1 end,
    GetInfo=function()return {questID=1} end,
    GetQuestObjectives=function()return {{text=objectiveText,type='monster',finished=finished}} end}}
   assert(loadstring(source))('SQP_Forever',SQP)
   local progress=SQP:GetQuestProgress('nameplate1')
   assert((progress~=nil)==expected,'unexpected objective: '..tostring(progress))
  `);
  console.log('PASS '+test.name);
 } catch(error) {failed++;console.error('FAIL '+test.name+': '+error.message);}
 finally {lua.global.close();}
}
process.exitCode=failed ? 1 : 0;
