/**
 * CARANA CBD Lesson 1 — natural English AI narration, 18 clips.
 *
 * Build-only generation with approved voice ('onyx', OpenAI TTS-1 HD).
 * Previously served valid MP3 files on the official CBD course domain are
 * reused byte-for-byte. Missing tracks are generated with conservative rate
 * limiting. A partial release fails the build: never publish a course claiming
 * 18 narrated screens when audio is incomplete.
 *
 * NO runtime TTS, no browser speech synthesis, no exposed API credentials.
 *
 * SKIP_VOICE_GENERATION=1 allows smoke-testing static assets without generating
 * any audio. All full production builds must verify 18 source-accurate MP3s.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'dist');
const SKIP=process.env.SKIP_VOICE_GENERATION==='1';
const AUDIO_SOURCE='https://cbd.maissara.tech/course/audio/en/lesson1/';
const MODEL='openai/tts-1-hd';
const VOICE='onyx';
const GAP_MS=17500;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function stageStaticAssets(){
  await fs.rm(dest,{recursive:true,force:true});
  await fs.mkdir(dest,{recursive:true});
  const ignore=new Set(['.git','.vercel','node_modules','dist','.github','.DS_Store','.env','.env.local','.env.production','package-lock.json']);
  for(const item of await fs.readdir(root,{withFileTypes:true})){
    if(ignore.has(item.name)||item.name.startsWith('.env.'))continue;
    await fs.cp(path.join(root,item.name),path.join(dest,item.name),{recursive:true,force:true});
  }
}
async function loadSource(){
  const js=await fs.readFile(path.join(root,'course/lesson1-experience.js'),'utf8');
  const sandbox={window:{}};
  vm.runInNewContext(js,sandbox,{filename:'lesson1-experience.js',timeout:3000});
  const tracks=sandbox.window.CARANA_EXPERIENCE_V05?.narration?.tracks;
  if(!Array.isArray(tracks)||tracks.length!==18)throw Error('Expected exactly 18 official-aligned voice scripts');
  const expected=[];
  for(let sec=1;sec<=6;sec++)for(let screen=1;screen<=3;screen++)
    expected.push(String(sec).padStart(2,'0')+'-'+String(screen).padStart(2,'0'));
  for(const [i,t] of tracks.entries()){
    if(t.id!==expected[i]||typeof t.script!=='string'||t.script.trim().length<300)
      throw Error('Source script incomplete or out of order: '+expected[i]);
  }
  return tracks;
}
function isMP3(bytes){
  return bytes.length>12000 &&
    (bytes.subarray(0,3).toString('ascii')==='ID3' ||
      (bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0));
}

async function fetchPriorAudio(id){
  const source=AUDIO_SOURCE+id+'.mp3';
  try {
    const r=await fetch(source,{signal:AbortSignal.timeout(20000),headers:{'Accept':'audio/mpeg'}});
    const type=r.headers.get('content-type')||'';
    if(!r.ok||!type.startsWith('audio/'))return null;
    const bytes=Buffer.from(await r.arrayBuffer());
    if(!isMP3(bytes))throw Error('Existing file failed MP3 validation for '+id);
    return bytes;
  }catch(error){
    const msg=String(error?.message||error);
    console.warn('[NARRATION] '+id+' reuse unavailable: '+msg.slice(0,180));
    return null;
  }
}

async function generateSingle(text,id,generateSpeech,gateway,lastRequest){
  for(let attempt=1;attempt<=4;attempt++){
    // Vercel AI Gateway limits this provider to five requests/min across the
    // team. Space out *all* requests, including unsuccessful attempts.
    const elapsed=Date.now()-lastRequest.at;
    if(lastRequest.at&&elapsed<GAP_MS)await sleep(GAP_MS-elapsed);
    lastRequest.at=Date.now();
    try{
      const result=await generateSpeech({
        model:gateway.speechModel(MODEL),
        text,
        voice:VOICE,
        outputFormat:'mp3',
        abortSignal:AbortSignal.timeout(90000)
      });
      const bytes=Buffer.from(result.audio.uint8Array);
      if(!isMP3(bytes))throw Error('Provider returned invalid/empty MP3');
      return bytes;
    }catch(error){
      const reason=String(error?.message||error);
      const limited=/rate limit|429|GatewayRateLimitError/i.test(reason);
      if(attempt===4)throw Error('Audio generation failed for '+id+': '+reason.slice(0,260));
      if(!limited)throw Error('Audio generation failed for '+id+': '+reason.slice(0,260));
      const match=reason.match(/Retry after\s+(\d+)s/i);
      const cooldown=Math.min(130000,Math.max(65000,(Number(match?.[1])||60)*1000+7000));
      console.warn('[NARRATION] '+id+' rate-limited, attempt '+attempt+'; cooldown '+Math.ceil(cooldown/1000)+'s.');
      await sleep(cooldown);
    }
  }
  throw Error('Audio generation exhausted retries for '+id);
}

async function main(){
  await stageStaticAssets();
  const tracks=await loadSource();
  const destination=path.join(dest,'course/audio/en/lesson1');
  await fs.mkdir(destination,{recursive:true});
  const entries={};
  const reused=[];
  const generated=[];
  let generateSpeech,gateway;
  const lastRequest={at:0};

  if(SKIP){
    console.log('[NARRATION] Smoke only. Audio deliberately skipped.');
  }else{
    for(const [i,t] of tracks.entries()){
      let bytes=await fetchPriorAudio(t.id);
      if(bytes){
        reused.push(t.id);
        console.log('[NARRATION] '+t.id+' REUSED '+bytes.length+' bytes');
      }else{
        if(!generateSpeech){
          const sdk=await import('ai');
          generateSpeech=sdk.generateSpeech;
          gateway=sdk.gateway;
        }
        bytes=await generateSingle(t.script,t.id,generateSpeech,gateway,lastRequest);
        generated.push(t.id);
        console.log('[NARRATION] '+t.id+' GENERATED '+bytes.length+' bytes ('+(i+1)+'/18)');
      }
      await fs.writeFile(path.join(destination,t.id+'.mp3'),bytes);
      entries[t.id]='./audio/en/lesson1/'+t.id+'.mp3';
    }
    if(Object.keys(entries).length!==18)throw Error('Never release an incomplete Lesson 1 audio set');
  }

  const manifest=[
    '/* Generated at build-time; actual same-origin MP3s only. AI narration is disclosed. */',
    'window.CARANA_LESSON1_AUDIO_MANIFEST = '+JSON.stringify(entries,null,2)+';',
    'window.CARANA_LESSON1_AUDIO_SAMPLE_MODE = false;',
    'window.CARANA_LESSON1_AUDIO_AI_MODE = true;',
    'window.CARANA_LESSON1_AUDIO_SAMPLE_METADATA = '+JSON.stringify({
      id:'lesson1-english-narration',
      model:MODEL,voice:VOICE,
      disclosure:'AI-generated English trainer narration, independently authored and not UN-endorsed.',
      generatedIds:generated,
      reusedIds:reused
    },null,2)+';',
    ''
  ].join('\n');
  await fs.writeFile(path.join(dest,'course/lesson1-audio-manifest.js'),manifest,'utf8');
  const status={
    status:SKIP?'smoke-no-audio':'complete',
    requested:tracks.map(t=>t.id),available:Object.keys(entries),
    generated,reused,total:Object.keys(entries).length,
    model:MODEL,voice:VOICE,approvedForUNCertification:false
  };
  await fs.writeFile(path.join(dest,'course/audio-samples-status.json'),JSON.stringify(status,null,2),'utf8');
  console.log('[NARRATION] '+status.total+' / 18 verified MP3 files. Generated: '+generated.length+'. Reused: '+reused.length+'.');
}
main().catch(error=>{
  console.error('[NARRATION] BUILD FAILED (no partial release):',String(error?.message||error).slice(0,500));
  process.exitCode=1;
});
