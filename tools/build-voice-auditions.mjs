/**
 * CARANA CBD voice audition build — three deliberately limited neural speech samples.
 * - Runs only during a Vercel preview build (never at learner request time).
 * - Original activity files are copied untouched.
 * - No generated voice is exposed until the returned bytes pass MP3 signature checks.
 * - Failed sample generation leaves that clip unavailable, never a fake Play button.
 * - AI-generated voice is explicitly disclosed in the client.
 *
 * Run locally to validate static output without network or billing:
 * SKIP_VOICE_GENERATION=1 node tools/build-voice-auditions.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'dist');
const SKIP=process.env.SKIP_VOICE_GENERATION==='1';
const selection=[
  {id:'01-01',topic:'The decision before the decision'},
  {id:'02-01',topic:'Structure the context with PESTEL-S'},
  {id:'05-02',topic:'Six dimensions cross every area'}
];

async function stageStaticAssets(){
  await fs.rm(dest,{recursive:true,force:true});
  await fs.mkdir(dest,{recursive:true});
  const ignore=new Set(['.git','.vercel','node_modules','dist','.github','.DS_Store','.env','.env.local','.env.production','package-lock.json']);
  for(const item of await fs.readdir(root,{withFileTypes:true})){
    if(ignore.has(item.name))continue;
    if(item.name.startsWith('.env.'))continue;
    await fs.cp(path.join(root,item.name),path.join(dest,item.name),{recursive:true,force:true});
  }
}

// Only the three selected pre-reviewed scripts are eligible for sampling.
async function getNarration(){
  const js=await fs.readFile(path.join(root,'course/lesson1-experience.js'),'utf8');
  const sandbox={window:{}};
  vm.runInNewContext(js,sandbox,{filename:'lesson1-experience.js',timeout:3000});
  const tracks=sandbox.window.CARANA_EXPERIENCE_V05?.narration?.tracks;
  if(!Array.isArray(tracks))throw Error('Narration script source missing');
  const result={};
  for(const item of selection){
    const entry=tracks.find(track=>track.id===item.id);
    if(!entry||typeof entry.script!=='string'||entry.script.length<300)throw Error('Invalid narration script: '+item.id);
    result[item.id]=entry.script;
  }
  return result;
}

function isMP3(audio){
  return audio.length>12000 &&
    ((audio.subarray(0,3).toString('ascii')==='ID3') ||
    (audio[0]===0xff && (audio[1]&0xe0)===0xe0));
}

async function main(){
  await stageStaticAssets();
  const texts=await getNarration();
  const destination=path.join(dest,'course/audio/en/lesson1');
  await fs.mkdir(destination,{recursive:true});
  const entries={};
  if(SKIP){
    console.log('[AUDITION] SKIP_VOICE_GENERATION=1 — static output validated, no audio generated.');
  } else {
    // Load the SDK only in the environment performing the paid generation.
    const {generateSpeech,gateway}=await import('ai');
    for(const item of selection){
      try{
        const started=Date.now();
        const response=await generateSpeech({
          model:gateway.speechModel('openai/tts-1-hd'),
          text:texts[item.id],
          voice:'onyx',
          outputFormat:'mp3',
          abortSignal:AbortSignal.timeout(90000)
        });
        const bytes=Buffer.from(response.audio.uint8Array);
        if(!isMP3(bytes))throw Error('Speech model did not return valid MP3 bytes');
        const filename=item.id+'.mp3';
        await fs.writeFile(path.join(destination,filename),bytes);
        entries[item.id]='./audio/en/lesson1/'+filename;
        console.log('[AUDITION] '+item.id+' OK '+bytes.length+' bytes ('+Math.round((Date.now()-started)/1000)+'s)');
      }catch(error){
        console.warn('[AUDITION] '+item.id+' unavailable: '+String(error?.message||error).slice(0,280));
      }
    }
  }
  const manifest= [
    '/* Auto-generated at build time. AI-generated audition samples; not final approved narration. */',
    'window.CARANA_LESSON1_AUDIO_MANIFEST = '+JSON.stringify(entries,null,2)+';',
    'window.CARANA_LESSON1_AUDIO_SAMPLE_MODE = true;',
    'window.CARANA_LESSON1_AUDIO_SAMPLE_METADATA = '+JSON.stringify({
      id:'voice-audition-2026-11',
      model:'openai/tts-1-hd',
      voice:'onyx',
      disclosure:'AI-generated voice audition, not a human recording or an approved final UN learning asset.',
      generatedIds:Object.keys(entries),
    },null,2)+';',
    ''
  ].join('\n');
  await fs.writeFile(path.join(dest,'course/lesson1-audio-manifest.js'),manifest,'utf8');
  // Useful for deployment verification and release evidence.
  await fs.writeFile(path.join(dest,'course/audio-samples-status.json'),JSON.stringify({
    status:Object.keys(entries).length===3?'all-three-generated':Object.keys(entries).length>0?'partial':'no-recordings',
    requested:selection.map(x=>x.id),
    generated:Object.keys(entries),
    approvedForFinalRelease:false,
    type:'AI-generated audition clips'
  },null,2),'utf8');
  console.log('[AUDITION] '+Object.keys(entries).length+' of 3 MP3 sample files available in static deployment.');
}

main().catch(error=>{
  console.error('[AUDITION] static build failed:',String(error?.message||error).slice(0,280));
  process.exitCode=1;
});
