// 3母音・混成韻・位置分散：残り4キャラ（酵母/杜氏/乳酸菌/酒米）検証
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
function vw(s){const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={
 // 醸造語
 "吟醸":"ぎんじょう","大吟醸":"だいぎんじょう","発酵":"はっこう","杜氏":"とうじ","乳酸菌":"にゅうさんきん","純米":"じゅんまい",
 "山廃":"やまはい","酒米":"さかまい","精米":"せいまい","蒸米":"むしまい",
 // 一般語
 "異常":"いじょう","非常":"ひじょう","日常":"にちじょう","格好":"かっこう","学校":"がっこう","王子":"おうじ","同時":"どうじ","工事":"こうじ","講師":"こうじ",
 "甘い":"あまい","やばい":"やばい","乾杯":"かんぱい","万歳":"ばんざい","うまい":"うまい","気合い":"きあい","みたい":"みたい",
};
const sig3=w=>{const y=YOMI[w]||w;return vw(y).slice(-3);};

const CH={
 yeast:{name:"清酒酵母",emoji:"🫧",families:{
   iou:[
     {p:"head", t:`${R("吟醸")}の香り マジで${R("異常")}／鼻を掴んで 離しゃしねぇ`},
     {p:"end",  t:`華やぎ極める 我が${R("大吟醸")}／立ち上る香り もはや${R("非常")}`},
     {p:"mid",  t:`その${R("吟醸")} 匂い${R("異常")}／グラス開ければ 客が酔う`},
     {p:"multi",t:`${R("吟醸")}に${R("大吟醸")} 香り${R("異常")}／攻める毎日 これが${R("日常")}`},
     {p:"head", t:`${R("大吟醸")}の華 香り${R("非常")}／セレビシエ仕込み 誰も敵わねぇ`},
   ],
   aou:[
     {p:"head", t:`${R("発酵")}のドラマ 主役の${R("格好")}／泡立てながら 魅せる舞台`},
     {p:"end",  t:`香り極めるは この${R("発酵")}／決めるフィニッシュ 最高の${R("格好")}`},
     {p:"mid",  t:`その${R("発酵")} まるで${R("学校")}／毎日進化 学び続ける`},
     {p:"multi",t:`${R("発酵")}は${R("格好")} 泡は${R("学校")}／二億の同胞 攻める舞台`},
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
 }},
 lactic:{name:"乳酸菌",emoji:"🦠",families:{
   aai:[
     {p:"head", t:`${R("山廃")}仕込みで 深み${R("やばい")}／雑菌散らして 蔵を守る`},
     {p:"end",  t:`酵母の舞台 整える${R("山廃")}／完成した酒に 皆で${R("乾杯")}`},
     {p:"mid",  t:`その${R("山廃")} コクが${R("やばい")}／時間かけても 価値がある`},
     {p:"multi",t:`深き${R("山廃")} 旨味${R("やばい")}／飲めば${R("甘い")} 蔵に${R("万歳")}`},
     {p:"head", t:`${R("山廃")}の酸で 攻めも${R("やばい")}／速醸なんかにゃ 出せない深み`},
   ],
   uai:[
     {p:"head", t:`${R("乳酸菌")}の力 酒は${R("うまい")}／雑菌駆逐 陰の主役`},
     {p:"end",  t:`生酛支える 我が${R("乳酸菌")}／だから仕上がる 上等${R("純米")}`},
     {p:"mid",  t:`その${R("乳酸菌")} 効きが${R("うまい")}／pH下げて 蔵を守る`},
     {p:"multi",t:`${R("乳酸菌")}が${R("純米")}育て／飲めば${R("うまい")} この底力`},
   ],
 }},
 rice:{name:"酒米",emoji:"🍚",families:{
   aai:[
     {p:"head", t:`${R("酒米")}の中の 王者${R("やばい")}／磨き抜かれて 蔵へ向かう`},
     {p:"end",  t:`田から蔵まで 旅する${R("酒米")}／飲んだ皆が 叫ぶ${R("万歳")}`},
     {p:"mid",  t:`その${R("酒米")} 甘み${R("やばい")}／心白抱いて どっしり構え`},
     {p:"multi",t:`磨いた${R("酒米")} 香り${R("やばい")}／喉越し${R("甘い")} 一気に${R("万歳")}`},
     {p:"head", t:`${R("酒米")}あっての 酒だ${R("やばい")}／原料軽んじゃ 良い酒ならねぇ`},
   ],
   iai:[
     {p:"head", t:`${R("精米")}削られ それでも${R("気合い")}／芯の心白 崩れやしねぇ`},
     {p:"end",  t:`磨き抜かれて 生きる${R("精米")}／その覚悟こそ 職人${R("みたい")}`},
     {p:"mid",  t:`その${R("蒸米")} さばけ${R("みたい")}／芯まで蒸れて 麹を待つ`},
     {p:"multi",t:`${R("精米")}に${R("蒸米")} 全部${R("気合い")}／削られてなお 光る${R("みたい")}`},
   ],
 }},
};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildVerse(c,rnd){const keys=Object.keys(c.families).filter(k=>c.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const lines=c.families[key];const byPos={};lines.forEach(l=>{(byPos[l.p]=byPos[l.p]||[]).push(l);});const order=shuffle(["head","mid","end","multi"],rnd);const out=[],used=new Set();for(const p of order){if(byPos[p]){const cand=byPos[p].filter(l=>!used.has(l));if(cand.length){const pk=cand[Math.floor(rnd()*cand.length)];out.push(pk);used.add(pk);}}}const rest=shuffle(lines.filter(l=>!used.has(l)),rnd);while(out.length<4&&rest.length)out.push(rest.pop());return{key,lines:shuffle(out,rnd)};}

let ok=0,ck=0,unk=0;
for(const id in CH)for(const k in CH[id].families)for(const l of CH[id].families[k]){const gs=segsOf(l.t);ck++;gs.forEach(w=>{if(!YOMI[w])unk++;});if(gs.length>=2&&gs.every(w=>sig3(w)===k))ok++;else console.log("NG",id,k,gs.map(w=>w+"("+sig3(w)+")"));}
console.log(`行内 韻語一致(末尾3母音): ${ok}/${ck} (${Math.round(ok/ck*100)}%) 読み未登録:${unk}`);
let vok=0,vck=0;
for(const id in CH)for(let s=1;s<=3000;s++){const{key,lines}=buildVerse(CH[id],rng(s*131+id.length));let all=true;for(const l of lines)for(const w of segsOf(l.t))if(sig3(w)!==key)all=false;vck++;if(all)vok++;}
console.log(`生成バース 3母音そろい: ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
console.log("\n=== サンプル ===");
const mark=s=>s.replace(/<span class="rhyme">([^<]+)<\/span>/g,"〔$1〕");
for(const id in CH){const{key,lines}=buildVerse(CH[id],rng(7));console.log(`\n【${CH[id].name}】[-${key}]`);lines.forEach(l=>console.log(`  (${l.p}) ${mark(l.t)}`));}
