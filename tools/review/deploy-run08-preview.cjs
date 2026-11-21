/* Deployment-scoped configuration only: no project env edits, no production target. */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const runtime=JSON.parse(fs.readFileSync(fs.readFileSync(path.join(os.tmpdir(),'carana-run08-review-runtime-path'),'utf8').trim(),'utf8'));
const link=JSON.parse(fs.readFileSync(path.join(ROOT,'.vercel/project.json'),'utf8'));
if(link.projectId!=='prj_LmlHNDuRJSRwmJ7HIwPYpcmePFWn'||link.orgId!=='team_VDHRFSKWGcZNOH19qM7aFOCr')throw Error('Review project mismatch');
const env={...process.env,CARANA_AI_ENABLED:'true',CARANA_PILOT_DISABLED:'false',CARANA_UPSTREAM_URL:runtime.tunnelUrl,CARANA_PROXY_SECRET:fs.readFileSync(runtime.proxySecretFile,'utf8').trim(),CARANA_MODEL:runtime.model,CARANA_QUALIFICATION:'Run 08 owner review; human linguistic and UNPOL SME approval pending'};
const keys=['CARANA_AI_ENABLED','CARANA_PILOT_DISABLED','CARANA_UPSTREAM_URL','CARANA_PROXY_SECRET','CARANA_MODEL','CARANA_QUALIFICATION'];
const args=['deploy','--prebuilt','--yes','--scope','delta4ce20-5830s-projects','--target','preview',...keys.flatMap(key=>['--env',key])];
const result=spawnSync('vercel',args,{cwd:ROOT,env,encoding:'utf8',timeout:180000,maxBuffer:2*1024*1024});
const log=path.join(runtime.privateDirectory,'deployment.log');fs.writeFileSync(log,(result.stdout||'')+'\n'+(result.stderr||''),{mode:0o600});
if(result.status!==0){console.error('Isolated preview deployment failed; inspect private deployment log.');process.exitCode=1;}else{const urls=(result.stdout||'').match(/https:\/\/[a-z0-9.-]+\.vercel\.app/g)||[];if(!urls.length)throw Error('Preview URL missing');const url=urls[urls.length-1];fs.writeFileSync(path.join(os.tmpdir(),'carana-run08-preview-url'),url,{mode:0o600});console.log(JSON.stringify({previewUrl:url,target:'preview',deploymentScopedEnv:true,projectEnvironmentUnchanged:true}));}
