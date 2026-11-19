const fs=require('node:fs'),path=require('node:path');
const STOP=new Set('a an and are as at be before by can do for from how i in is it me of on or should the this to us what when which with you your difference between versus does official lesson say about precise numeric every please explain give more simply screen concept example why important professional practical clearly invented remember would could using tell show describe'.split(' '));
function stem(w){
 if(/^triangulat/.test(w))return'triangulation';if(/^pestel/.test(w))return'pestel';
 if(/^improv|^strengthen|^enhanc/.test(w))return'improve';if(/^evaluat/.test(w))return'evaluate';if(/^verif/.test(w))return'verify';
 if(/^measur/.test(w))return'measure';if(/^indicat|^statistic|^metric/.test(w))return'indicator';if(/^objectiv/.test(w))return'objective';
 if(/^activit/.test(w))return'activity';if(/^transit/.test(w))return'transition';if(/^handover/.test(w))return'handover';
 if(/^sustain/.test(w))return'sustain';if(/^assum/.test(w))return'assumption';if(/^priorit/.test(w))return'priority';
 if(/^coord/.test(w))return'coordinate';if(/^diagnos/.test(w))return'diagnose';if(/^capab/.test(w))return'capability';
 if(/^capacit/.test(w))return'capacity';if(/^competenc/.test(w))return'competence';if(/^implement/.test(w))return'implement';
 if(/^organiz|^organis/.test(w))return'organisation';if(/^caus/.test(w))return'cause';if(/^align/.test(w))return'align';
 if(w.endsWith('ies')&&w.length>4)return w.slice(0,-3)+'y';
 if(w.endsWith('ing')&&w.length>5)return w.slice(0,-3).replace(/(.)\1$/,'$1');
 if(w.endsWith('ed')&&w.length>4)return w.slice(0,-2).replace(/(.)\1$/,'$1');
 if(w.endsWith('s')&&!w.endsWith('ss')&&w.length>3)return w.slice(0,-1);
 return w;
}
const terms=s=>String(s).replace(/https?:\/\/\S+/gi,' ').replace(/\b(?:cbd-\d+:\d{2,3}-\d{2,3}|plan-cbd-\d+:p\d+)\b/gi,' ').replace(/\b(?:page|pp?\.)\s*\d+\b/gi,' ').toLowerCase().match(/[a-z][a-z-]{2,}/g)?.filter(x=>!STOP.has(x)).map(stem)||[];
const SYNONYMS={
 problem:['diagnose','cause','driver','tree'],
 tree:['conflict','driver','cause','effect','hierarchy'],
 mov:['verify','evidence','source','indicator'],
 mean:['source','evidence','method','verify'],
 kpi:['indicator','measure','performance'],
 toc:['theory','change','middle','mechanism','because'],
 rbb:['budget','resource','result'],
 qip:['quick','impact','confidence','momentum'],
 ssr:['security','sector','reform','justice'],
 swot:['strength','weakness','opportunity','threat'],
 pin:['position','interest','need'],
 sara:['scanning','analysis','response','assessment'],
 smart:['specific','measurable','achievable','relevant','time-bound'],
 mma:['monitoring','mentoring','advising'],
 lfa:['logframe','logical','framework','hierarchy'],
 logframe:['hierarchy','output','outcome','indicator','verify','assumption','row','column'],
 align:['coherent','match','connect','horizontal','row','column'],
 cause:['comparison','explain','alternative','influence','sequence'],
 prove:['establish','verify','evidence','comparison','cause'],
 indicator:['measure','figure','observation','number','comparison'],
 workshop:['session','initiative','routine','activity','training'],
 output:['deliverable','result','hierarchy','outcome'],
 outcome:['output','result','change','hierarchy'],
 skill:['competence','training','capability','practice']
};
function createRetriever(index=JSON.parse(fs.readFileSync(path.join(__dirname,'knowledge.json')))){
 const records=index.records;const byId=new Map(records.map(r=>[r.id,r]));
 const corpus=records.map(r=>({r,title:terms(r.title+' '+r.section+' '+r.lessonTitle+' '+r.text.split('\n')[0]),body:terms(r.text)}));
 function context(c){if(!c||typeof c!=='object'||!/^cbd-[1-6]$/.test(c.lessonId)||!['screen','checkpoint','practical'].includes(c.mode))return null;const own=records.filter(r=>r.lessonId===c.lessonId);if(!own.length)return null;const current=byId.get(c.lessonId+':'+c.screenId);return current?{...current,mode:c.mode}:null;}
 function search(question,c,limit=3){
  const current=context(c);if(!current)return[];
  const qBase=[...new Set(terms(question))],generic=!qBase.length||/^(Explain this screen|Give.*example.*this concept|What should I remember|Compare the main concepts|Help me check my reasoning)/i.test(question);
  if(generic)return[{...current,text:current.text.slice(0,2250)}];
  const qExpanded=new Set(qBase);for(const w of qBase)for(const syn of(SYNONYMS[w]||[]))qExpanded.add(stem(syn));
  const df=new Map([...qExpanded].map(w=>[w,corpus.filter(x=>x.title.includes(w)||x.body.includes(w)).length]));
  const weight=w=>Math.log(1+records.length/(1+(df.get(w)||0)));
  const totalBase=qBase.reduce((n,w)=>n+weight(w),0);
  const scored=corpus.map(({r,title,body})=>{
   let lexical=0,coveredBase=0,exactTerms=0;
   for(const w of qBase){
    if(title.includes(w)||body.includes(w)){
     coveredBase+=weight(w);exactTerms++;
     lexical+=(title.filter(t=>t===w).length*4+Math.min(3,body.filter(t=>t===w).length))*weight(w);
    }else if((SYNONYMS[w]||[]).some(s=>{const st=stem(s);return title.includes(st)||body.includes(st);})){
     coveredBase+=weight(w)*.45;
    }
   }
   for(const w of qExpanded){
    if(!qBase.includes(w))lexical+=(title.filter(t=>t===w).length*2+Math.min(2,body.filter(t=>t===w).length))*weight(w)*.25;
   }
   const coverage=totalBase?coveredBase/totalBase:0;
   const contextual=r.id===current.id?(exactTerms>0?5.5:0):r.lessonId===current.lessonId?(exactTerms>0?2.5:0):0;
   return{r,lexical,coverage,exactTerms,score:lexical*(coverage**2)+contextual};
  }).filter(x=>x.lexical>0&&x.coverage>=.45).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id));
  return scored.slice(0,limit).map(({r})=>({...r,text:r.text.slice(0,2250)}));
 }

 return{context,search,records,stem,SYNONYMS};
}
module.exports={createRetriever,terms,stem,SYNONYMS};
