const fs = require('fs');
const html = fs.readFileSync('/Users/ymacmini/Documents/claudecode@macmini/dev/brew-rap-battle/index.html','utf8');
// <script> 内のエンジン部分（選択UI手前まで）を取り出して eval
const script = html.slice(html.indexOf('<script>')+8, html.indexOf('// ---- 選択UI ----'));
const sandbox = {};
const fn = new Function('sandbox', script + '\n; Object.assign(sandbox,{VOCAB_ATTRS,VOCAB,ROLE_WORDS,ROLE_SIG,ROLE_SOFT,softKey,FIGHTERS,vowels,yomiOf,buildVerse,rng,usableFrames,availableSigs});');
fn(sandbox);
const {VOCAB_ATTRS,VOCAB,ROLE_WORDS,ROLE_SIG,ROLE_SOFT,softKey,FIGHTERS,vowels,yomiOf,buildVerse,rng,availableSigs} = sandbox;
const sig3 = w => vowels(yomiOf(w)).slice(-3);

// ① 辞書の母音整合：役割内の全語が同一末尾3母音か（韻100%の土台）
let bad=0;
for(const r in ROLE_WORDS){
  const s = ROLE_SIG[r];
  for(const w of ROLE_WORDS[r]) if(sig3(w)!==s){ bad++; console.log(`  ✗ 役割 ${r}: ${w}(${sig3(w)}) ≠ ${s}`); }
}
console.log(`① 辞書母音整合: ${bad===0?'OK（全役割で末尾3母音一致）':bad+'件の不一致'}  / 総語数 ${Object.keys(VOCAB).length} / 役割 ${Object.keys(ROLE_WORDS).length} / バケット ${new Set(Object.values(ROLE_SIG)).size}`);

