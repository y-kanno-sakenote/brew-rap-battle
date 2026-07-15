// テンプレv2（麹菌）：韻(母音)＋役割(意味タイプ)の二軸でスロットを埋め、文脈ズレを解消。
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const YOMI={"麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","白麹":"しろこうじ","黒麹":"くろこうじ","種麹":"たねこうじ","米麹":"こめこうじ","王子":"おうじ","講師":"こうじ","精米":"せいまい","蒸米":"むしまい","苦味":"にがみ","気合い":"きあい","白桃":"はくとう","黄桃":"おうとう","吟醸香":"ぎんじょうこう","原料香":"げんりょうこう"};
const sig3=w=>vw(YOMI[w]||w).slice(-3);

// バケット＝母音キー。各バケットは「役割→語リスト」。役割で意味タイプを区別。
const BANK={
 oui:{ koji:["麹","黄麹","白麹","黒麹","種麹","米麹"], person:["杜氏","王子","講師"] },   // 末尾 o,u,i
 iai:{ proc:["精米","蒸米"], taste:["苦味"], spirit:["気合い"] },                          // 末尾 i,a,i
 uou:{ fruit:["白桃","黄桃"], aroma:["吟醸香","原料香"] },                                  // 末尾 u,o,u
};
// フレーム：ra/rb がスロットの必要役割。bucketにその役割語があるものだけ使う。
const FRAMES=[
 // oui
 {b:"oui",p:"head", ra:"koji",  rb:"koji",  f:`{a}に{b} 蔵に舞わせ／糖化の采配 隙は見せねぇ`},
 {b:"oui",p:"mid",  ra:"koji",  rb:"koji",  f:`研ぎ澄ました{a} 極めた{b}／蔵の奥から 攻め続ける`},
 {b:"oui",p:"multi",ra:"koji",  rb:"koji",  f:`{a}も{b}も 俺が束ねる／製麹こそが 品質決める`},
 {b:"oui",p:"head", ra:"person",rb:"koji",  f:`{a}が采配 蔵を仕切る／育て上げるは 我が{b}`},
 {b:"oui",p:"end",  ra:"person",rb:"koji",  f:`糖化の主役は 育てた{b}／それを束ねる 蔵の{a}`},
 {b:"oui",p:"end",  ra:"person",rb:"person",f:`蔵に号令 かける{a}／誰もが認める 我が{b}`},
 // iai
 {b:"iai",p:"head", ra:"proc",  rb:"proc",  f:`{a}を磨き {b}を蒸らし／糖化の下地 隙は見せねぇ`},
 {b:"iai",p:"multi",ra:"proc",  rb:"proc",  f:`{a}に{b} 込める技／製麹こそが 品質決める`},
 {b:"iai",p:"end",  ra:"proc",  rb:"taste", f:`さばけ極めた この{a}／雑味残さぬ 抑えた{b}`},
 {b:"iai",p:"mid",  ra:"proc",  rb:"taste", f:`磨いた{a} 消した{b}／芯まで通して 綺麗に仕上げ`},
 {b:"iai",p:"head", ra:"proc",  rb:"spirit",f:`{a}削るは 職人の{b}／雑味を落として 芯を残す`},
 {b:"iai",p:"end",  ra:"proc",  rb:"spirit",f:`全部込めて 仕上げる{a}／これが職人 俺の{b}`},
 // uou
 {b:"uou",p:"head", ra:"aroma", rb:"fruit", f:`{a}立ち上り 甘き{b}／糖化が生むは 芳しき香`},
 {b:"uou",p:"end",  ra:"aroma", rb:"fruit", f:`蒸米溶かして 生む{a}／鼻をくすぐる 熟れた{b}`},
 {b:"uou",p:"mid",  ra:"aroma", rb:"fruit", f:`その{a} 香る{b}／糖化の設計 俺が描く`},
 {b:"uou",p:"multi",ra:"aroma", rb:"aroma", f:`{a}に{b} 立ちのぼる／糖化の土台 これぞ底力`},
 {b:"uou",p:"multi",ra:"fruit", rb:"fruit", f:`{a}に{b} 香り重ね／甘き誘惑 客を酔わす`},
];

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function fillable(bucket,fr){const roles=BANK[bucket];const A=roles[fr.ra],B=roles[fr.rb];if(!A||!B)return false;if(fr.ra===fr.rb)return A.length>=2;return A.length>=1&&B.length>=1;}
function fillFrame(bucket,fr,rnd){const roles=BANK[bucket];if(fr.ra===fr.rb){const p=shuffle(roles[fr.ra],rnd);return {t:fr.f.replace("{a}",R(p[0])).replace("{b}",R(p[1])),words:[p[0],p[1]]};}const a=shuffle(roles[fr.ra],rnd)[0],b=shuffle(roles[fr.rb],rnd)[0];return {t:fr.f.replace("{a}",R(a)).replace("{b}",R(b)),words:[a,b]};}
function buildVerse(rnd){
  const key=Object.keys(BANK)[Math.floor(rnd()*Object.keys(BANK).length)];
  const pool=FRAMES.filter(fr=>fr.b===key&&fillable(key,fr));
  const byPos={};pool.forEach(f=>{(byPos[f.p]=byPos[f.p]||[]).push(f);});
  const order=shuffle(["head","mid","end","multi"],rnd);
  const chosen=[],used=new Set();
  for(const p of order){const cand=(byPos[p]||[]).filter(f=>!used.has(f));if(cand.length){const fr=cand[Math.floor(rnd()*cand.length)];chosen.push(fr);used.add(fr);}}
  const rest=shuffle(pool.filter(f=>!used.has(f)),rnd);
  while(chosen.length<4&&rest.length)chosen.push(rest.pop());
  while(chosen.length<4)chosen.push(pool[Math.floor(rnd()*pool.length)]);
  return {key,lines:shuffle(chosen,rnd).map(fr=>fillFrame(key,fr,rnd))};
}

// バンク自己チェック
let bad=0;for(const k in BANK)for(const r in BANK[k])for(const w of BANK[k][r])if(sig3(w)!==k){console.log("不整合",k,r,w,sig3(w));bad++;}
console.log("バンク自己チェック:",bad===0?"OK":bad+"件");
// 各バケットが4行組めるか
for(const k in BANK){const n=FRAMES.filter(fr=>fr.b===k&&fillable(k,fr)).length;console.log(`  ${k}: 使用可能フレーム ${n}`);}
// 韻＆多様性
let vok=0,vck=0,uL=new Set(),uV=new Set();
for(let s=1;s<=20000;s++){const{key,lines}=buildVerse(rng(s));vck++;let all=true;for(const l of lines)for(const w of l.words)if(sig3(w)!==key)all=false;if(all)vok++;lines.forEach(l=>uL.add(l.t.replace(/<[^>]+>/g,"")));uV.add(lines.map(l=>l.t.replace(/<[^>]+>/g,"")).join("|"));}
console.log(`韻100%: ${vok}/${vck} (${Math.round(vok/vck*100)}%) | ユニーク行:${uL.size} | ユニークバース:${uV.size}`);
console.log("\n=== サンプル（役割一致で文脈も自然）===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
[3,17,42,88].forEach(s=>{const{key,lines}=buildVerse(rng(s));console.log(`\n[-${key}]`);lines.forEach(l=>console.log(`  ${mark(l.t)}`));});
