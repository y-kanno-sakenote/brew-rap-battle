// 単語韻v3（麹菌）：韻語の位置(head/mid/end/multi)をタグ付け→1バースで位置を散らして選ぶ
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={"麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","種麹":"たねこうじ","米麹":"こめこうじ","寒造り":"かんづくり","蔵付き":"くらつき","精米":"せいまい","蒸米":"むしまい","酒米":"さかまい","掛米":"かけまい","純米":"じゅんまい","突き破精":"つきはぜ","総破精":"そうはぜ","甘酒":"あまざけ","樽酒":"たるざけ"};
const sig2=w=>{const y=YOMI[w]||w;return vw(y).slice(-2);};
// p: 韻語位置 head=句頭 / mid=句中 / end=句尾 / multi=複数箇所
const koji={name:"麹菌",emoji:"🌾",wordRhyme:true,families:{
  ui:[
    {p:"head",t:`${R("杜氏")}が指させ 蔵が動く／${R("麹")}が糖化 底を支える`},
    {p:"end", t:`糖化まかせろ 蒸米と ${R("麹")}／采配ふるうは 蔵の ${R("杜氏")}`},
    {p:"mid", t:`その${R("種麹")}こそ 命の源／甘き${R("米麹")} 蔵を満たす`},
    {p:"multi",t:`${R("黄麹")}色づき ${R("種麹")}が舞い／${R("麹")}の一族 蔵に轟く`},
    {p:"head",t:`${R("米麹")}仕込んで 甘み湧かせ／${R("寒造り")}の朝 湯気を立てる`},
    {p:"end", t:`菌も従える 我らが ${R("蔵付き")}／実力見せるは やはり ${R("麹")}`},
  ],
  ai:[
    {p:"head",t:`${R("精米")}で磨き 白さを出す／${R("蒸米")}で溶かす 芯の甘み`},
    {p:"end", t:`選び抜いたは 上等な ${R("酒米")}／回して混ぜるは 蒸れた ${R("掛米")}`},
    {p:"mid", t:`その${R("純米")} 名乗る資格／磨きの${R("酒米")} 活かす技`},
    {p:"multi",t:`${R("精米")}削り ${R("蒸米")}蒸らし／${R("掛米")}回して ${R("酒米")}活かす`},
    {p:"head",t:`${R("蒸米")}のさばけ 抜群だぜ／${R("精米")}の精度 一級品`},
  ],
  ae:[
    {p:"head",t:`${R("突き破精")}で攻める 華の吟醸／${R("総破精")}で組む 濃い酒母`},
    {p:"end", t:`旨味を厚く 極める ${R("総破精")}／香ばしく仕上げ 攻める ${R("突き破精")}`},
    {p:"mid", t:`その${R("甘酒")} 糖化の証／杉の${R("樽酒")} 蔵の香り`},
    {p:"multi",t:`${R("総破精")}極め ${R("甘酒")}のよう／${R("突き破精")}効かせ ${R("樽酒")}に映え`},
  ],
}};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// 位置を散らして4行選抜
function buildVerse(c,rnd){
  const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);
  const key=keys[Math.floor(rnd()*keys.length)];
  const lines=c.families[key];
  const byPos={};lines.forEach(l=>{(byPos[l.p]=byPos[l.p]||[]).push(l);});
  const order=shuffle(["head","mid","end","multi"],rnd);
  const out=[];const used=new Set();
  for(const p of order){if(byPos[p]){const cand=byPos[p].filter(l=>!used.has(l));if(cand.length){const pick=cand[Math.floor(rnd()*cand.length)];out.push(pick);used.add(pick);}}}
  const rest=shuffle(lines.filter(l=>!used.has(l)),rnd);
  while(out.length<4&&rest.length)out.push(rest.pop());
  return{key,lines:shuffle(out,rnd)};
}

// 検証：韻100% + 位置バリエーション
let ok=0,ck=0;
for(const k in koji.families)for(const l of koji.families[k]){const gs=segsOf(l.t);ck++;if(gs.length>=2&&gs.every(w=>sig2(w)===k))ok++;else console.log("NG",k,gs.map(w=>w+"("+sig2(w)+")"));}
console.log(`韻語一致(末尾2母音): ${ok}/${ck} (${Math.round(ok/ck*100)}%)`);
let vck=0,vok=0,posHist={};let distinctSum=0;
for(let s=1;s<=6000;s++){const{key,lines}=buildVerse(koji,rng(s));vck++;let all=true;const poss=new Set();for(const l of lines){poss.add(l.p);for(const w of segsOf(l.t))if(sig2(w)!==key)all=false;}if(all)vok++;distinctSum+=poss.size;posHist[poss.size]=(posHist[poss.size]||0)+1;}
console.log(`生成バース 韻そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
console.log(`1バースの位置種類数の分布:`,posHist,`平均:${(distinctSum/vck).toFixed(2)}`);
console.log("\n=== サンプル（位置が散る）===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
[5,23,71].forEach(s=>{const{key,lines}=buildVerse(koji,rng(s));console.log(`\n[単語韻:-${key}]`);lines.forEach(l=>console.log(`  (${l.p}) ${mark(l.t)}`));});
