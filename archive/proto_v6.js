// v6：香味語彙で語彙拡張＋口語削減＋ファミリー多様化（全5キャラ×3ファミリー, 3母音）
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={
 "麹":"こうじ","杜氏":"とうじ","黄麹":"きこうじ","白麹":"しろこうじ","黒麹":"くろこうじ","種麹":"たねこうじ","米麹":"こめこうじ",
 "王子":"おうじ","工事":"こうじ","講師":"こうじ","同時":"どうじ",
 "吟醸":"ぎんじょう","大吟醸":"だいぎんじょう","異常":"いじょう","非常":"ひじょう","日常":"にちじょう",
 "吟醸香":"ぎんじょうこう","原料香":"げんりょうこう","白桃":"はくとう","黄桃":"おうとう","構造":"こうぞう","妄想":"もうそう",
 "薫酒":"くんしゅ","芳醇":"ほうじゅん","濃醇":"のうじゅん","醇酒":"じゅんしゅ","熟酒":"じゅくしゅ","爽酒":"そうしゅ",
 "精米":"せいまい","蒸米":"むしまい","酒米":"さかまい","苦味":"にがみ","気合い":"きあい","以外":"いがい",
 "山廃":"やまはい","甘味":"あまみ","万歳":"ばんざい","乾杯":"かんぱい",
 "乳酸菌":"にゅうさんきん","旨味":"うまみ","純米":"じゅんまい","洋梨":"ようなし",
};
const sig3=w=>{const y=YOMI[w]||w;return vw(y).slice(-3);};

