/* Isolated owner preview: reuse the existing production AI service without changing it. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),data=path.join(os.homedir(),'.local/share/carana-ai');
const link=JSON.parse(fs.readFileSync(path.join(root,'.vercel/project.json'),'utf8'));
if(link.projectId!=='prj_LmlHNDuRJSRwmJ7HIwPYpcmePFWn'||link.orgId!=='team_VDHRFSKWGcZNOH19qM7aFOCr')throw Error('Preview project mismatch');
const state=JSON.parse(fs.readFileSync(path.join(data,'supervisor-state.json'),'utf8'));
if(state.port!==8766||!state.gateway.healthy||!state.tunnel.healthy)throw Error('Existing AI service is not healthy; no configuration was changed');
const env={...process.env,CARANA_AI_ENABLED:'true',CARANA_PILOT_DISABLED:'false',CARANA_UPSTREAM_URL:state.tunnelUrl,CARANA_PROXY_SECRET:fs.readFileSync(path.join(data,'proxy-secret'),'utf8').trim(),CARANA_MODEL:state.model,CARANA_QUALIFICATION:'Run 09 visual owner review; institutional validation remains pending'};
const names=['CARANA_AI_ENABLED','CARANA_PILOT_DISABLED','CARANA_UPSTREAM_URL','CARANA_PROXY_SECRET','CARANA_MODEL','CARANA_QUALIFICATION'];
const args=['deploy','--prebuilt','--target','preview','--yes','--scope','delta4ce20-5830s-projects',...names.flatMap(n=>['--env',n])];
const r=spawnSync('vercel',args,{cwd:root,env,encoding:'utf8',timeout:180000,maxBuffer:2*1024*1024});
fs.writeFileSync(path.join(os.tmpdir(),'carana-run09-private-deploy.log'),(r.stdout||'')+'\n'+(r.stderr||''),{mode:0o600});
// Only deployment metadata is returned; credentials are never echoed or written to the site.
if(r.status!==0){console.error('Run 09 preview deployment failed (exit '+r.status+'); production configuration unchanged.');process.exitCode=1;}else{let result;try{result=JSON.parse(r.stdout)}catch{const urls=r.stdout.match(/https:\/\/[a-z0-9.-]+\.vercel\.app/g)||[];result={deployment:{url:urls.at(-1)}};}if(!result.deployment?.url)throw Error('Deployment URL missing');console.log(JSON.stringify({target:'preview',deploymentId:result.deployment.id,url:result.deployment.url,readyState:result.deployment.readyState,existingProductionAi:true,productionEnvironmentChanged:false}));}