// 韻スロット語を抽出
const spanWords = html2 => [...html2.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(m=>m[1]);
const commonTail = (a,b)=>{let n=0;const va=vowels(a),vb=vowels(b);while(n<va.length&&n<vb.length&&va[va.length-1-n]===vb[vb.length-1-n])n++;return n;};
// 響き深さ: 近似母音クラス(i≈e/u≈o)で数えた共通末尾長。ただし最終母音は完全一致が条件
const NEARC={a:'a',i:'i',e:'i',u:'u',o:'u'};
const softTail = (a,b)=>{const va=vowels(a),vb=vowels(b);if(!va.length||!vb.length||va[va.length-1]!==vb[vb.length-1])return 0;let n=0;while(n<va.length&&n<vb.length&&NEARC[va[va.length-1-n]]===NEARC[vb[vb.length-1-n]])n++;return n;};

// ② キャラごとに大量生成して計測
console.log('\n② キャラ別メトリクス（各600バース）:');
for(const id in FIGHTERS){
  const me=FIGHTERS[id]; let lines=0, rhymeOK=0, endRhyme=0, deepSum=0, deepN=0, softDeepSum=0, nearLines=0, pairLines=0, verses=0, wideV=0; const cnt={};
  for(let i=0;i<600;i++){
    const {key,fam,wide,lines:ls}=buildVerse(me,rng((i*2654435761)>>>0));
    verses++; if(wide) wideV++;
    for(const ln of ls){
      lines++;
      const ws=spanWords(ln);
      ws.forEach(w=>cnt[w]=(cnt[w]||0)+1);
      // 韻100%：この行の全スロット語が verse の踏みキー fam(2母音=緩い / 3母音=深い)で踏めている
      if(ws.length && ws.every(w=>softKey(sig3(w)).endsWith(fam))) rhymeOK++;
      // 行末韻：行が韻スロット（rhyme span）で終わる
      if(/<\/span>\s*$/.test(ln.trim())) endRhyme++;
      // 深さ：行内に2スロットあれば共通末尾（完全一致）と響き末尾（近似クラス）、1スロットなら key長(=3)
      if(ws.length>=2){
        pairLines++;
        deepSum+=commonTail(yomiOf(ws[0]),yomiOf(ws[1]));
        softDeepSum+=softTail(yomiOf(ws[0]),yomiOf(ws[1]));
        if(sig3(ws[0])!==sig3(ws[1])) nearLines++;           // 近似韻（完全一致でないが響きで踏む）
        deepN++;
      }
      else if(ws.length===1){ deepSum+=3; softDeepSum+=3; deepN++; }
    }
  }
  const tot=Object.values(cnt).reduce((a,b)=>a+b,0);
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
    // ---- 使い方ロジックの指標（属性表があるときだけ）: 自語率 / 工程逆行率 / パンチライン固有率 ----
  let uMine=0,uAll=0,uBack=0,uPairs=0,uPunch=0,uVerse=0;
  if(typeof VOCAB_ATTRS!=="undefined" && Object.keys(VOCAB_ATTRS).length){
    const ORD=["原料米","洗米蒸米","製麹","酒母","醪","上槽貯蔵","香味製品"]; const mine=({koji:"麹菌",yeast:"酵母",toji:"杜氏",lactic:"乳酸菌",rice:"酒米"})[id];
    for(let i=0;i<600;i++){ const v=buildVerse(me,rng((i*2654435761)>>>0)); uVerse++;
      const perLine=v.lines.map(l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(m=>m[1]));
      let prev=-1;
      perLine.forEach((ws,li)=>{ let mx=-1;
        ws.forEach(w=>{ const a=VOCAB_ATTRS[w]||{}; uAll++; if(!a.owner||a.owner==="共通"||a.owner.split("/").includes(mine)) uMine++;
          const k=ORD.indexOf(a.stage); if(k>mx) mx=k; });
        if(mx>=0){ if(prev>=0){ uPairs++; if(mx<prev) uBack++; } prev=mx; }
        if(li===perLine.length-1 && ws.some(w=>["固有","専門"].includes((VOCAB_ATTRS[w]||{}).spec))) uPunch++;
      });
    }
    console.log(`  ${me.name.padEnd(5)} | 自語率:${(100*uMine/Math.max(1,uAll)).toFixed(0)}% | 工程逆行率:${(100*uBack/Math.max(1,uPairs)).toFixed(0)}% | パンチライン固有率:${(100*uPunch/Math.max(1,uVerse)).toFixed(0)}%`);
  }
  console.log(`  ${me.name.padEnd(5)} | 韻100%:${(100*rhymeOK/lines).toFixed(1)}% | 行末韻:${(100*endRhyme/lines).toFixed(0)}% | 深さ(響き):${(softDeepSum/deepN).toFixed(2)} | 緩い韻(2母音)率:${(100*wideV/verses).toFixed(0)}% | 使用語種:${Object.keys(cnt).length} | 最頻語:${top[0]}(${(100*top[1]/tot).toFixed(1)}%)`);
}

// ③ クロス網羅：全10対戦ペアで共通母音バケットがあるか
console.log('\n③ キャラ跨ぎ韻 全ペア網羅:');
const ids=Object.keys(FIGHTERS); let pairs=0, cross=0;
for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  pairs++;
  const sh=availableSigs(FIGHTERS[ids[i]]).filter(s=>availableSigs(FIGHTERS[ids[j]]).includes(s));
  if(sh.length) cross++; else console.log(`  ✗ ${FIGHTERS[ids[i]].name} × ${FIGHTERS[ids[j]].name} 共通なし`);
}
console.log(`  ${cross}/${pairs} ペアがキャラ跨ぎ可能 ${cross===pairs?'（全ペア維持）':''}`);

// ④ 新規追加の反映確認
console.log('\n④ 追加語の反映:');
['生麹','黄麹菌','花酵母','協会酵母','甘口','銘柄','杉玉'].forEach(w=>{
  console.log(`  ${w}: ${VOCAB[w]?('役割'+VOCAB[w].r+' / 末尾'+sig3(w)):'✗未登録'}`);
});
console.log(`  杜氏 kanban 保有: ${FIGHTERS.toji.roles.includes('kanban')}`);