const CH={
 koji:{name:"麹菌",emoji:"🌾",families:{
   oui:[
     {p:"head", t:`${R("種麹")}起こすは 蔵の${R("王子")}／胞子を撒いて 命を宿す`},
     {p:"end",  t:`糖化の主役は やはり${R("麹")}／製麹極めた 蔵の${R("講師")}`},
     {p:"mid",  t:`その${R("黄麹")} 蔵の${R("王子")}／糖化の采配 陰で操る`},
     {p:"multi",t:`${R("白麹")}に${R("黒麹")} 舞う${R("麹")}／製麹発酵 進む${R("同時")}`},
   ],
   iai:[
     {p:"head", t:`${R("精米")}削るは 職人の${R("気合い")}／雑味を落として 芯を残す`},
     {p:"end",  t:`さばけ極めて 仕上げる${R("蒸米")}／雑味残さず 抑える${R("苦味")}`},
     {p:"mid",  t:`その${R("蒸米")} 余計な${R("苦味")}／削って流して 綺麗に仕上げ`},
     {p:"multi",t:`${R("精米")}に${R("蒸米")} 込める${R("気合い")}／糖化の下地は これ${R("以外")}ねぇ`},
   ],
   uou:[
     {p:"head", t:`${R("吟醸香")}の源 甘き${R("白桃")}／糖化が生むは 芳しき香`},
     {p:"end",  t:`蒸米溶かして 生む${R("原料香")}／米の甘みは まるで${R("黄桃")}`},
     {p:"mid",  t:`その${R("白桃")} 香る${R("構造")}／糖化の設計 俺が描く`},
     {p:"multi",t:`${R("白桃")}に${R("黄桃")} 立つ${R("吟醸香")}／糖化の土台 これぞ${R("原料香")}`},
   ],
 }},
 yeast:{name:"清酒酵母",emoji:"🫧",families:{
   iou:[
     {p:"head", t:`${R("吟醸")}の香り キレが${R("異常")}／鼻を掴んで 離しゃしねぇ`},
     {p:"end",  t:`華やぎ極める 我が${R("大吟醸")}／立ち上る香り もはや${R("非常")}`},
     {p:"mid",  t:`その${R("吟醸")} 匂い${R("異常")}／グラス開ければ 場が湧く`},
     {p:"multi",t:`${R("吟醸")}に${R("大吟醸")} 香り${R("異常")}／攻める毎日 これが${R("日常")}`},
   ],
   uou:[
     {p:"head", t:`${R("吟醸香")}放てば 甘き${R("白桃")}／鼻腔を抜けて 客を酔わす`},
     {p:"end",  t:`カプロン酸で 生む${R("吟醸香")}／リンゴか洋梨 香る${R("黄桃")}`},
     {p:"mid",  t:`その${R("白桃")} 香る${R("妄想")}／グラスの中で 夢を見せる`},
     {p:"multi",t:`${R("白桃")}に${R("黄桃")} 立つ${R("吟醸香")}／香りの${R("構造")} 俺が創る`},
   ],
   uiu:[
     {p:"head", t:`${R("薫酒")}の頂 香り${R("芳醇")}／薫りの高さで 客を攫う`},
     {p:"end",  t:`華やぎ極めりゃ 生まれる${R("薫酒")}／深く漂う 濃き${R("芳醇")}`},
     {p:"mid",  t:`その${R("薫酒")} 香り${R("濃醇")}／鼻先掴んで 離さない`},
     {p:"multi",t:`${R("薫酒")}に${R("芳醇")} 攻める${R("濃醇")}／熟せば化けるは 深き${R("熟酒")}`},
   ],
 }},
 toji:{name:"杜氏",emoji:"👘",families:{
   oui:[
     {p:"head", t:`${R("杜氏")}が号令 蔵の${R("王子")}／全部の工程 俺が仕切る`},
     {p:"end",  t:`温度を決めるは この${R("杜氏")}／狂いは許さぬ 精密${R("工事")}`},
     {p:"mid",  t:`その${R("杜氏")} 蔵の${R("講師")}／若い蔵人 育て上げる`},
     {p:"multi",t:`${R("杜氏")}が采配 走る${R("同時")}／麹も酛も 操る${R("王子")}`},
   ],
   iou:[
     {p:"head", t:`${R("吟醸")}造りは 俺の${R("日常")}／狙った香り 寸分違わず`},
     {p:"end",  t:`三段仕込みで 生む${R("大吟醸")}／その完成度 もはや${R("非常")}`},
     {p:"mid",  t:`その${R("吟醸")} キレが${R("異常")}／温度管理は 俺の技`},
     {p:"multi",t:`${R("吟醸")}に${R("大吟醸")} 精度${R("異常")}／毎年通すが これが${R("日常")}`},
   ],
   uiu:[
     {p:"head", t:`${R("薫酒")}を狙えば 香り高く／爽やか攻めるは 我が${R("爽酒")}`},
     {p:"end",  t:`濃く深く攻めりゃ 生む${R("濃醇")}／熟成任せりゃ 化ける${R("熟酒")}`},
     {p:"mid",  t:`その${R("薫酒")} 攻めの${R("醇酒")}／酒質設計 俺の頭`},
     {p:"multi",t:`${R("薫酒")}に${R("爽酒")} 操る${R("濃醇")}／熟成極めりゃ 深き${R("熟酒")}`},
   ],
 }},
 lactic:{name:"乳酸菌",emoji:"🦠",families:{
   aai:[
     {p:"head", t:`${R("山廃")}仕込みで 深き${R("甘味")}／雑菌散らして 蔵を守る`},
     {p:"end",  t:`酵母の舞台 整える${R("山廃")}／仕上がる酒に 皆で${R("乾杯")}`},
     {p:"mid",  t:`その${R("山廃")} 豊かな${R("甘味")}／時間かけても 価値がある`},
     {p:"multi",t:`深き${R("山廃")} 円き${R("甘味")}／飲めば旨いと 蔵に${R("万歳")}`},
   ],
   uai:[
     {p:"head", t:`${R("乳酸菌")}が育む 深き${R("旨味")}／雑菌駆逐 陰の主役`},
     {p:"end",  t:`生酛支える 我が${R("乳酸菌")}／だから仕上がる 上等${R("純米")}`},
     {p:"mid",  t:`その${R("乳酸菌")} 豊かな${R("旨味")}／pH下げて 蔵を守る`},
     {p:"multi",t:`${R("乳酸菌")}が${R("純米")}育て／甘み香るは まるで${R("洋梨")}`},
   ],
   uiu:[
     {p:"head", t:`生酛が生むは 深き${R("濃醇")}／時をかけ醸す 我が${R("醇酒")}`},
     {p:"end",  t:`酸で骨格 支える${R("芳醇")}／深く仕上げりゃ 極み${R("濃醇")}`},
     {p:"mid",  t:`その${R("醇酒")} 香り${R("芳醇")}／縁の下から 深み出す`},
     {p:"multi",t:`${R("濃醇")}に${R("醇酒")} 攻める${R("芳醇")}／生酛の底力 深く残す`},
   ],
 }},
 rice:{name:"酒米",emoji:"🍚",families:{
   aai:[
     {p:"head", t:`${R("酒米")}の中の 王者の${R("甘味")}／磨き抜かれて 蔵へ向かう`},
     {p:"end",  t:`田から蔵まで 旅する${R("酒米")}／飲んだ皆が 叫ぶ${R("万歳")}`},
     {p:"mid",  t:`その${R("酒米")} 秘めた${R("甘味")}／心白抱いて どっしり構え`},
     {p:"multi",t:`磨いた${R("酒米")} 円き${R("甘味")}／喉越し豊かで 蔵に${R("万歳")}`},
   ],
   iai:[
     {p:"head", t:`${R("精米")}削られ それでも${R("気合い")}／芯の心白 崩れやしねぇ`},
     {p:"end",  t:`磨き抜かれて 生きる${R("精米")}／雑味残さぬ 抑えた${R("苦味")}`},
     {p:"mid",  t:`その${R("蒸米")} 余計な${R("苦味")}／芯まで蒸れて 麹を待つ`},
     {p:"multi",t:`${R("精米")}に${R("蒸米")} 込める${R("気合い")}／良い酒の道は これ${R("以外")}ねぇ`},
   ],
   uai:[
     {p:"head", t:`削りの果てに 宿る${R("旨味")}／その名を名乗る 上等${R("純米")}`},
     {p:"end",  t:`芯の心白 生むは${R("旨味")}／甘く香るは まるで${R("洋梨")}`},
     {p:"mid",  t:`その${R("純米")} 秘めた${R("旨味")}／原料あってこそ 酒になる`},
     {p:"multi",t:`${R("純米")}育てる 元は${R("旨味")}／香り立つのは 甘き${R("洋梨")}`},
   ],
 }},
};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildVerse(c,rnd){const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const lines=c.families[key];const byPos={};lines.forEach(l=>{(byPos[l.p]=byPos[l.p]||[]).push(l);});const order=shuffle(["head","mid","end","multi"],rnd);const out=[],used=new Set();for(const p of order){if(byPos[p]){const cand=byPos[p].filter(l=>!used.has(l));if(cand.length){const pk=cand[Math.floor(rnd()*cand.length)];out.push(pk);used.add(pk);}}}const rest=shuffle(lines.filter(l=>!used.has(l)),rnd);while(out.length<4&&rest.length)out.push(rest.pop());return{key,lines:shuffle(out,rnd)};}

let ok=0,ck=0,unk=0;
for(const id in CH)for(const k in CH[id].families)for(const l of CH[id].families[k]){const gs=segsOf(l.t);ck++;gs.forEach(w=>{if(!YOMI[w])unk++;});if(gs.length>=2&&gs.every(w=>sig3(w)===k))ok++;else console.log("NG",id,k,gs.map(w=>w+"("+sig3(w)+")"));}
console.log(`行内 韻語一致(3母音): ${ok}/${ck} (${Math.round(ok/ck*100)}%) 読み未登録:${unk}`);
let vok=0,vck=0;for(const id in CH)for(let s=1;s<=3000;s++){const{key,lines}=buildVerse(CH[id],rng(s*131+id.length));let all=true;for(const l of lines)for(const w of segsOf(l.t))if(sig3(w)!==key)all=false;vck++;if(all)vok++;}
console.log(`生成バース 3母音そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
for(const id in CH){const fam=Object.keys(CH[id].families);const{key,lines}=buildVerse(CH[id],rng(7));console.log(`\n【${CH[id].name}】ファミリー:[${fam.join(", ")}] 例[-${key}]`);lines.forEach(l=>console.log(`  ${mark(l.t)}`));}
