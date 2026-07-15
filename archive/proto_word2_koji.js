// 方式A・単語韻v2（麹菌）：2母音許容＋行末以外(句頭/句中)でも踏む
// 各行は R() で韻語を複数マーク（位置自由）。1バース=同ファミリー4行→バース内の全韻語が同じ末尾2母音で踏む。
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={
 "麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","種麹":"たねこうじ","米麹":"こめこうじ","寒造り":"かんづくり","蔵付き":"くらつき",
 "精米":"せいまい","蒸米":"むしまい","酒米":"さかまい","掛米":"かけまい","純米":"じゅんまい",
 "突き破精":"つきはぜ","総破精":"そうはぜ","甘酒":"あまざけ","樽酒":"たるざけ",
};
const sig2=w=>{const y=YOMI[w]||w;return vw(y).slice(-2);};

const koji={name:"麹菌",emoji:"🌾",wordRhyme:true,families:{
  ui:[ // 麹/杜氏/黄麹/種麹/米麹/寒造り/蔵付き（末尾 u,i）※韻語は句頭・句中に配置
    `${R("麹")}が糖化 まかせておけ／${R("杜氏")}の采配 陰で支える`,
    `${R("種麹")}ふりかけ 命を吹き込み／${R("黄麹")}色づき 蔵を染める`,
    `${R("米麹")}仕込んで 甘み湧かせ／${R("寒造り")}の朝 湯気を立てる`,
    `${R("蔵付き")}の菌も 従えて／その${R("麹")}の実力 見せつける`,
    `${R("杜氏")}が指させば 蔵が動く／その${R("種麹")}こそ すべての源`,
  ],
  ai:[ // 精米/蒸米/酒米/掛米/純米（末尾 a,i）※句中で踏む
    `${R("精米")}で磨いた白い米／${R("蒸米")}に化けて 芯まで溶ける`,
    `${R("酒米")}を選び抜いて／${R("掛米")}に回す 惜しみなく`,
    `${R("純米")}名乗る資格／その${R("酒米")}を活かす技`,
    `${R("蒸米")}のさばけ抜群／${R("精米")}の精度も 一級品`,
    `${R("掛米")}も麹も 俺が仕上げ／${R("精米")}あっての 良い酒米`,
  ],
  ae:[ // 突き破精/総破精/甘酒/樽酒（末尾 a,e）
    `${R("突き破精")}で攻める吟醸／${R("総破精")}で組む 濃い酒母`,
    `${R("甘酒")}にも化ける糖化／${R("総破精")}が生む 深い旨味`,
    `${R("樽酒")}の香りも 下地は米／${R("突き破精")}の技が 効いている`,
    `${R("総破精")}極めて 旨味を厚く／${R("甘酒")}みたいに 甘く優しく`,
  ],
}};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function buildVerse(c,rnd){const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const pool=c.families[key].slice();const out=[];for(let i=0;i<4;i++)out.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);return{key,lines:out};}

// 検証：各行の全韻語がキー(末尾2母音)一致 & バース内全韻語一致
let ok=0,ck=0,fails=[];
for(const key in koji.families)for(const line of koji.families[key]){
  const gs=segsOf(line);ck++;
  if(gs.length>=2 && gs.every(w=>sig2(w)===key))ok++;else fails.push(`[${key}] ${gs.map(w=>w+"("+sig2(w)+")").join(" / ")}`);
}
console.log(`行内 全韻語一致(末尾2母音): ${ok}/${ck} (${Math.round(ok/ck*100)}%)`);
let vok=0,vck=0,rc=0,rw=0;
for(let s=1;s<=6000;s++){const{key,lines}=buildVerse(koji,rng(s));let all=true;for(const l of lines){const gs=segsOf(l);rc+=gs.length;for(const w of gs){if(sig2(w)!==key){all=false;rw++;}}}vck++;if(all)vok++;}
console.log(`生成バース 全韻語そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%) | 総韻語数:${rc} 不一致:${rw}`);
if(fails.length){console.log("--- NG ---");fails.forEach(x=>console.log("  "+x));}
console.log("\n=== サンプル（韻語＝句頭/句中でも踏む）===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
[5,23,71].forEach(s=>{const{key,lines}=buildVerse(koji,rng(s));console.log(`\n[単語韻:-${key}] 〔〕内が韻語`);lines.forEach(l=>console.log("  "+mark(l)));});
