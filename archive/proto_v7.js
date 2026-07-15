// v7：残り4キャラ（酵母/杜氏/乳酸菌/酒米）を テンプレ＋役割＋重複抑制 で作成・検証
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
const vw=s=>{const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");};
const R=s=>`<span class="rhyme">${s}</span>`;
const seg=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);
const YOMI={
 "白桃":"はくとう","黄桃":"おうとう","葡萄":"ぶどう","吟醸香":"ぎんじょうこう","原料香":"げんりょうこう","芳香":"ほうこう",
 "薫酒":"くんしゅ","爽酒":"そうしゅ","濃醇":"のうじゅん","醇酒":"じゅんしゅ","熟酒":"じゅくしゅ","芳醇":"ほうじゅん",
 "吟醸":"ぎんじょう","大吟醸":"だいぎんじょう","異常":"いじょう","非常":"ひじょう","日常":"にちじょう",
 "乳酸菌":"にゅうさんきん","旨味":"うまみ","純米":"じゅんまい","洋梨":"ようなし","祝杯":"しゅくはい",
 "山廃":"やまはい","酒米":"さかまい","甘味":"あまみ","乾杯":"かんぱい","万歳":"ばんざい",
 "精米":"せいまい","蒸米":"むしまい","苦味":"にがみ","気合い":"きあい","気概":"きがい",
 "麹":"こうじ","黄麹":"きこうじ","白麹":"しろこうじ","黒麹":"くろこうじ","種麹":"たねこうじ","米麹":"こめこうじ","杜氏":"とうじ","王子":"おうじ","講師":"こうじ","同志":"どうし",
};
const sig3=w=>vw(YOMI[w]||w).slice(-3);

