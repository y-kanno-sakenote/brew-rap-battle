// 厳密押韻ルールベース プロトタイプ（麹菌1体）
// 韻ファミリー方式：1バース=1ファミリーから選抜。全行の前半末尾/後半末尾/行末を末尾2母音で固定一致させる。

// --- かな→母音 ---
const V={};
const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷっぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows) for(const c of rows[v]) V[c]=v;
// 母音列（ー=直前延長, ん/っは非母音として無視, 漢字は?）
function vowels(seg){const o=[];for(const ch of seg){if(V[ch]&&ch!=="っ"&&ch!=="ッ")o.push(V[ch]);else if(ch==="ー"||ch==="〜"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o;}
function tail2(seg){const v=vowels(seg);return v.slice(-2).join("");}

// --- 韻タグ ---
const R=s=>`<span class="rhyme">${s}</span>`;

// --- 麹菌の韻ファミリー ---
// 各行 = `前半 ${R(末尾A)}／後半 ${R(末尾B)}`  ※末尾A/Bともファミリーの末尾2母音で終わる（かな表記で韻を可視化）
const koji = {
  name:"麹菌", emoji:"🌾",
  families:{
    ua:[ // 末尾2母音 = u,a （〜んだ 系）
      `蒸米に菌糸 ${R("這わすんだ")}／糖化の魔法 俺が ${R("かますんだ")}`,
      `デンプン割って 糖 ${R("生むんだ")}／室の温度も 俺が ${R("組むんだ")}`,
      `破精を利かせ 芯まで ${R("食うんだ")}／甘い旨味 そこで ${R("作るんだ")}`,
      `一麹二酛 頂点 ${R("担うんだ")}／国菌の名を 背に ${R("背負うんだ")}`,
      `外硬内軟 選んで ${R("蒸すんだ")}／芯まで菌糸 深く ${R("攻めるんだ")}`,
      `酵素を湧かせ 旨味 ${R("盛るんだ")}／一麹の名 胸に ${R("刻むんだ")}`,
    ],
    ee:[ // 末尾2母音 = e,e （〜ねぇ 系）
      `製麹三日 隙を ${R("見せねぇ")}／糖化の主役 譲りゃ ${R("しねぇ")}`,
      `温度も湿度も 手を ${R("抜かねぇ")}／麹の底力 ぶれや ${R("しねぇ")}`,
      `突き破精なら 誰にも ${R("負けねぇ")}／グルコアミラーゼ 止まら ${R("ねぇ")}`,
      `種麹の血統 崩れ ${R("やしねぇ")}／製麹こそが 品質 ${R("裏切らねぇ")}`,
      `室の職人 妥協 ${R("しねぇ")}／破精の仕上げに 抜かり ${R("ねぇ")}`,
      `俺を舐めたら 酒が ${R("危ねぇ")}／糖化なくして 発酵 ${R("できやしねぇ")}`,
    ],
    oo:[ // 末尾2母音 = o,o （〜ろう/〜そう 系）
      `蒸米蒸せば 甘く ${R("なるだろう")}／麹のちからを 見せて ${R("やろう")}`,
      `破精づけ極めて 芯まで ${R("通そう")}／濃醇めがけて 酒母 ${R("組もう")}`,
      `一夜二夜 麹室 ${R("守ろう")}／糖化の頂 いざ ${R("登ろう")}`,
    ],
  }
};

// --- バース生成：1ファミリー選択→重複なく4行 ---
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function buildVerse(char, rnd){
  const keys=Object.keys(char.families).filter(k=>char.families[k].length>=4);
  const fam=keys[Math.floor(rnd()*keys.length)];
  const pool=char.families[fam].slice();
  const lines=[];
  for(let i=0;i<4;i++){const j=Math.floor(rnd()*pool.length);lines.push(pool.splice(j,1)[0]);}
  return {fam, lines};
}
function segsOf(line){return[...line.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);}

// --- 検証：全行の前半末尾/後半末尾/行末がファミリーキーに一致するか ---
let checks=0, ok=0, fails=[];
// (a) 各行内：前半末尾A・後半末尾B が末尾2母音一致
for(const fam in koji.families){
  for(const line of koji.families[fam]){
    const [a,b]=segsOf(line);
    checks++; if(tail2(a)===fam && tail2(b)===fam) ok++; else fails.push(`内部韻NG [${fam}] ${a}(${tail2(a)}) / ${b}(${tail2(b)})`);
  }
}
// (b) 生成バース：4行の行末(後半末尾B)がすべて同一キー＝AAAA
let vChecks=0, vOk=0;
for(let s=1;s<=5000;s++){
  const {fam,lines}=buildVerse(koji, rng(s));
  const ends=lines.map(l=>tail2(segsOf(l)[1]));
  vChecks++; if(ends.every(e=>e===fam)) vOk++; else if(fails.length<5) fails.push(`行末AAAA NG seed${s} ${fam} ${ends}`);
}

console.log("=== 内部韻（前半末尾＝後半末尾, 末尾2母音） ===");
console.log(`  ${ok}/${checks} 行が一致 (${Math.round(ok/checks*100)}%)`);
console.log("=== 生成バース 行末AAAA（末尾2母音そろい） ===");
console.log(`  ${vOk}/${vChecks} バースが完全一致 (${Math.round(vOk/vChecks*100)}%)`);
if(fails.length){console.log("--- 不一致 ---");fails.slice(0,8).forEach(f=>console.log("  "+f));}

console.log("\n=== サンプル生成 ===");
const strip=s=>s.replace(/<[^>]+>/g,"");
[11,22,33].forEach(s=>{const{fam,lines}=buildVerse(koji,rng(s));console.log(`\n[ファミリー:${fam}]`);lines.forEach(l=>console.log("  "+strip(l)));});
