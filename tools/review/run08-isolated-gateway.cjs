/* Isolated owner review only. Never synchronizes the production service or project env. */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {start}=require('../../tutor/gateway.cjs');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'carana-run08-owner-'));fs.chmodSync(dir,0o700);
 const proxySecret=crypto.randomBytes(32).toString('hex'),token=crypto.randomBytes(24).toString('base64url');
 fs.writeFileSync(path.join(dir,'proxy-secret.txt'),proxySecret,{mode:0o600});
 const gateway=await start({port:8788,model:'carana-gemma4-text',qualification:'run08-owner-review; human language and SME approval pending',proxySecret,token,persistentDir:dir,idleUnloadMs:0,maxQueue:1,telemetry:()=>{}});
 const cf=spawn('/opt/homebrew/bin/cloudflared',['tunnel','--url','https://127.0.0.1:8788','--protocol','http2','--no-tls-verify','--no-autoupdate'],{stdio:['ignore','pipe','pipe']});
 let tunnelUrl='',registered=false,reported=false;const deadline=setTimeout(()=>{console.error('Isolated review tunnel did not become ready');cf.kill();gateway.shutdown({unload:false}).then(()=>process.exit(1));},45000);
 function chunk(b){const s=b.toString(),m=s.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(m)tunnelUrl=m[0];if(s.includes('Registered tunnel connection'))registered=true;if(tunnelUrl&&registered&&!reported){reported=true;clearTimeout(deadline);const record={localUrl:'https://127.0.0.1:8788',tunnelUrl,privateDirectory:dir,proxySecretFile:path.join(dir,'proxy-secret.txt'),tokenFile:gateway.record.tokenFile,certificate:gateway.record.certificate,model:'carana-gemma4-text',gatewayPid:process.pid,tunnelPid:cf.pid,idleUnloadMs:0,productionUnchanged:true};fs.writeFileSync(path.join(dir,'review-runtime.json'),JSON.stringify(record,null,2),{mode:0o600});fs.writeFileSync(path.join(os.tmpdir(),'carana-run08-review-runtime-path'),path.join(dir,'review-runtime.json'),{mode:0o600});console.log('Isolated Run 08 gateway and tunnel ready; private access details stored locally.');}}
 cf.stdout.on('data',chunk);cf.stderr.on('data',chunk);let stopping=false;
 async function stop(){if(stopping)return;stopping=true;clearTimeout(deadline);cf.kill('SIGTERM');await gateway.shutdown({unload:false});process.exit(0);}
 process.on('SIGTERM',stop);process.on('SIGINT',stop);cf.once('exit',()=>{if(!stopping)stop();});
})().catch(e=>{console.error('Isolated review gateway failed: '+e.message);process.exitCode=1});