const CH={
 yeast:{name:"清酒酵母",emoji:"🫧",bank:{
   uou:{fruit:["白桃","黄桃","葡萄"],aroma:["吟醸香","原料香","芳香"]},
   uiu:{type:["薫酒","爽酒","濃醇","醇酒","熟酒","芳醇"]},
   iou:{sake:["吟醸","大吟醸"],degree:["異常","非常","日常"]},
 },frames:[
   {b:"uou",p:"head",ra:"aroma",rb:"fruit",f:`{a}放てば 甘き{b}／鼻腔を抜けて 客を酔わす`},
   {b:"uou",p:"end", ra:"aroma",rb:"fruit",f:`グラスに満ちる この{a}／立ちのぼるは 熟れた{b}`},
   {b:"uou",p:"mid", ra:"aroma",rb:"fruit",f:`その{a} 香る{b}／薫りの高さで 場を攫う`},
   {b:"uou",p:"multi",ra:"aroma",rb:"aroma",f:`{a}に{b} 立ちのぼる／セレビシエ仕込み 誰も敵わねぇ`},
   {b:"uou",p:"multi",ra:"fruit",rb:"fruit",f:`{a}に{b} 香り重ね／甘き誘惑 客を酔わす`},
   {b:"uou",p:"head",ra:"fruit",rb:"aroma",f:`甘き{a} 立ちのぼる{b}／グラスの中で 魅せる舞台`},
   {b:"uiu",p:"head",ra:"type",rb:"type",f:`{a}を極めて 攻める{b}／香りの高さで 頂を取る`},
   {b:"uiu",p:"mid", ra:"type",rb:"type",f:`その{a} 攻めの{b}／グラス開ければ 場が湧く`},
   {b:"uiu",p:"end", ra:"type",rb:"type",f:`華やぎ極めりゃ 生む{a}／深く漂う 濃き{b}`},
   {b:"uiu",p:"multi",ra:"type",rb:"type",f:`{a}に{b} 攻め立てて／セレビシエ仕込み 誰も敵わねぇ`},
   {b:"iou",p:"head",ra:"sake",rb:"degree",f:`{a}の香り キレが{b}／鼻を掴んで 離しゃしねぇ`},
   {b:"iou",p:"end", ra:"sake",rb:"degree",f:`華やぎ極める 我が{a}／立ち上る香り もはや{b}`},
   {b:"iou",p:"mid", ra:"degree",rb:"degree",f:`匂い{a} キレも{b}／グラス開ければ 場が湧く`},
   {b:"iou",p:"multi",ra:"sake",rb:"sake",f:`{a}に{b} 攻める毎日／香りの頂 俺が獲る`},
   {b:"iou",p:"multi",ra:"degree",rb:"degree",f:`{a}に{b} 攻め続け／香りの頂 俺が獲る`},
   {b:"iou",p:"head",ra:"degree",rb:"degree",f:`匂い{a} キレも{b}／鼻を掴んで 離しゃしねぇ`},
 ]},
 toji:{name:"杜氏",emoji:"👘",bank:{
   oui:{person:["杜氏","王子","講師","同志"],koji:["麹","黄麹","種麹","米麹"]},
   iou:{sake:["吟醸","大吟醸"],degree:["異常","非常","日常"]},
   uiu:{type:["薫酒","爽酒","濃醇","醇酒","熟酒","芳醇"]},
 },frames:[
   {b:"oui",p:"head",ra:"person",rb:"koji",f:`{a}が采配 蔵を仕切る／育て上げるは 我が{b}`},
   {b:"oui",p:"end", ra:"person",rb:"koji",f:`温度を決めるは この{a}／芯まで届くは 蔵の{b}`},
   {b:"oui",p:"mid", ra:"person",rb:"person",f:`その{a} 蔵の{b}／若い蔵人 束ねてく`},
   {b:"oui",p:"multi",ra:"person",rb:"koji",f:`{a}が指させ 舞う{b}／狙った酒質 一発で出す`},
   {b:"oui",p:"head",ra:"person",rb:"person",f:`{a}が先頭 続くは{b}／蔵の秩序は 俺が決める`},
   {b:"oui",p:"end", ra:"koji",rb:"koji",f:`蔵を染めるは この{a}／束ねて動かす 我が{b}`},
   {b:"oui",p:"mid", ra:"koji",rb:"koji",f:`比べてみろよ {a}と{b}／采配ひとつで 蔵が動く`},
   {b:"oui",p:"multi",ra:"person",rb:"person",f:`{a}に{b} 従える／蔵の頂 俺が獲る`},
   {b:"iou",p:"head",ra:"sake",rb:"degree",f:`{a}造りは 俺の{b}／狙った香り 寸分違わず`},
   {b:"iou",p:"end", ra:"sake",rb:"degree",f:`三段仕込みで 生む{a}／その完成度 もはや{b}`},
   {b:"iou",p:"mid", ra:"degree",rb:"degree",f:`精度は{a} キレも{b}／温度管理は 俺の技`},
   {b:"iou",p:"multi",ra:"sake",rb:"sake",f:`{a}に{b} 毎年通す／狙った酒質 一発で出す`},
   {b:"iou",p:"multi",ra:"degree",rb:"degree",f:`{a}に{b} 攻め続け／蔵の頂 俺が獲る`},
   {b:"uiu",p:"head",ra:"type",rb:"type",f:`{a}も{b}も 俺の設計／狙った酒質 自在に操る`},
   {b:"uiu",p:"mid", ra:"type",rb:"type",f:`その{a} 攻めの{b}／酒質設計 俺の頭`},
   {b:"uiu",p:"end", ra:"type",rb:"type",f:`濃く深く攻めりゃ 生む{a}／熟成任せりゃ 化ける{b}`},
   {b:"uiu",p:"multi",ra:"type",rb:"type",f:`{a}に{b} 操る俺／蔵の頂 俺が獲る`},
 ]},
 lactic:{name:"乳酸菌",emoji:"🦠",bank:{
   uiu:{type:["濃醇","醇酒","芳醇","熟酒","薫酒","爽酒"]},
   uai:{bug:["乳酸菌"],taste:["旨味"],sake:["純米"],fruit:["洋梨"],cheer:["祝杯"]},
   aai:{proc:["山廃"],taste:["甘味"],cheer:["乾杯","万歳"]},
 },frames:[
   // uiu（6語・濃醇な酒質）：二韻語で厚く
   {b:"uiu",p:"head",ra:"type",rb:"type",f:`生酛が生むは 深き{a}／時をかけ醸す 我が{b}`},
   {b:"uiu",p:"mid", ra:"type",rb:"type",f:`その{a} 攻めの{b}／縁の下から 深み出す`},
   {b:"uiu",p:"end", ra:"type",rb:"type",f:`酸で骨格 支える{a}／深く仕上げる 極み{b}`},
   {b:"uiu",p:"multi",ra:"type",rb:"type",f:`{a}に{b} 攻め立てて／生酛の底力 深く残す`},
   // uai（1語役割×5）：単一韻語主体で全語を散らす
   {b:"uai",p:"head",ra:"bug",  f:`{a}が動けば 蔵が変わる／雑菌散らして 底を支える`},
   {b:"uai",p:"mid", ra:"bug",  f:`陰で効かせる {a}の技／じわり広がる 深き旨味`},
   {b:"uai",p:"end", ra:"taste",f:`縁の下から 押し出す{a}／それが乳酸の 生き様だ`},
   {b:"uai",p:"head",ra:"taste",f:`じわり広がる 深き{a}／pH下げて 蔵を守る`},
   {b:"uai",p:"mid", ra:"sake", f:`狙うは{a} 生酛仕込み／時をかけても 価値がある`},
   {b:"uai",p:"end", ra:"sake", f:`だから仕上がる 上等{a}／縁の下から 酒を支え`},
   {b:"uai",p:"multi",ra:"fruit",f:`香り立つのは まるで{a}／生酛の底力 深く残す`},
   {b:"uai",p:"mid", ra:"fruit",f:`甘く香るは 熟れた{a}／陰の主役は この俺だ`},
   {b:"uai",p:"multi",ra:"cheer",f:`仕上がる酒に みなで{a}／縁の下から 酒を支え`},
   {b:"uai",p:"end", ra:"cheer",f:`飲み干す一杯 高く{a}／それが乳酸の 生き様だ`},
   {b:"uai",p:"multi",ra:"bug",rb:"taste",f:`{a}が育む 深き{b}／雑菌駆逐 陰の主役`},
   // aai（山廃/甘味/乾杯/万歳）：単一主体＋一部二韻語
   {b:"aai",p:"head",ra:"proc", f:`丹精込めた この{a}／雑菌散らして 蔵を守る`},
   {b:"aai",p:"mid", ra:"proc", f:`酵母の舞台 整える{a}／時間かけても 価値がある`},
   {b:"aai",p:"end", ra:"taste",f:`じわり広がる 深き{a}／生酛仕込みの 底力`},
   {b:"aai",p:"mid", ra:"cheer",f:`仕上がる酒に みなで{a}／生酛の底力 深く残す`},
   {b:"aai",p:"multi",ra:"proc",rb:"taste",f:`深き{a} 豊かな{b}／時間かけても 価値がある`},
   {b:"aai",p:"head",ra:"taste",rb:"cheer",f:`深き{a} 飲めば{b}／生酛仕込みの 底力`},
 ]},
 rice:{name:"酒米",emoji:"🍚",bank:{
   iai:{proc:["精米","蒸米"],taste:["苦味"],spirit:["気合い","気概"]},
   aai:{grain:["酒米"],taste:["甘味"],cheer:["万歳","乾杯"]},
   uai:{taste:["旨味"],sake:["純米"],fruit:["洋梨"],cheer:["祝杯"]},
 },frames:[
   // iai（精米/蒸米/苦味/気合い/気概）：二韻語＋単一を混在
   {b:"iai",p:"head",ra:"proc",rb:"spirit",f:`{a}削られ それでも{b}／芯の心白 崩れやしねぇ`},
   {b:"iai",p:"end", ra:"proc",rb:"taste",f:`磨き抜かれて 生きる{a}／雑味残さぬ 抑えた{b}`},
   {b:"iai",p:"mid", ra:"proc",rb:"proc",f:`{a}に{b} 削り抜く／芯まで澄んで 一級品`},
   {b:"iai",p:"multi",ra:"proc",rb:"spirit",f:`{a}に込める 職人の{b}／良い酒の道は これで決まる`},
   {b:"iai",p:"end", ra:"taste",rb:"spirit",f:`最後に抑える この{a}／芯を支える 俺の{b}`},
   {b:"iai",p:"head",ra:"proc",rb:"taste",f:`{a}を磨けば 締まる{b}／雑味を落として 芯を残す`},
   {b:"iai",p:"mid", ra:"taste",rb:"spirit",f:`効かせた{a} 込めた{b}／芯まで通して 隙は見せねぇ`},
   {b:"iai",p:"multi",ra:"proc",f:`丹念に磨いた この{a}／芯まで澄んで 一級品`},
   {b:"iai",p:"head",ra:"spirit",f:`削られてなお 燃える{a}／芯の心白 崩れやしねぇ`},
   // aai（酒米/甘味/万歳/乾杯）：単一主体
   {b:"aai",p:"head",ra:"grain",f:`磨き抜かれた この{a}／心白抱いて どっしり構え`},
   {b:"aai",p:"mid", ra:"grain",f:`田から蔵まで 旅する{a}／原料あってこそ 酒になる`},
   {b:"aai",p:"multi",ra:"taste",f:`喉越し豊かな 深き{a}／原料あってこそ 酒になる`},
   {b:"aai",p:"end", ra:"cheer",f:`飲んだ皆が 叫ぶ{a}／酒米あっての 良い酒だ`},
   {b:"aai",p:"mid", ra:"cheer",f:`蔵に響くは 高き{a}／原料あってこそ 酒になる`},
   {b:"aai",p:"head",ra:"grain",rb:"taste",f:`{a}の中の 王者の{b}／磨き抜かれて 蔵へ向かう`},
   {b:"aai",p:"end", ra:"grain",rb:"cheer",f:`田から蔵まで 旅する{a}／飲んだ皆が 叫ぶ{b}`},
   // uai（旨味/純米/洋梨）：単一主体
   {b:"uai",p:"head",ra:"taste",f:`削りの果てに 宿る{a}／芯の心白 崩れやしねぇ`},
   {b:"uai",p:"mid", ra:"sake", f:`その名を名乗る 上等{a}／削りの果てに 光る力`},
   {b:"uai",p:"end", ra:"fruit",f:`甘く香るは まるで{a}／原料あってこそ 酒になる`},
   {b:"uai",p:"multi",ra:"taste",f:`磨きが生むは 深き{a}／磨き抜かれた 底力`},
   {b:"uai",p:"mid", ra:"cheer",f:`蔵に響くは 高き{a}／原料あってこそ 酒になる`},
   {b:"uai",p:"end", ra:"taste",rb:"fruit",f:`芯の心白 生むは{a}／甘く香るは まるで{b}`},
   {b:"uai",p:"head",ra:"sake",rb:"taste",f:`{a}の名乗り 秘めた{b}／原料あってこそ 酒になる`},
 ]},
};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildVerse(me,rnd){
  const bkeys=Object.keys(me.bank);const key=bkeys[Math.floor(rnd()*bkeys.length)];const roles=me.bank[key];
  const rpk=fr=>fr.ra+"|"+(fr.rb||"");
  const fillable=fr=>{if(fr.b!==key)return false;const A=roles[fr.ra];if(!A||!A.length)return false;if(!fr.rb)return true;const B=roles[fr.rb];if(!B)return false;return fr.ra===fr.rb?A.length>=2:B.length>=1;};
  const pool=me.frames.filter(fillable);const byPos={};pool.forEach(f=>{(byPos[f.p]=byPos[f.p]||[]).push(f);});
  const order=shuffle(["head","mid","end","multi"],rnd);const chosen=[],usedF=new Set();
  for(const p of order){let cand=(byPos[p]||[]).filter(f=>!usedF.has(f));const rp=new Set(chosen.map(rpk));const fresh=cand.filter(f=>!rp.has(rpk(f)));if(fresh.length)cand=fresh;if(cand.length){const fr=cand[Math.floor(rnd()*cand.length)];chosen.push(fr);usedF.add(fr);}}
  const rest=shuffle(pool.filter(f=>!usedF.has(f)),rnd);while(chosen.length<4&&rest.length)chosen.push(rest.pop());while(chosen.length<4&&pool.length)chosen.push(pool[Math.floor(rnd()*pool.length)]);
  const cnt={};const pickW=list=>{let min=Infinity;list.forEach(w=>{const c=cnt[w]||0;if(c<min)min=c;});const cand=list.filter(w=>(cnt[w]||0)===min);const w=cand[Math.floor(rnd()*cand.length)];cnt[w]=(cnt[w]||0)+1;return w;};
  const lines=shuffle(chosen,rnd).map(fr=>{let t=fr.f.replace("{a}",R(pickW(roles[fr.ra])));if(fr.rb)t=t.replace("{b}",R(pickW(roles[fr.rb])));return t;});
  return {key,lines};
}

