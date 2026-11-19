const fs=require('fs'),{createRetriever}=require('../tutor/retrieval.cjs'),{generate}=require('../tutor/provider.cjs');
const model=process.argv[2]||'qwen3:1.7b',reasoning=process.argv.includes('--reasoning'),r=createRetriever();
const questions=[
 ['cbd-3','03-02','What is the difference between outputs and outcomes?'],
 ['cbd-1','02-01','Explain PESTEL-S with a policing example.'],
 ['cbd-1','04-02','Why is triangulation important?'],
 ['cbd-3','03-10','Explain this logframe and why an indicator needs verification.'],
 ['cbd-6','06-01','What triggers a responsible transition?'],
 ['cbd-4','04-01','Why should an adviser avoid importing a policing solution unchanged?']
];
(async()=>{const rows=[];for(const[lessonId,screenId,question]of questions){const passages=r.search(question,{lessonId,screenId,mode:'screen'});const begin=Date.now();let candidate;try{const reply=await generate({model,question,passages,reasoning,signal:AbortSignal.timeout(90000),onCandidate:value=>{candidate=value;}});rows.push({question,context:{lessonId,screenId},retrieved:passages.map(p=>p.id),status:'generated',...reply});}catch(e){rows.push({question,status:'failed',error:e.message,undeliveredCandidate:candidate,elapsedMs:Date.now()-begin});}fs.writeFileSync('docs/reviews/run06-intelligent-learning/evidence/benchmark-'+model.replace(/[:/]/g,'-')+(reasoning?'-thinking':'')+'.json',JSON.stringify({provider:'genuine-local-ollama',model,configuration:{reasoning,contextTokens:4096,maxOutputTokens:reasoning?1800:420,benchmarkDeadlineMs:90000},rows},null,2));console.log(question,rows.at(-1).status,rows.at(-1).metrics?.elapsedMs||rows.at(-1).elapsedMs);} })().catch(e=>{console.error(e);process.exitCode=1});
