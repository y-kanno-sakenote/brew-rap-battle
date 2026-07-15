// テンプレート＋スロット方式（麹菌）：フレームに韻語を差し込んで毎回違う文を生成。韻は母音バケットで保証。
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const sig3=(w,Y)=>{const y=Y[w]||w;return vw(y).slice(-3);};

// ── 麹菌の単語バンク（母音シグネチャ別）＋読み ──
const YOMI={
 "麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","白麹":"しろこうじ","黒麹":"くろこうじ","種麹":"たねこうじ","米麹":"こめこうじ","王子":"おうじ","講師":"こうじ","同時":"どうじ","工事":"こうじ",
 "精米":"せいまい","蒸米":"むしまい","苦味":"にがみ","気合い":"きあい","以外":"いがい",
 "白桃":"はくとう","黄桃":"おうとう","吟醸香":"ぎんじょうこう","原料香":"げんりょうこう","構造":"こうぞう","妄想":"もうそう",
};
const BANK={
 oui:["麹","杜氏","黄麹","白麹","黒麹","種麹","米麹","王子","講師","同時","工事"],
 iai:["精米","蒸米","苦味","気合い","以外"],
 uou:["白桃","黄桃","吟醸香","原料香","構造","妄想"],
};
// ── フレーム：{a}{b} が韻スロット（同じ母音バケットの2語が入る）。前半/後半に配置、位置バリエ内包 ──
// pos は主たる韻語の位置ヒント（表示・分散用）
const FRAMES=[
 // head（句頭で踏む）
 {p:"head", f:`{a}を操り 攻める毎日／{b}を極めて 頂を取る`},
 {p:"head", f:`{a}を掲げ 蔵に立つ／{b}を背負い 前へ出る`},
 {p:"head", f:`{a}を武器に 攻め上がる／{b}で勝負 名を上げる`},
 {p:"head", f:`{a}が主役 蔵を染める／{b}を従え 頂を狙う`},
 // mid（句中で踏む）
 {p:"mid",  f:`その{a} 蔵の{b}／糖化の設計 俺が描く`},
 {p:"mid",  f:`磨いた{a} 芯の{b}／糖化まかせろ 隙は見せねぇ`},
 {p:"mid",  f:`狙うは{a} 極めた{b}／製麹の技 俺の誇り`},
 {p:"mid",  f:`研いだ{a} 秘めた{b}／蔵の奥から 攻め続ける`},
 // end（句尾で踏む）
 {p:"end",  f:`製麹三日 育てる{a}／その実力は 蔵の{b}`},
 {p:"end",  f:`蒸米抱いて 生み出す{a}／甘き香りは まるで{b}`},
 {p:"end",  f:`一途に仕込む この{a}／最後に立つのは 我が{b}`},
 {p:"end",  f:`全部背負って 見せる{a}／誰にも負けねぇ この{b}`},
 // multi（複数箇所で踏む）
 {p:"multi",f:`{a}に{b} 舞う蔵の中／攻める製麹 止まりゃしねぇ`},
 {p:"multi",f:`{a}と{b} 束ねる俺／製麹こそが 品質決める`},
 {p:"multi",f:`{a}も{b}も 掌の上／糖化の頂 俺が獲る`},
 {p:"multi",f:`{a}から{b} 繋ぐ一手／蔵の名前を 背負って立つ`},
];

// ── バンク自己チェック：各語が所属バケットの3母音か ──
let bankBad=0;
for(const k in BANK)for(const w of BANK[k]){if(sig3(w,YOMI)!==k){console.log(`  バンク不整合: [${k}] ${w} → ${sig3(w,YOMI)}`);bankBad++;}}
console.log(`バンク自己チェック: ${bankBad===0?"OK (全語が所属バケットと一致)":bankBad+"件の不整合"}`);

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick2(arr,rnd){const a=shuffle(arr,rnd);return [a[0],a[1]];}

// 1行生成：バケットkey・フレームを与え、韻語2語を差し込む
function makeLine(key,frame,rnd){
  const [w1,w2]=pick2(BANK[key],rnd);
  return {p:frame.p, t:frame.f.replace("{a}",R(w1)).replace("{b}",R(w2)), words:[w1,w2]};
}
// 1バース：バケット選択→位置を散らした4フレーム→各行生成
function buildVerse(rnd){
  const key=Object.keys(BANK)[Math.floor(rnd()*Object.keys(BANK).length)];
  const byPos={};FRAMES.forEach(f=>{(byPos[f.p]=byPos[f.p]||[]).push(f);});
  const order=shuffle(["head","mid","end","multi"],rnd);
  const chosen=[];const used=new Set();
  for(const p of order){const cand=byPos[p].filter(f=>!used.has(f));if(cand.length){const fr=cand[Math.floor(rnd()*cand.length)];chosen.push(fr);used.add(fr);}}
  while(chosen.length<4){const fr=FRAMES[Math.floor(rnd()*FRAMES.length)];chosen.push(fr);}
  return {key, lines:chosen.map(fr=>makeLine(key,fr,rnd))};
}

// ── 検証1：韻100%（各行の2韻語が同じ3母音）＆バース内そろい ──
let vok=0,vck=0,rw=0;
for(let s=1;s<=20000;s++){const{key,lines}=buildVerse(rng(s));let all=true;for(const l of lines)for(const w of l.words)if(sig3(w,YOMI)!==key){all=false;rw++;}vck++;if(all)vok++;}
console.log(`生成バース 3母音そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%) 不一致:${rw}`);

// ── 検証2：多様性（ユニークな行・バースの数）──
const uniqLines=new Set(),uniqVerses=new Set();
for(let s=1;s<=20000;s++){const{lines}=buildVerse(rng(s*7+1));lines.forEach(l=>uniqLines.add(l.t.replace(/<[^>]+>/g,"")));uniqVerses.add(lines.map(l=>l.t.replace(/<[^>]+>/g,"")).join("|"));}
console.log(`ユニーク行数: ${uniqLines.size} / ユニークバース数: ${uniqVerses.size}（20000試行中）`);
// 理論上限の目安
let lineCap=0;for(const k in BANK){const n=BANK[k].length;lineCap+=FRAMES.length*n*(n-1);}
console.log(`理論上の行バリエーション目安: 約${lineCap}通り（フレーム8 × 各バケットの語順列）`);

console.log("\n=== サンプル（毎回違う文）===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
[3,17,42,88].forEach(s=>{const{key,lines}=buildVerse(rng(s));console.log(`\n[-${key}]`);lines.forEach(l=>console.log(`  (${l.p}) ${mark(l.t)}`));});
