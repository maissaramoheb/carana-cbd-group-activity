/* Produce only inspected static output; never fetch environment files or generate paid media. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const run=(cmd,args)=>execFileSync(cmd,args,{cwd:root,stdio:'inherit'});
run(process.execPath,['tools/validate-content.cjs']);
run('npm',['test']);
run('npm',['run','build']);
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const changes=execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim();
if(changes)throw Error('Commit tracked changes before preparing a release');
const target=path.join(root,'.vercel/output');
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
fs.cpSync(path.join(root,'dist'),path.join(target,'static'),{recursive:true});
const config={version:3,routes:[
 {src:'^/$',status:307,headers:{Location:'/platform/'}},
 {src:'^/platform$',status:308,headers:{Location:'/platform/'}},
 {src:'^/platform/$',dest:'/platform/index.html'},
 {src:'^/course$',status:308,headers:{Location:'/course/'}},
 {src:'^/course/$',dest:'/course/index.html'},
 {src:'^/quick-exercise/?$',dest:'/CARANA_CBD_Group_Activity.html'},
 {src:'^/(module[1-6]|CARANA_CBD_Group_Activity)$',dest:'/$1.html'},
 {src:'^/course/(visual-gallery|voice-audition)$',dest:'/course/$1.html'},
 {src:'^/course/audio/en/lesson1/[^/]+-[a-f0-9]{64}\\.mp3$',headers:{'Cache-Control':'public, max-age=31536000, immutable'},continue:true},
 {handle:'filesystem'}
]};
fs.writeFileSync(path.join(target,'config.json'),JSON.stringify(config,null,2)+'\n');
function files(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name),prefix+d.name+'/'):[prefix+d.name]);}
const entries=files(path.join(target,'static')).sort().map(file=>{
 if(/(^|\/)(\.env[^/]*|\.git|docs|tests|tools|node_modules)(\/|$)|\.pdf$/.test(file))throw Error('Unexpected non-public release file: '+file);
 const bytes=fs.readFileSync(path.join(target,'static',file));
 return {file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
const manifest={version:1,sourceCommit:sha,target:'isolated-preview',fieldPilot:'deferred',originalBaseline:'337246f3b8731029ed3498fe33d0f19841bb687b',lessonStatus:'Run02 CBD 2–6 instructional review; new media and expert validation pending; MMA/COP readiness only',files:entries};
fs.writeFileSync(path.join(target,'static/release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared static-only preview for',sha,'with',entries.length,'hashed assets. Production promotion requires owner acceptance.');
