// 方式A・単語韻 プロトタイプ（麹菌）
// 各行 = `前半 … ${R(語A)}／後半 … ${R(語B)}`  語A/語Bは内容語(名詞中心)で、末尾3母音が一致＝単語で踏む。
// ファミリーキー＝行末語の末尾3母音シグネチャ。1バース=同キーから4行→行末が単語で固く踏む。

const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
// 行末語の読み辞書（母音判定用。表記→よみ）
const YOMI={
 "麹":"こうじ","杜氏":"とうじ","甑":"こしき","もろみ":"もろみ","生酛":"きもと",
 "酒米":"さかまい","山廃":"やまはい","精米":"せいまい","蒸米":"むしまい","純米":"じゅんまい",
 "乳酸菌":"にゅうさんきん","精米歩合":"せいまいぶあい",
 "カプロン酸":"かぷろんさん","無濾過":"むろか","糖化":"とうか",
 "火入れ":"ひいれ","櫂入れ":"かいいれ",
 "突き破精":"つきはぜ","総破精":"そうはぜ",
 "心白":"しんぱく","蔵付き":"くらつき",
 "麹室":"こうじむろ","黄麹":"きこうじ","種麹":"たねこうじ",
};
function sig(word){ // 表記から末尾3母音
  const y=YOMI[word]||word; const v=vw(y); return v.slice(-3);
}

// --- 麹菌 単語韻ファミリー ---
// oui系(…o,u,i)：杜氏/麹/黄麹/種麹  / iai系：精米/蒸米  / aai系：酒米/山廃  / oua系:糖化 …等
const koji = { name:"麹菌", emoji:"🌾",
  families:{
    oui:[ // 麹・杜氏・黄麹・種麹（末尾 o,u,i）
      `蔵を仕切るは 采配の ${R("杜氏")}／糖化まかせろ 蒸米と ${R("麹")}`,
      `胞子ふりかけ 起こすは ${R("種麹")}／黄金に色づく 我らが ${R("黄麹")}`,
      `製麹三日 育てる ${R("麹")}／その采配さえ 動かす ${R("杜氏")}`,
      `室に籠って 仕上げる ${R("黄麹")}／糖化の主役は やっぱり ${R("麹")}`,
    ],
    iai:[ // 精米・蒸米（末尾 i,a,i）
      `磨いて削って 生きる ${R("精米")}／蒸気で化かす さばけの ${R("蒸米")}`,
      `外硬内軟 狙うは ${R("蒸米")}／その前提だぜ 丁寧な ${R("精米")}`,
      `芯まで通せ 理想の ${R("蒸米")}／削り極めろ 攻めの ${R("精米")}`,
      `雑味を落とせ 磨きの ${R("精米")}／糖化を待つのは 蒸れた ${R("蒸米")}`,
    ],
    aai:[ // 酒米・山廃（末尾 a,a,i）
      `削って蒸して 迎える ${R("酒米")}／酸で攻めても 支える ${R("山廃")}`,
      `糖化の相手は 磨いた ${R("酒米")}／乳酸まかせの 古式 ${R("山廃")}`,
      `心白狙って 選ぶ ${R("酒米")}／深み出したきゃ 添えろ ${R("山廃")}`,
      `菌糸を伸ばすは 蒸れた ${R("酒米")}／生酛速醸 越える ${R("山廃")}`,
    ],
  }
};

// --- 検証 ---
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function buildVerse(c,rnd){const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const pool=c.families[key].slice();const out=[];for(let i=0;i<4;i++)out.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);return{key,lines:out};}

let ok=0,ck=0,fails=[];
for(const key in koji.families)for(const line of koji.families[key]){
  const [a,b]=segsOf(line);ck++;
  const sa=sig(a),sb=sig(b);
  if(sa===key&&sb===key)ok++;else fails.push(`[${key}] ${a}(${sa}) / ${b}(${sb})`);
}
console.log(`内部・単語韻（行末2語の末尾3母音=キー）: ${ok}/${ck} (${Math.round(ok/ck*100)}%)`);

let vok=0,vck=0,vf=[];
for(let s=1;s<=5000;s++){const{key,lines}=buildVerse(koji,rng(s));const ends=lines.map(l=>sig(segsOf(l)[1]));vck++;if(ends.every(e=>e===key))vok++;else if(vf.length<5)vf.push(`${key} ${ends}`);}
console.log(`生成バース 行末AAAA(単語末尾3母音): ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
if(fails.length){console.log("--- 内部NG ---");fails.forEach(x=>console.log("  "+x));}
if(vf.length){console.log("--- AAAA NG ---");vf.forEach(x=>console.log("  "+x));}

console.log("\n=== サンプル（行末を単語で踏む）===");
const strip=s=>s.replace(/<[^>]+>/g,"");
[7,19,42].forEach(s=>{const{key,lines}=buildVerse(koji,rng(s));console.log(`\n[韻:-${key}]`);lines.forEach(l=>console.log("  "+strip(l)));});
