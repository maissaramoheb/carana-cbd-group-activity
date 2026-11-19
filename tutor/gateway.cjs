/* Local-only HTTPS pilot. This file and its credentials are never staged for Vercel. */
const https=require('node:https'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {createRetriever}=require('./retrieval.cjs'),{generate}=require('./provider.cjs'),{createLocalTts}=require('./tts.cjs');
const ROOT=path.resolve(__dirname,'..');
function createHandler({token,origins,model='qwen3:4b',retriever=createRetriever(),provider=generate,tts=createLocalTts(),statusCheck=async()=>true,dist=path.join(ROOT,'dist'),timeoutMs=45000,rate=12,clock=Date.now}){
 let busy=false,ttsBusy=false;const buckets=new Map();const publicFiles=new Set();function scan(dir,prefix=''){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+item.name;if(item.isDirectory())scan(path.join(dir,item.name),rel+'/');else if(item.isFile())publicFiles.add(rel);}}if(fs.existsSync(dist))scan(dist);
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const protectedRequest=q=>/\b(answer\s*key|facilitator.{0,30}(?:answer|solution)|annex\s*d|model\s*answers?|correct\s*(?:answer|option|letter)|system\s*prompt|reveal.{0,20}(?:secret|key)|execute.{0,20}(?:command|shell))\b/i.test(q);
 function limited(key,max){const now=clock(),b=buckets.get(key);if(b&&b.until>now){b.n++;return b.n>max;}if(buckets.size>80)buckets.clear();buckets.set(key,{n:1,until:now+60000});return false;}
 function auth(header){const value=String(header||'').replace(/^Bearer /,'');const a=Buffer.from(value),b=Buffer.from(token);return a.length===b.length&&crypto.timingSafeEqual(a,b);}
 return async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Cache-Control','no-store');
  const host=String(req.headers.host||'');const allowedHosts=origins.map(o=>new URL(o).host);if(!allowedHosts.includes(host))return json(res,403,{message:'Host is not permitted.'});
  if(req.headers.origin&&!origins.includes(req.headers.origin))return json(res,403,{message:'Origin is not permitted.'});
  const url=new URL(req.url,'https://'+host),ip=req.socket.remoteAddress||'local';
  if(url.pathname==='/api/tutor/status'){
   if(req.method!=='GET')return json(res,405,{message:'Method not allowed.'});if(limited(ip+':status',60))return json(res,429,{message:'Pause before trying again.'});
   let connected=false;try{connected=await statusCheck();}catch(_){}return json(res,200,{mode:'local-pilot',provider:'ollama',model,requiresAccess:true,qualification:'not-qualified',connected,tts:tts?tts.status():{available:false,voices:[]}});
  }
  if(url.pathname==='/api/tts'){
   if(req.method!=='POST')return json(res,405,{message:'Method not allowed.'});
   if(!origins.includes(req.headers.origin))return json(res,403,{message:'A same-origin browser request is required.'});
   if(limited(ip+':all',60))return json(res,429,{message:'Too many requests. Wait a minute.'});
   if(!auth(req.headers.authorization))return json(res,401,{message:'Pilot access code was not accepted. Re-enter the code.'});
   if(!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{message:'JSON requests only.'});
   if(+req.headers['content-length']>4096)return json(res,413,{message:'Speech request is too large.'});
   let raw='';try{for await(const chunk of req){raw+=chunk.toString('utf8');if(Buffer.byteLength(raw)>4096)return json(res,413,{message:'Speech request is too large.'});}}catch(_){return;}
   let payload;try{payload=JSON.parse(raw);}catch(_){return json(res,400,{message:'Invalid JSON request.'});}
   if(!payload||typeof payload.text!=='string'||!payload.text.trim()||payload.text.length>1200)return json(res,400,{message:'Speech text is invalid.'});
   if(!tts)return json(res,503,{message:'Local speech engine is unavailable.'});
   if(ttsBusy)return json(res,429,{message:'Speech synthesis is already running.'});
   ttsBusy=true;const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);res.on('close',()=>{if(!res.writableEnded)abort.abort();});
   try{const result=await tts.synthesize({text:payload.text,voice:typeof payload.voice==='string'?payload.voice:'kokoro:af_heart',signal:abort.signal});if(!res.destroyed&&!res.writableEnded){res.writeHead(200,{'Content-Type':result.contentType,'Content-Length':result.buffer.length,'X-CARANA-TTS-Engine':result.engine,'Cache-Control':'no-store'});res.end(result.buffer);}}
   catch(e){if(!res.destroyed&&!res.writableEnded)json(res,503,{message:'Local neural speech synthesis could not complete.'});}
   finally{clearTimeout(timer);ttsBusy=false;}return;
  }
  if(url.pathname==='/api/tutor'){
   if(req.method!=='POST')return json(res,405,{message:'Method not allowed.'});
   if(!origins.includes(req.headers.origin))return json(res,403,{message:'A same-origin browser request is required.'});
   if(limited(ip+':all',40))return json(res,429,{message:'Too many requests. Wait a minute.'});
   if(!auth(req.headers.authorization))return json(res,401,{message:'Pilot access code was not accepted. Re-enter the code.'});
   if(limited('pilot',rate))return json(res,429,{message:'Pilot request limit reached. Wait a minute.'});
   if(!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{message:'JSON requests only.'});
   if(+req.headers['content-length']>8192)return json(res,413,{message:'Question request is too large.'});
   let raw='';try{for await(const chunk of req){raw+=chunk.toString('utf8');if(Buffer.byteLength(raw)>8192)return json(res,413,{message:'Question request is too large.'});}}catch(_){return;}
   let payload;try{payload=JSON.parse(raw);}catch(_){return json(res,400,{message:'Invalid JSON request.'});}
   if(!payload||Object.keys(payload).some(k=>!['question','context'].includes(k))||typeof payload.question!=='string'||!payload.question.trim()||payload.question.length>1200||!payload.context||Object.keys(payload.context).some(k=>!['lessonId','screenId','mode'].includes(k))||typeof payload.context.screenId!=='string'||!/^\d{2}-\d{2}$/.test(payload.context.screenId))return json(res,400,{message:'Question or context is invalid.'});
   const context=retriever.context(payload.context);if(!context)return json(res,400,{message:'Current lesson context was not recognized.'});
   const passages=retriever.search(payload.question,payload.context);const sourceRows=rows=>rows.map(p=>({id:p.id,title:p.title,source:p.source}));
   function deliver(text,sources,kind){res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store'});for(let n=0;n<text.length;n+=100)res.write(JSON.stringify({type:'content',text:text.slice(n,n+100)})+'\n');res.end(JSON.stringify({type:'done',sources,kind,provider:kind==='ai'?'genuine-local-ollama':'curriculum-policy',model:kind==='ai'?model:undefined})+'\n');}
   if(context.mode==='checkpoint'||protectedRequest(payload.question)){
    const own=retriever.search('Explain this screen',payload.context,2);return deliver('I can help you review the underlying concepts, but I will not select checkpoint options or reveal facilitator solutions.\n\nReview: '+own.map(p=>p.title).join('; ')+'.\n\n'+own.map(p=>p.text.slice(0,300)).join('\n\n')+'\n\nUse the source references and your own reasoning before returning to the checkpoint.',sourceRows(own),'study-guide');
   }
   if(!passages.length)return deliver('I could not retrieve enough authorized evidence for that wording. Try Explain this screen, or rephrase using the curriculum term.',[],'source-check');
   if(busy)return json(res,429,{message:'The local model is answering another question. Try again shortly.'});
   busy=true;const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeoutMs);res.on('close',()=>{if(!res.writableEnded)abort.abort();});
   try{const reply=await provider({model,question:payload.question,passages,context,signal:abort.signal});if(abort.signal.aborted)throw Error('cancelled');const text=reply.answer+(reply.example?'\n\nInvented teaching example: '+reply.example:'')+(reply.uncertainty?'\n\nEvidence limits: '+reply.uncertainty:'');deliver(text,reply.sources,'ai');}
   catch(e){if(!res.destroyed&&!res.writableEnded)json(res,503,{message:abort.signal.aborted?'The local reply timed out or was cancelled. No answer was supplied.':'The local model was unavailable or its response did not pass source checks. Try again later; the course remains available.'});}
   finally{clearTimeout(timer);busy=false;}return;
  }
  if(url.pathname.startsWith('/api/'))return json(res,404,{message:'No live AI endpoint is configured for this route.'});
  if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{message:'Method not allowed.'});
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch(_){return json(res,400,{message:'Invalid path.'});}if(pathname==='/'||pathname==='/course') {res.writeHead(307,{Location:'/course/'});res.end();return;}
  let rel=pathname.replace(/^\//,'');if(rel.endsWith('/'))rel+='index.html';if(!publicFiles.has(rel)&&publicFiles.has(rel+'.html'))rel+='.html';if(!publicFiles.has(rel)||rel.split('/').some(x=>x==='..'||x.startsWith('.')))return json(res,404,{message:'Not found.'});
  const file=path.join(dist,rel),mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.jpg':'image/jpeg','.png':'image/png'}[path.extname(rel)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 };
}
async function start({port=8766,model='qwen3:4b'}={}){
 if(!Number.isInteger(port)||port<1024||port>65535||!/^qwen3:(0\.6b|1\.7b|4b|4b-instruct-2507-q4_K_M)$/.test(model))throw Error('Use an approved local pilot model and an unprivileged loopback port.');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'carana-run06-pilot-'));fs.chmodSync(dir,0o700);const key=path.join(dir,'key.pem'),cert=path.join(dir,'cert.pem'),token=crypto.randomBytes(24).toString('base64url');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','7','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});fs.chmodSync(key,0o600);fs.writeFileSync(path.join(dir,'pilot-access.txt'),token,{mode:0o600});
 const origins=['https://localhost:'+port,'https://127.0.0.1:'+port];const handler=createHandler({token,origins,model,statusCheck:async()=>{const r=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(2500)});return r.ok&&(await r.json()).models.some(m=>m.name===model);}});
 const server=https.createServer({key:fs.readFileSync(key),cert:fs.readFileSync(cert),minVersion:'TLSv1.2'},handler);await new Promise((resolve,reject)=>server.once('error',reject).listen(port,'127.0.0.1',resolve));const record={url:origins[0],model,privateDirectory:dir,tokenFile:path.join(dir,'pilot-access.txt'),certificate:cert,qualification:'not-qualified; engineering prototype only',scope:'loopback-only; self-signed local review certificate; no public connection'};fs.writeFileSync(path.join(dir,'runtime.json'),JSON.stringify(record,null,2),{mode:0o600});console.log(JSON.stringify(record));return{server,record};
}
if(require.main===module)start({port:Number(process.argv[2]||8766),model:process.argv[3]||'qwen3:4b'}).then(({record})=>{console.error('\nCARANA Local Studio Ready (Loopback Only · NOT QUALIFIED / Track A HOLD)');console.error('  Course URL : '+record.url+'/course/#lesson-1');console.error('  Voice Lab  : '+record.url+'/course/voice-comparison');console.error('  Copy Token : pbcopy < '+record.tokenFile+'\n');}).catch(e=>{console.error(e.message);process.exitCode=1;});module.exports={createHandler,start};
