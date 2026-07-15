const fs=require('fs');
const html=fs.readFileSync('/Users/ymacmini/Documents/claudecode@macmini/dev/brew-rap-battle/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8, html.indexOf('// ---- 選択UI ----'));
const sb={}; new Function('sandbox',script+'\n;Object.assign(sandbox,{FIGHTERS,buildVerse,rng,vowels,yomiOf});')(sb);
const {FIGHTERS,buildVerse,rng}=sb;
const spanWords=h=>[...h.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(m=>m[1]);
for(const id in FIGHTERS){
  const me=FIGHTERS[id]; let verses=0, bad=0; const perKey={};
  for(let i=0;i<3000;i++){
    const {key,lines}=buildVerse(me,rng((i*40503+id.length)>>>0));
    verses++;
    const c={}; lines.forEach(ln=>spanWords(ln).forEach(w=>c[w]=(c[w]||0)+1));
    const has3=Object.values(c).some(v=>v>=3);
    perKey[key]=perKey[key]||{n:0,b:0}; perKey[key].n++; if(has3){perKey[key].b++; bad++;}
  }
  const worst=Object.entries(perKey).filter(([k,v])=>v.b>0).map(([k,v])=>`${k}:${(100*v.b/v.n).toFixed(0)}%`).join(' ');
  console.log(`${me.name.padEnd(5)} 同語3回以上バース率:${(100*bad/verses).toFixed(1)}%  ${worst?'(内訳 '+worst+')':''}`);
}
