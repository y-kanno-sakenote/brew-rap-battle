// 単語韻v4（麹菌）：醸造用語 × 一般語 でも踏む（片方が固有名詞でなくてOK）
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={
 // 醸造用語
 "麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","種麹":"たねこうじ","米麹":"こめこうじ","寒造り":"かんづくり","蔵付き":"くらつき",
 "精米":"せいまい","蒸米":"むしまい","酒米":"さかまい","掛米":"かけまい","純米":"じゅんまい",
 "突き破精":"つきはぜ","総破精":"そうはぜ","甘酒":"あまざけ","樽酒":"たるざけ",
 // 一般語（韻用）
 "趣味":"しゅみ","軽い":"かるい","主義":"しゅぎ","本気":"ほんき","絶対":"ぜったい","うまい":"うまい","やばい":"やばい",
 "甘い":"あまい","乾杯":"かんぱい","天才":"てんさい","支え":"ささえ","栄え":"さかえ","答え":"こたえ","備え":"そなえ","前":"まえ",
};
const sig2=w=>{const y=YOMI[w]||w;return vw(y).slice(-2);};
// g:true は一般語を含む（混成韻）ことを示すメモ
const koji={name:"麹菌",emoji:"🌾",wordRhyme:true,families:{
  ui:[
    {p:"head", t:`${R("杜氏")}が指させ 蔵が動く／${R("麹")}が糖化 底を支える`},
    {p:"end",  t:`糖化まかせろ 蒸米と ${R("麹")}／采配ふるうは 蔵の ${R("杜氏")}`},
    {p:"multi",t:`${R("黄麹")}色づき ${R("種麹")}が舞い／${R("麹")}の一族 蔵に轟く`},
    {p:"mid",  t:`${R("杜氏")}の采配 蔵の要／麹づくりは ただの ${R("趣味")}じゃねぇ`},   // 杜氏×趣味
    {p:"end",  t:`温度を攻める 手つきは ${R("軽い")}／それでも中身は 硬派な ${R("麹")}`}, // 軽い×麹
    {p:"mid",  t:`${R("米麹")}仕込むが 遊びじゃねぇ／これが俺の 譲れぬ ${R("主義")}`},    // 米麹×主義
  ],
  ai:[
    {p:"head", t:`${R("精米")}で磨き 白さを出す／${R("蒸米")}で溶かす 芯の甘み`},
    {p:"multi",t:`${R("精米")}削り ${R("蒸米")}蒸らし／${R("掛米")}回して ${R("酒米")}活かす`},
    {p:"end",  t:`磨いた${R("精米")} 精度は ${R("絶対")}／仕上がる一杯 マジで ${R("うまい")}`}, // 精米×絶対, ×うまい
    {p:"mid",  t:`その${R("酒米")} 味は ${R("やばい")}／削り抜いたら もっと ${R("甘い")}`},    // 酒米×やばい×甘い
    {p:"end",  t:`原料選びは 一切 ${R("妥協ない")}／だから旨いぜ この ${R("酒米")}`},        // ない×酒米
  ],
  ae:[
    {p:"head", t:`${R("突き破精")}で攻める 華の吟醸／${R("総破精")}で組む 濃い酒母`},
    {p:"multi",t:`${R("総破精")}極め ${R("甘酒")}のよう／${R("突き破精")}効かせ ${R("樽酒")}に映え`},
    {p:"end",  t:`旨味を厚く 下から ${R("支え")}／濃醇仕上げる 俺の ${R("総破精")}`},        // 支え×総破精
    {p:"mid",  t:`${R("甘酒")}の甘さ 蔵の ${R("栄え")}／糖化の答えは この ${R("突き破精")}`}, // 甘酒×栄え×突き破精
  ],
}};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildVerse(c,rnd){const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const lines=c.families[key];const byPos={};lines.forEach(l=>{(byPos[l.p]=byPos[l.p]||[]).push(l);});const order=shuffle(["head","mid","end","multi"],rnd);const out=[],used=new Set();for(const p of order){if(byPos[p]){const cand=byPos[p].filter(l=>!used.has(l));if(cand.length){const pk=cand[Math.floor(rnd()*cand.length)];out.push(pk);used.add(pk);}}}const rest=shuffle(lines.filter(l=>!used.has(l)),rnd);while(out.length<4&&rest.length)out.push(rest.pop());return{key,lines:shuffle(out,rnd)};}

let ok=0,ck=0;
for(const k in koji.families)for(const l of koji.families[k]){const gs=segsOf(l.t);ck++;if(gs.length>=2&&gs.every(w=>sig2(w)===k))ok++;else console.log("NG",k,gs.map(w=>w+"("+sig2(w)+")"));}
console.log(`韻語一致(末尾2母音, 一般語含む): ${ok}/${ck} (${Math.round(ok/ck*100)}%)`);
let vok=0,vck=0;for(let s=1;s<=6000;s++){const{key,lines}=buildVerse(koji,rng(s));let all=true;for(const l of lines)for(const w of segsOf(l.t))if(sig2(w)!==key)all=false;vck++;if(all)vok++;}
console.log(`生成バース 韻そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
console.log("\n=== サンプル（醸造用語×一般語 混成韻）===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
[5,23,71,90].forEach(s=>{const{key,lines}=buildVerse(koji,rng(s));console.log(`\n[単語韻:-${key}]`);lines.forEach(l=>console.log(`  (${l.p}) ${mark(l.t)}`));});
