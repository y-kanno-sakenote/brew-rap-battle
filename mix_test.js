// 名勝負ミックス（コーパス2行組の組み替え）の機械検証
// 使い方: node mix_test.js   （コーパスが増えたら・組み替え規則を触ったら実行）
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8, html.indexOf('// ---- 選択UI ----'));
const sb={}; new Function('sandbox',script+'\n;Object.assign(sandbox,{FIGHTERS,parseCorpus,corpusBattle,rng,CP_RESP,CP_CONN});')(sb);
const {FIGHTERS,parseCorpus,corpusBattle,rng,CP_RESP,CP_CONN}=sb;
const text=fs.readFileSync(__dirname+'/docs/claude_corpus.jsonl','utf8');
const C=parseCorpus(text);
// index.html の CORPUS はモジュール内 let なので、同じ関数群をこのコーパスで動かすため再評価する
const sb2={}; new Function('sandbox','__C',script+'\n;CORPUS=__C;Object.assign(sandbox,{corpusBattle,CP_RECENT});')(sb2,C);
const battleOf=(...a)=>{ sb2.CP_RECENT.clear(); return sb2.corpusBattle(...a); };   // 規則検査は毎回まっさらで

const strip=s=>String(s).replace(/<[^>]*>/g,'');
// 元バトルで「相手の締め語への返し」だった行（2番目以降のバースの冒頭2行）＝組み替えに出てはいけない
const RESP_LINES=new Set();
text.split('\n').forEach(l=>{ try{ const d=JSON.parse(l); d.data.verses.forEach((v,vi)=>{ if(vi>0){ RESP_LINES.add(strip(v.lines[0])); RESP_LINES.add(strip(v.lines[1])); } }); }catch(e){} });
const fb={};
const ids=Object.keys(FIGHTERS);
let dupAll=0, looseB=0, missSum=0, battles=0, fails=0, verses=0, dupEnd=0, badHead=0, resp=0, recomb=0, multiTheme=0, crossR=0, crossHit=0;
const seen=new Set(); let uniq=0;
const couplets=Object.values(C.pools).reduce((n,p)=>n+p.length,0);
for(const a of ids) for(const b of ids){ if(a===b) continue;
  for(const bars of [4,8,12]) for(const cross of [false,true]) for(let s=0;s<40;s++){
    battles++;
    const seed=(s*2654435761 ^ bars*7 ^ (cross?99:0))>>>0;
    const cb=battleOf(a,b,Math.round(bars/4),seed,cross);
    const fk=bars+(cross?'跨':'ソ'); fb[fk]=fb[fk]||[0,0]; fb[fk][1]++;
    if(!cb){ fails++; fb[fk][0]++; continue; }
    const themes=new Set();
    if(cross && cb.crossOK) missSum+=cb.crossMiss;
    if(cb.theme) looseB++;
    cb.verses.forEach(([id,v],i)=>{
      verses++;
      const L=v.lines.map(strip);
      const ends=v.lines.map(l=>{const m=[...l.matchAll(/<span class="rhyme">([^<]*)<\/span>/g)]; return m.length?m[m.length-1][1]:'';});
      if(new Set(ends).size<ends.length) dupEnd++;
      const allw=v.lines.flatMap(l=>[...l.matchAll(/<span class="rhyme">([^<]*)<\/span>/g)].map(m=>m[1])); if(new Set(allw).size<allw.length) dupAll++;
      if(CP_CONN.test(L[0])) badHead++;
      if(L.some(x=>RESP_LINES.has(x) || CP_RESP.test(x))) resp++;
      const k=v.lines.join('|'); if(!seen.has(k)){ seen.add(k); uniq++; }
      if(i%2===1 && cross && cb.crossOK){ crossR++; if(v.key===cb.verses[i-1][1].key) crossHit++; }
    });
    // お題の混在: 各2行組の出どころのお題を辿る
    const pools=Object.values(C.pools).flat();
    cb.verses.forEach(([id,v])=>{ for(const c of pools){ if(v.lines.includes(c.lines[0]) && c.theme) themes.add(c.theme); } });
    if(themes.size>1) multiTheme++;   // お題は1バトル1種が必須
  }
}
// 組み替え率（別バトルの2行組を繋いだ割合）: 代表サンプルで測る
let aimed=0, aimedN=0;
{ let n=0,diff=0; const pools=Object.values(C.pools).flat();
  const src=l=>pools.find(c=>c.lines[0]===l);
  for(const a of ids) for(const b of ids){ if(a===b) continue;
    for(let s=0;s<20;s++){ const cb=battleOf(a,b,2,(s*7919)>>>0,false); if(!cb) continue;
      cb.verses.forEach(([id,v],i)=>{ n++; const c1=src(v.lines[0]), c2=src(v.lines[2]);
        if(!c1||!c2||c1.b!==c2.b) diff++;
        const opp=cb.verses[i%2?i-1:i+1][0]; aimedN++; if((c1&&c1.opp===opp)||(c2&&c2.opp===opp)) aimed++; }); } }
  recomb = n? diff/n*100 : 0; }