// バンク自己チェック
let bad=0;for(const id in CH)for(const k in CH[id].bank)for(const r in CH[id].bank[k])for(const w of CH[id].bank[k][r])if(sig3(w)!==k){console.log("不整合",id,k,r,w,sig3(w));bad++;}
console.log("バンク自己チェック:",bad===0?"OK":bad+"件");
// フレーム役割充足
let fb=0;for(const id in CH)CH[id].frames.forEach(fr=>{const R2=CH[id].bank[fr.b];if(!R2||!R2[fr.ra]||(fr.rb&&!R2[fr.rb])){console.log("役割欠落",id,fr.b,fr.ra,fr.rb);fb++;}else if(fr.rb&&fr.ra===fr.rb&&R2[fr.ra].length<2){console.log("同役割2語不足",id,fr.b,fr.ra);fb++;}});
console.log("フレーム役割チェック:",fb===0?"OK":fb+"件");
// 各キャラ検証
for(const id in CH){const me=CH[id];let vck=0,ok=0,h3=0,uV=new Set(),uL=new Set();
 for(let s=1;s<=20000;s++){const{key,lines}=buildVerse(me,rng(s*131+id.length));vck++;let all=true;const words=[];for(const l of lines){uL.add(l.replace(/<[^>]+>/g,""));for(const w of seg(l)){words.push(w);if(sig3(w)!==key)all=false;}}if(all)ok++;const cnt={};words.forEach(w=>cnt[w]=(cnt[w]||0)+1);if(Math.max(...Object.values(cnt))>=3)h3++;uV.add(lines.map(l=>l.replace(/<[^>]+>/g,"")).join("|"));}
 console.log(`【${me.name}】韻100%:${Math.round(ok/vck*100)}% | 3回以上:${(h3/vck*100).toFixed(1)}% | ユニーク行:${uL.size} | ユニークバース:${uV.size}`);
}
console.log("\n=== サンプル ===");
const m=s=>s.replace(/<[^>]+>/g,"");
for(const id in CH){const{key,lines}=buildVerse(CH[id],rng(id.length*77+9));console.log(`\n【${CH[id].name}】[-${key}]`);lines.forEach(l=>console.log("  "+m(l)));}
