'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Original software and report retain distinct DOI citations and author identity',()=>{
 const original=read('CITATION.cff'),report=read('docs/publication/CITATION.cff');
 assert.match(original,/10\.5281\/zenodo\.23284920/);
 assert.doesNotMatch(original,/^doi:.*24495425/m);
 assert.match(report,/preferred-citation:\s+type: report/);
 assert.match(report,/10\.5281\/zenodo\.24495425/);
 assert.doesNotMatch(report,/^type: generic/m);
 for(const file of ['index.html','platform/index.html','course/app.js']){
  const s=read(file);assert(s.includes('https://doi.org/10.5281/zenodo.24495425'));
  assert(s.includes('https://orcid.org/0009-0004-3009-5888'));
  assert(s.includes('© 2026 Maissara Selim'));
 }
 assert(read('index.html').includes('https://doi.org/10.5281/zenodo.23284920'));
});
test('French and Arabic preserve the approved localized copyright and author identity',()=>{
 for(const lang of ['fr-FR','ar']){
  const ui=JSON.parse(read('locales/'+lang+'/ui.json'));
  const value=ui.course.footerHomeLeft;
  assert(value.includes('© 2026'));assert(value.includes('Maissara Selim'));
  if(lang==='ar')assert(value.includes('ميسرة سليم'));
 }
});
