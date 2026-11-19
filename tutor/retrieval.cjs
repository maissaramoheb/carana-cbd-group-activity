const fs=require('node:fs'),path=require('node:path');
const STOP=new Set('a an and are as at be before by can do for from how i in is it me of on or should the this to us what when which with you your difference between versus does official lesson say about precise numeric every please explain give more simply screen concept example why important professional practical clearly invented remember'.split(' '));
const terms=s=>String(s).toLowerCase().match(/[a-z][a-z-]{2,}/g)?.filter(x=>!STOP.has(x)).map(x=>/^triangulat/.test(x)?'triangulation':/^pestel/.test(x)?'pestel':x.replace(/s$/,''))||[];
function createRetriever(index=JSON.parse(fs.readFileSync(path.join(__dirname,'knowledge.json')))){
 const records=index.records;const byId=new Map(records.map(r=>[r.id,r]));
 function context(c){if(!c||typeof c!=='object'||!/^cbd-[1-6]$/.test(c.lessonId)||!['screen','checkpoint','practical'].includes(c.mode))return null;const own=records.filter(r=>r.lessonId===c.lessonId);if(!own.length)return null;const current=byId.get(c.lessonId+':'+c.screenId);return current?{...current,mode:c.mode}:null;}
 function search(question,c,limit=3){
  const current=context(c);if(!current)return[];
  const q=[...new Set(terms(question))],generic=!q.length||/^(Explain this screen|Give.*example.*this concept|What should I remember|Compare the main concepts|Help me check my reasoning)/i.test(question);
  const corpus=records.map(r=>({r,title:terms(r.title+' '+r.section+' '+r.text.split('\n')[0]),body:terms(r.text)}));
  const df=new Map(q.map(w=>[w,corpus.filter(x=>x.title.includes(w)||x.body.includes(w)).length]));
  const weight=w=>Math.log(1+records.length/(1+df.get(w)));
  const total=q.reduce((n,w)=>n+weight(w),0);
  const scored=corpus.map(({r,title,body})=>{let lexical=0,covered=0;for(const w of q){if(title.includes(w)||body.includes(w))covered+=weight(w);lexical+=(title.filter(t=>t===w).length*5+Math.min(3,body.filter(t=>t===w).length))*weight(w);}
   const contextual=r.id===current.id?3:r.lessonId===current.lessonId?.5:0;
   return{r,lexical,coverage:total?covered/total:0,score:lexical*(total?(covered/total)**2:1)+(generic?contextual*4:contextual)};
  }).filter(x=>generic?x.score>0:x.lexical>0&&x.coverage>=.45).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id));
  return scored.slice(0,limit).map(({r})=>({...r,text:r.text.slice(0,2100)}));
 }

 return{context,search,records};
}
module.exports={createRetriever,terms};
