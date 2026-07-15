// 単語韻v5（麹菌）：インを固く＝末尾3母音一致。醸造語×一般語(homophone級含む)＋位置分散。
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={
 "麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","種麹":"たねこうじ","米麹":"こめこうじ",
 "精米":"せいまい","蒸米":"むしまい","酒米":"さかまい","山廃":"やまはい",
 // 一般語（3母音で踏む）
 "王子":"おうじ","同時":"どうじ","工事":"こうじ","講師":"こうじ",
 "甘い":"あまい","やばい":"やばい","乾杯":"かんぱい","万歳":"ばんざい",
 "気合い":"きあい","みたい":"みたい",
};
const sig3=w=>{const y=YOMI[w]||w;return vw(y).slice(-3);};
const koji={name:"麹菌",emoji:"🌾",wordRhyme:true,rhymeLen:3,families:{
  oui:[ // 杜氏/麹/黄麹/種麹/米麹 × 王子/同時/工事/講師（末尾 o,u,i）
    {p:"head", t:`${R("杜氏")}が采配 まるで${R("王子")}／蔵を統べる者 それが俺だ`},
    {p:"end",  t:`糖化の主役は やはり${R("麹")}／製麹極めた 蔵の${R("講師")}`},
    {p:"multi",t:`${R("黄麹")}に${R("種麹")} 舞う${R("麹")}／糖化と発酵 進む${R("同時")}`},
    {p:"mid",  t:`${R("米麹")}仕込みは 命の${R("工事")}／手を抜きゃすべて 台無しだ`},
    {p:"head", t:`${R("種麹")}起こすは 蔵の${R("王子")}／胞子ふりかけ 命を宿す`},
    {p:"end",  t:`采配ふるうは 蔵の${R("杜氏")}／隣を支える 我が${R("麹")}`},
  ],
  aai:[ // 酒米/山廃 × 甘い/やばい/乾杯/万歳（末尾 a,a,i）
    {p:"head", t:`${R("酒米")}削れば 香り${R("やばい")}／磨き抜いたら もっと化ける`},
    {p:"end",  t:`荒ぶる発酵 抑える${R("山廃")}／仕上がりゃ全員 一斉${R("乾杯")}`},
    {p:"mid",  t:`その${R("酒米")} 喉越し${R("甘い")}／糖化まかせりゃ 旨さ倍増`},
    {p:"multi",t:`磨いた${R("酒米")} 香り${R("やばい")}／深き${R("山廃")} 蔵に${R("万歳")}`},
    {p:"head", t:`${R("山廃")}仕込みで 深み${R("やばい")}／乳酸まかせの 底力`},
    {p:"end",  t:`甘み引き出す 上等${R("酒米")}／飲めば思わず 叫ぶ${R("万歳")}`},
  ],
  iai:[ // 精米/蒸米 × 気合い/みたい（末尾 i,a,i）
    {p:"head", t:`${R("精米")}に懸ける 職人の${R("気合い")}／磨きの果ては 芸術${R("みたい")}`},
    {p:"multi",t:`${R("精米")}削り ${R("蒸米")}蒸らし／技はいつでも 全力${R("気合い")}`},
    {p:"end",  t:`さばけ極めて 仕上げる${R("蒸米")}／その集中は 鬼の${R("気合い")}`},
    {p:"mid",  t:`磨いた${R("精米")} 宝石${R("みたい")}／芯まで澄んで 一級品`},
    {p:"head", t:`${R("蒸米")}のさばけ 抜群${R("みたい")}／外硬内軟 これぞ${R("気合い")}`},
  ],
}};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildVerse(c,rnd){const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const lines=c.families[key];const byPos={};lines.forEach(l=>{(byPos[l.p]=byPos[l.p]||[]).push(l);});const order=shuffle(["head","mid","end","multi"],rnd);const out=[],used=new Set();for(const p of order){if(byPos[p]){const cand=byPos[p].filter(l=>!used.has(l));if(cand.length){const pk=cand[Math.floor(rnd()*cand.length)];out.push(pk);used.add(pk);}}}const rest=shuffle(lines.filter(l=>!used.has(l)),rnd);while(out.length<4&&rest.length)out.push(rest.pop());return{key,lines:shuffle(out,rnd)};}

let ok=0,ck=0;
for(const k in koji.families)for(const l of koji.families[k]){const gs=segsOf(l.t);ck++;if(gs.length>=2&&gs.every(w=>sig3(w)===k))ok++;else console.log("NG",k,gs.map(w=>w+"("+sig3(w)+")"));}
console.log(`韻語一致(末尾3母音=固い韻): ${ok}/${ck} (${Math.round(ok/ck*100)}%)`);
let vok=0,vck=0;for(let s=1;s<=6000;s++){const{key,lines}=buildVerse(koji,rng(s));let all=true;for(const l of lines)for(const w of segsOf(l.t))if(sig3(w)!==key)all=false;vck++;if(all)vok++;}
console.log(`生成バース 3母音そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
console.log("\n=== サンプル（固い3母音・混成韻）===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
[5,23,71].forEach(s=>{const{key,lines}=buildVerse(koji,rng(s));console.log(`\n[単語韻:-${key}]`);lines.forEach(l=>console.log(`  (${l.p}) ${mark(l.t)}`));});