const pct=(x,n)=>(n?x/n*100:0).toFixed(2)+'%';
// 「もう一本」: 同じ組み合わせ・8小節で2本続けて作った時、2本目が1本目と同じ2行組を使う割合（ペア平均と最悪ペア）
let rep2=[], worst=['',0];
for(const a of ids) for(const b of ids){ if(a===b) continue; let sh=0,n=0;
  for(let s=0;s<20;s++){ sb2.CP_RECENT.clear();
    const b1=sb2.corpusBattle(a,b,2,(s*7919)>>>0,false); if(!b1) continue;
    b1.used.forEach(c=>sb2.CP_RECENT.add(c));
    const b2=sb2.corpusBattle(a,b,2,(s*7919+1)>>>0,false); if(!b2) continue;
    const u1=new Set(b1.used); sh+=b2.used.filter(c=>u1.has(c)).length; n+=b2.used.length; }
  const r=n?sh/n:0; rep2.push(r); if(r>worst[1]) worst=[a+'>'+b,r]; }
console.log(`材料: 2行組 ${couplets} ／ 韻プール ${Object.keys(C.pools).length}`);
console.log(`バトル ${battles}（20方向ペア×4/8/12小節×ソロ/跨ぎ×40seed）`);
console.log(`  組めず旧エンジンへ: ${fails} (${pct(fails,battles)})  内訳: `+Object.entries(fb).map(([k,[f,n]])=>k+' '+pct(f,n)).join(' / '));
console.log(`  バース内の行末語重複: ${dupEnd}/${verses} (${pct(dupEnd,verses)})   ← 0が必須`);
console.log(`  バース内の印の語（中韻を含む）の重複: ${dupAll}/${verses} (${pct(dupAll,verses)})   ← 0が必須`);
console.log(`  頭の行が「だが/その」等: ${badHead} (${pct(badHead,verses)})   ← 0が必須`);
console.log(`  返しの行（尻取り返し・〜だと？）混入: ${resp} (${pct(resp,verses)})   ← 0が必須`);
console.log(`  出どころのお題が2種以上のバトル: ${multiTheme}   ← 0が必須 ／ お題つきで組んだバトル: ${looseB} (${pct(looseB,battles-fails)})`);
console.log(`  別バトル由来の組み替え率: ${recomb.toFixed(1)}%`);
console.log(`  相手向けの2行組を含むバース: ${pct(aimed,aimedN)}`);
console.log(`  跨ぎ韻で後攻が同じ韻を踏めた: ${crossHit}/${crossR} (${pct(crossHit,crossR)})  告知つきソロ落ち ${missSum}  ← 告知なしの外れは0が必須`);
// 決め台詞の使い回し: 同じバトルで同じキャラが同じ6文字以上の言い回しを2回使う割合（8/12小節）
{ const nz=x=>String(x).replace(/<[^>]*>/g,'').replace(/[、。！？!?\s]/g,''); let n=0,h=0;
  const byMode={ソロ:[0,0],跨ぎ:[0,0]};
  for(const a of ids) for(const b of ids){ if(a===b) continue; for(const bars of [8,12]) for(const cross of [false,true]) for(let s=0;s<20;s++){
    const cb=battleOf(a,b,bars/4,(s*2654435761^bars)>>>0,cross); if(!cb) continue; n++; const m=byMode[cross?'跨ぎ':'ソロ']; m[1]++;
    const L=cb.verses.flatMap(([id,v])=>v.lines.map(x=>[id,nz(x)])); let f=false;
    for(let i=0;i<L.length&&!f;i++) for(let j=i+1;j<L.length&&!f;j++){ if(L[i][0]!==L[j][0]) continue; for(let k=0;k+6<=L[i][1].length;k++){ if(L[j][1].includes(L[i][1].slice(k,k+6))){ f=true; break; } } }
    if(f){ h++; m[0]++; } } }
  console.log(`  同じキャラが同じ言い回しを2回使うバトル: ソロ ${pct(byMode.ソロ[0],byMode.ソロ[1])} ／ 跨ぎ ${pct(byMode.跨ぎ[0],byMode.跨ぎ[1])}`); }
console.log(`  「もう一本」で前のバトルと同じ2行組: 平均 ${(rep2.reduce((x,y)=>x+y,0)/rep2.length*100).toFixed(1)}% ／ 最悪 ${worst[0]} ${(worst[1]*100).toFixed(1)}%`);
// 跨ぎ韻12小節の「もう一本」（跨ぎは2人が同じ韻で組むため素材が細い＝ここが最後に残る）
{ const r=[]; let w=['',0];
  for(const a of ids) for(const b of ids){ if(a===b) continue; let sh=0,n=0;
    for(let s=0;s<20;s++){ sb2.CP_RECENT.clear();
      const b1=sb2.corpusBattle(a,b,3,(s*7919)>>>0,true); if(!b1) continue; b1.used.forEach(c=>sb2.CP_RECENT.add(c));
      const b2=sb2.corpusBattle(a,b,3,(s*7919+1)>>>0,true); if(!b2) continue;
      const u=new Set(b1.used); sh+=b2.used.filter(c=>u.has(c)).length; n+=b2.used.length; }
    const x=n?sh/n:0; r.push([a+'>'+b,x]); if(x>w[1]) w=[a+'>'+b,x]; }
  console.log(`  跨ぎ12小節の「もう一本」: 平均 ${(r.reduce((s,[,x])=>s+x,0)/r.length*100).toFixed(1)}% ／ 最悪 ${w[0]} ${(w[1]*100).toFixed(1)}%`);
  if(process.env.DETAIL) console.log('   '+r.sort((p,q)=>q[1]-p[1]).map(([k,x])=>k+' '+(x*100).toFixed(0)+'%').join(' / ')); }
const ng = dupEnd||dupAll||badHead||resp||multiTheme||(crossHit<crossR-missSum);
console.log(ng?'要修正':'✅ 組み替え規則すべて適合');
