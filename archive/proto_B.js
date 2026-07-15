// フルB：単一グローバル辞書 VOCAB → 実行時にオート・バケット化 → テンプレに韻の合う語を差し込む
const V={};const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows)for(const c of rows[v])V[c]=v;
const vw=s=>{const o=[];for(const ch of s){if(V[ch])o.push(V[ch]);else if(ch==="ー"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o.join("");};
const R=s=>`<span class="rhyme">${s}</span>`;
const seg=l=>[...l.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);

// ── 単一グローバル辞書：語→{よみ, 役割}。役割名は全体でユニーク（役割=同一母音の意味グループ）──
const VOCAB={
 // koji / person (oui)
 "麹":{y:"こうじ",r:"koji"},"黄麹":{y:"きこうじ",r:"koji"},"白麹":{y:"しろこうじ",r:"koji"},"黒麹":{y:"くろこうじ",r:"koji"},"種麹":{y:"たねこうじ",r:"koji"},"米麹":{y:"こめこうじ",r:"koji"},
 "杜氏":{y:"とうじ",r:"person"},"王子":{y:"おうじ",r:"person"},"講師":{y:"こうじ",r:"person"},"同志":{y:"どうし",r:"person"},
 // gin / degree (iou)
 "吟醸":{y:"ぎんじょう",r:"gin"},"大吟醸":{y:"だいぎんじょう",r:"gin"},
 "異常":{y:"いじょう",r:"degree"},"非常":{y:"ひじょう",r:"degree"},"日常":{y:"にちじょう",r:"degree"},
 // fruit / aroma (uou)
 "白桃":{y:"はくとう",r:"fruit"},"黄桃":{y:"おうとう",r:"fruit"},"葡萄":{y:"ぶどう",r:"fruit"},
 "吟醸香":{y:"ぎんじょうこう",r:"aroma"},"原料香":{y:"げんりょうこう",r:"aroma"},"芳香":{y:"ほうこう",r:"aroma"},
 // type (uiu)
 "薫酒":{y:"くんしゅ",r:"type"},"爽酒":{y:"そうしゅ",r:"type"},"濃醇":{y:"のうじゅん",r:"type"},"醇酒":{y:"じゅんしゅ",r:"type"},"熟酒":{y:"じゅくしゅ",r:"type"},"芳醇":{y:"ほうじゅん",r:"type"},
 // mill / bitter / spirit (iai)
 "精米":{y:"せいまい",r:"mill"},"蒸米":{y:"むしまい",r:"mill"},
 "苦味":{y:"にがみ",r:"bitter"},
 "気合い":{y:"きあい",r:"spirit"},"気概":{y:"きがい",r:"spirit"},
 // grain / sweet / banzai / yamahai (aai)
 "酒米":{y:"さかまい",r:"grain"},
 "甘味":{y:"あまみ",r:"sweet"},
 "乾杯":{y:"かんぱい",r:"banzai"},"万歳":{y:"ばんざい",r:"banzai"},
 "山廃":{y:"やまはい",r:"yamahai"},
 // bug / umami / junmai / pear / shukuhai (uai)
 "乳酸菌":{y:"にゅうさんきん",r:"bug"},
 "旨味":{y:"うまみ",r:"umami"},
 "純米":{y:"じゅんまい",r:"junmai"},
 "洋梨":{y:"ようなし",r:"pear"},
 "祝杯":{y:"しゅくはい",r:"shukuhai"},
 // variety (iii)
 "山田錦":{y:"やまだにしき",r:"variety"},"美山錦":{y:"みやまにしき",r:"variety"},"八反錦":{y:"はったんにしき",r:"variety"},"雄山錦":{y:"おやまにしき",r:"variety"},"神力":{y:"しんりき",r:"variety"},
 // moto (ioo)
 "生酛":{y:"きもと",r:"moto"},"菩提酛":{y:"ぼだいもと",r:"moto"},
};

// ── オート・バケット化：役割→語リスト, 役割→末尾3母音シグネチャ(自動) ──
const ROLE_WORDS={}, ROLE_SIG={};
for(const [w,{r}] of Object.entries(VOCAB)) (ROLE_WORDS[r]=ROLE_WORDS[r]||[]).push(w);
const sig3=w=>vw(VOCAB[w]?VOCAB[w].y:w).slice(-3);
let sigBad=0;
for(const r in ROLE_WORDS){ const sigs=[...new Set(ROLE_WORDS[r].map(sig3))]; ROLE_SIG[r]=sigs[0]; if(sigs.length>1){console.log("役割内で母音不一致",r,sigs);sigBad++;} }
console.log("役割シグネチャ整合:",sigBad===0?"OK (全役割が単一母音)":sigBad+"件");

// ── キャラ＝使う役割リスト＋フレーム（フレームは役割のみ参照。bも母音キーも不要＝オート導出）──
const F={
 koji:{name:"麹菌",roles:["koji","person","mill","bitter","spirit","fruit","aroma"],frames:[
   {p:"head",ra:"koji",rb:"koji",f:`{a}に{b} 蔵に舞わせ／糖化の采配 隙は見せねぇ`},
   {p:"mid", ra:"koji",rb:"koji",f:`研ぎ澄ました{a} 極めた{b}／蔵の奥から 攻め続ける`},
   {p:"multi",ra:"koji",rb:"koji",f:`{a}も{b}も 俺が束ねる／製麹こそが 品質決める`},
   {p:"head",ra:"person",rb:"koji",f:`{a}が采配 蔵を仕切る／育て上げるは 我が{b}`},
   {p:"end", ra:"person",rb:"koji",f:`糖化の主役は 育てた{b}／それを束ねる 蔵の{a}`},
   {p:"end", ra:"person",rb:"person",f:`蔵に号令 かける{a}／誰もが認める 我が{b}`},
   {p:"end", ra:"koji",rb:"koji",f:`蔵を染めるは この{a}／芯まで届くは 我が{b}`},
   {p:"mid", ra:"koji",rb:"koji",f:`比べてみろよ {a}と{b}／製麹の格が まるで違う`},
   {p:"multi",ra:"person",rb:"koji",f:`{a}が指させ 舞う{b}／製麹こそが 品質決める`},
   {p:"head",ra:"mill",rb:"spirit",f:`{a}削るは 職人の{b}／雑味を落として 芯を残す`},
   {p:"end", ra:"mill",rb:"bitter",f:`磨き抜かれて 生きる{a}／雑味残さぬ 抑えた{b}`},
   {p:"mid", ra:"mill",rb:"mill",f:`{a}に{b} 削り抜く／芯まで澄んで 一級品`},
   {p:"multi",ra:"mill",rb:"spirit",f:`{a}に込める 職人の{b}／製麹こそが 品質決める`},
   {p:"end", ra:"bitter",rb:"spirit",f:`最後に抑える この{a}／裏で支える 俺の{b}`},
   {p:"mid", ra:"bitter",rb:"spirit",f:`効かせた{a} 込めた{b}／芯まで通して 隙は見せねぇ`},
   {p:"end", ra:"mill",rb:"mill",f:`丁寧に磨く この{a}／さばけ極めた 我が{b}`},
   {p:"head",ra:"mill",rb:"bitter",f:`{a}を磨けば 締まる{b}／雑味を落として 芯を残す`},
   {p:"multi",ra:"bitter",rb:"spirit",f:`{a}に{b} 全部乗せ／製麹こそが 品質決める`},
   {p:"mid", ra:"mill",rb:"spirit",f:`研いだ{a} 込めた{b}／蔵の奥から 攻め続ける`},
   {p:"head",ra:"aroma",rb:"fruit",f:`{a}立ち上り 甘き{b}／糖化が生むは 芳しき香`},
   {p:"end", ra:"aroma",rb:"fruit",f:`蒸米溶かして 生む{a}／鼻をくすぐる 熟れた{b}`},
   {p:"mid", ra:"aroma",rb:"fruit",f:`その{a} 香る{b}／糖化の設計 俺が描く`},
   {p:"multi",ra:"aroma",rb:"aroma",f:`{a}に{b} 立ちのぼる／糖化の土台 これぞ底力`},
   {p:"multi",ra:"fruit",rb:"fruit",f:`{a}に{b} 香り重ね／甘き誘惑 客を酔わす`},
 ]},
 yeast:{name:"清酒酵母",roles:["fruit","aroma","type","gin","degree"],frames:[
   {p:"head",ra:"aroma",rb:"fruit",f:`{a}放てば 甘き{b}／鼻腔を抜けて 客を酔わす`},
   {p:"end", ra:"aroma",rb:"fruit",f:`グラスに満ちる この{a}／立ちのぼるは 熟れた{b}`},
   {p:"mid", ra:"aroma",rb:"fruit",f:`その{a} 香る{b}／薫りの高さで 場を攫う`},
   {p:"multi",ra:"aroma",rb:"aroma",f:`{a}に{b} 立ちのぼる／セレビシエ仕込み 誰も敵わねぇ`},
   {p:"multi",ra:"fruit",rb:"fruit",f:`{a}に{b} 香り重ね／甘き誘惑 客を酔わす`},
   {p:"head",ra:"fruit",rb:"aroma",f:`甘き{a} 立ちのぼる{b}／グラスの中で 魅せる舞台`},
   {p:"head",ra:"type",rb:"type",f:`{a}を極めて 攻める{b}／香りの高さで 頂を取る`},
   {p:"mid", ra:"type",rb:"type",f:`その{a} 攻めの{b}／グラス開ければ 場が湧く`},
   {p:"end", ra:"type",rb:"type",f:`華やぎ極めりゃ 生む{a}／深く漂う 濃き{b}`},
   {p:"multi",ra:"type",rb:"type",f:`{a}に{b} 攻め立てて／セレビシエ仕込み 誰も敵わねぇ`},
   {p:"head",ra:"gin",rb:"degree",f:`{a}の香り キレが{b}／鼻を掴んで 離しゃしねぇ`},
   {p:"end", ra:"gin",rb:"degree",f:`華やぎ極める 我が{a}／立ち上る香り もはや{b}`},
   {p:"mid", ra:"degree",rb:"degree",f:`匂い{a} キレも{b}／グラス開ければ 場が湧く`},
   {p:"multi",ra:"gin",rb:"gin",f:`{a}に{b} 攻める毎日／香りの頂 俺が獲る`},
   {p:"multi",ra:"degree",rb:"degree",f:`{a}に{b} 攻め続け／香りの頂 俺が獲る`},
 ]},
 toji:{name:"杜氏",roles:["person","koji","gin","degree","type"],frames:[
   {p:"head",ra:"person",rb:"koji",f:`{a}が采配 蔵を仕切る／育て上げるは 我が{b}`},
   {p:"end", ra:"person",rb:"koji",f:`温度を決めるは この{a}／芯まで届くは 蔵の{b}`},
   {p:"mid", ra:"person",rb:"person",f:`その{a} 蔵の{b}／若い蔵人 束ねてく`},
   {p:"multi",ra:"person",rb:"koji",f:`{a}が指させ 舞う{b}／狙った酒質 一発で出す`},
   {p:"head",ra:"person",rb:"person",f:`{a}が先頭 続くは{b}／蔵の秩序は 俺が決める`},
   {p:"end", ra:"koji",rb:"koji",f:`蔵を染めるは この{a}／束ねて動かす 我が{b}`},
   {p:"mid", ra:"koji",rb:"koji",f:`比べてみろよ {a}と{b}／采配ひとつで 蔵が動く`},
   {p:"head",ra:"gin",rb:"degree",f:`{a}造りは 俺の{b}／狙った香り 寸分違わず`},
   {p:"end", ra:"gin",rb:"degree",f:`三段仕込みで 生む{a}／その完成度 もはや{b}`},
   {p:"mid", ra:"degree",rb:"degree",f:`精度は{a} キレも{b}／温度管理は 俺の技`},
   {p:"multi",ra:"gin",rb:"gin",f:`{a}に{b} 毎年通す／狙った酒質 一発で出す`},
   {p:"head",ra:"type",rb:"type",f:`{a}も{b}も 俺の設計／狙った酒質 自在に操る`},
   {p:"mid", ra:"type",rb:"type",f:`その{a} 攻めの{b}／酒質設計 俺の頭`},
   {p:"end", ra:"type",rb:"type",f:`濃く深く攻めりゃ 生む{a}／熟成任せりゃ 化ける{b}`},
   {p:"multi",ra:"type",rb:"type",f:`{a}に{b} 操る俺／蔵の頂 俺が獲る`},
 ]},
 lactic:{name:"乳酸菌",roles:["type","bug","umami","junmai","pear","shukuhai","yamahai","sweet","banzai","moto"],frames:[
   {p:"head",ra:"type",rb:"type",f:`生酛が生むは 深き{a}／時をかけ醸す 我が{b}`},
   {p:"mid", ra:"type",rb:"type",f:`その{a} 攻めの{b}／縁の下から 深み出す`},
   {p:"end", ra:"type",rb:"type",f:`酸で骨格 支える{a}／深く仕上げる 極み{b}`},
   {p:"multi",ra:"type",rb:"type",f:`{a}に{b} 攻め立てて／生酛の底力 深く残す`},
   {p:"head",ra:"bug",f:`{a}が動けば 蔵が変わる／雑菌散らして 底を支える`},
   {p:"end", ra:"umami",f:`縁の下から 押し出す{a}／それが乳酸の 生き様だ`},
   {p:"head",ra:"umami",f:`じわり広がる 深き{a}／pH下げて 蔵を守る`},
   {p:"mid", ra:"junmai",f:`狙うは{a} 生酛仕込み／時をかけても 価値がある`},
   {p:"end", ra:"junmai",f:`だから仕上がる 上等{a}／縁の下から 酒を支え`},
   {p:"multi",ra:"pear",f:`香り立つのは まるで{a}／生酛の底力 深く残す`},
   {p:"mid", ra:"pear",f:`甘く香るは 熟れた{a}／陰の主役は この俺だ`},
   {p:"multi",ra:"shukuhai",f:`仕上がる酒に みなで{a}／縁の下から 酒を支え`},
   {p:"end", ra:"shukuhai",f:`飲み干す一杯 高く{a}／それが乳酸の 生き様だ`},
   {p:"multi",ra:"bug",rb:"umami",f:`{a}が育む 深き{b}／雑菌駆逐 陰の主役`},
   {p:"head",ra:"yamahai",f:`丹精込めた この{a}／雑菌散らして 蔵を守る`},
   {p:"mid", ra:"yamahai",f:`酵母の舞台 整える{a}／時間かけても 価値がある`},
   {p:"end", ra:"sweet",f:`じわり広がる 深き{a}／生酛仕込みの 底力`},
   {p:"mid", ra:"banzai",f:`仕上がる酒に みなで{a}／生酛の底力 深く残す`},
   {p:"multi",ra:"yamahai",rb:"sweet",f:`深き{a} 豊かな{b}／時間かけても 価値がある`},
   {p:"head",ra:"sweet",rb:"banzai",f:`深き{a} 飲めば{b}／生酛仕込みの 底力`},
   {p:"head",ra:"moto",f:`{a}仕込みで 酸を効かせ／雑菌散らして 蔵を守る`},
   {p:"mid", ra:"moto",f:`その{a} 乳酸の魂／時をかけても 価値がある`},
   {p:"end", ra:"moto",f:`古式ゆかしき この{a}／それが乳酸の 生き様だ`},
   {p:"multi",ra:"moto",f:`{a}に宿る 受け継ぐ伝統／生酛の底力 深く残す`},
 ]},
 rice:{name:"酒米",roles:["mill","bitter","spirit","grain","sweet","banzai","umami","junmai","pear","shukuhai","variety"],frames:[
   {p:"head",ra:"mill",rb:"spirit",f:`{a}削られ それでも{b}／芯の心白 崩れやしねぇ`},
   {p:"end", ra:"mill",rb:"bitter",f:`磨き抜かれて 生きる{a}／雑味残さぬ 抑えた{b}`},
   {p:"mid", ra:"mill",rb:"mill",f:`{a}に{b} 削り抜く／芯まで澄んで 一級品`},
   {p:"multi",ra:"mill",rb:"spirit",f:`{a}に込める 職人の{b}／良い酒の道は これで決まる`},
   {p:"end", ra:"bitter",rb:"spirit",f:`最後に抑える この{a}／芯を支える 俺の{b}`},
   {p:"head",ra:"mill",rb:"bitter",f:`{a}を磨けば 締まる{b}／雑味を落として 芯を残す`},
   {p:"mid", ra:"bitter",rb:"spirit",f:`効かせた{a} 込めた{b}／芯まで通して 隙は見せねぇ`},
   {p:"head",ra:"spirit",f:`削られてなお 燃える{a}／芯の心白 崩れやしねぇ`},
   {p:"head",ra:"grain",f:`磨き抜かれた この{a}／心白抱いて どっしり構え`},
   {p:"mid", ra:"grain",f:`田から蔵まで 旅する{a}／原料あってこそ 酒になる`},
   {p:"multi",ra:"sweet",f:`喉越し豊かな 深き{a}／原料あってこそ 酒になる`},
   {p:"end", ra:"banzai",f:`飲んだ皆が 叫ぶ{a}／酒米あっての 良い酒だ`},
   {p:"head",ra:"grain",rb:"sweet",f:`{a}の中の 王者の{b}／磨き抜かれて 蔵へ向かう`},
   {p:"end", ra:"grain",rb:"banzai",f:`田から蔵まで 旅する{a}／飲んだ皆が 叫ぶ{b}`},
   {p:"head",ra:"umami",f:`削りの果てに 宿る{a}／芯の心白 崩れやしねぇ`},
   {p:"mid", ra:"junmai",f:`その名を名乗る 上等{a}／削りの果てに 光る力`},
   {p:"end", ra:"pear",f:`甘く香るは まるで{a}／原料あってこそ 酒になる`},
   {p:"multi",ra:"umami",f:`磨きが生むは 深き{a}／磨き抜かれた 底力`},
   {p:"multi",ra:"shukuhai",f:`蔵に響くは 高き{a}／原料あってこそ 酒になる`},
   {p:"mid", ra:"banzai",f:`蔵に響くは 高き{a}／原料あってこそ 酒になる`},
   {p:"multi",ra:"grain",f:`磨き抜かれた この{a}／削りの果てに 光る力`},
   {p:"end", ra:"umami",rb:"pear",f:`芯の心白 生むは{a}／甘く香るは まるで{b}`},
   {p:"head",ra:"junmai",rb:"umami",f:`{a}の名乗り 秘めた{b}／原料あってこそ 酒になる`},
   {p:"head",ra:"variety",rb:"variety",f:`{a}に{b} 名だたる系譜／磨き抜かれて 蔵へ向かう`},
   {p:"mid", ra:"variety",f:`その{a} 王者の風格／心白抱いて どっしり構え`},
   {p:"end", ra:"variety",f:`田から蔵まで 名乗るは{a}／原料あってこそ 酒になる`},
   {p:"multi",ra:"variety",rb:"variety",f:`{a}に{b} 血統誇り／磨き抜かれた 底力`},
   {p:"mid", ra:"variety",rb:"variety",f:`比べてみろよ {a}と{b}／酒米の格が まるで違う`},
 ]},
};

function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function shuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// エンジン：キャラの役割から、その場でバケット(母音)を導出→フレーム選択→韻語差し込み
function buildVerse(me,rnd){
  const rs=new Set(me.roles);
  const rpk=fr=>fr.ra+"|"+(fr.rb||"");
  // 使えるフレーム＝役割を保有 かつ（2韻語なら母音一致）かつ 語が存在
  const usable=me.frames.filter(fr=>{
    if(!rs.has(fr.ra)||!ROLE_WORDS[fr.ra])return false;
    if(!fr.rb)return true;
    if(!rs.has(fr.rb)||!ROLE_WORDS[fr.rb])return false;
    if(ROLE_SIG[fr.ra]!==ROLE_SIG[fr.rb])return false;      // 母音が合わない組は不可
    return fr.ra===fr.rb?ROLE_WORDS[fr.ra].length>=2:true;
  });
  const sigs=[...new Set(usable.map(fr=>ROLE_SIG[fr.ra]))];
  const key=sigs[Math.floor(rnd()*sigs.length)];
  const pool=usable.filter(fr=>ROLE_SIG[fr.ra]===key);
  const byPos={};pool.forEach(f=>{(byPos[f.p]=byPos[f.p]||[]).push(f);});
  const order=shuffle(["head","mid","end","multi"],rnd);
  const chosen=[],usedF=new Set();
  for(const p of order){let cand=(byPos[p]||[]).filter(f=>!usedF.has(f));const used=new Set(chosen.map(rpk));const fresh=cand.filter(f=>!used.has(rpk(f)));if(fresh.length)cand=fresh;if(cand.length){const fr=cand[Math.floor(rnd()*cand.length)];chosen.push(fr);usedF.add(fr);}}
  const rest=shuffle(pool.filter(f=>!usedF.has(f)),rnd);while(chosen.length<4&&rest.length)chosen.push(rest.pop());while(chosen.length<4&&pool.length)chosen.push(pool[Math.floor(rnd()*pool.length)]);
  const cnt={};const pickW=list=>{let mn=Infinity;list.forEach(w=>{const c=cnt[w]||0;if(c<mn)mn=c;});const cd=list.filter(w=>(cnt[w]||0)===mn);const w=cd[Math.floor(rnd()*cd.length)];cnt[w]=(cnt[w]||0)+1;return w;};
  const lines=shuffle(chosen,rnd).map(fr=>{
    const a=pickW(ROLE_WORDS[fr.ra]);let t=fr.f.replace("{a}",R(a));
    if(fr.rb){const bl=fr.ra===fr.rb?ROLE_WORDS[fr.rb].filter(w=>w!==a):ROLE_WORDS[fr.rb];t=t.replace("{b}",R(pickW(bl)));}
    return t;
  });
  return {key,lines};
}

// ── 検証 ──
console.log("辞書語数:",Object.keys(VOCAB).length,"| 役割数:",Object.keys(ROLE_WORDS).length,"| バケット(母音)数:",new Set(Object.values(ROLE_SIG)).size);
for(const id in F){const me=F[id];let vck=0,ok=0,h3=0,sameLine=0,uL=new Set(),uV=new Set();
 for(let s=1;s<=20000;s++){const{key,lines}=buildVerse(me,rng(s*137+id.length));vck++;let all=true;const words=[];for(const l of lines){uL.add(l.replace(/<[^>]+>/g,""));const ws=seg(l);if(ws.length===2&&ws[0]===ws[1])sameLine++;for(const w of ws){words.push(w);if(sig3(w)!==key)all=false;}}if(all)ok++;const cnt={};words.forEach(w=>cnt[w]=(cnt[w]||0)+1);if(words.length&&Math.max(...Object.values(cnt))>=3)h3++;uV.add(lines.map(l=>l.replace(/<[^>]+>/g,"")).join("|"));}
 console.log(`【${me.name}】韻:${Math.round(ok/vck*100)}% 3回以上:${(h3/vck*100).toFixed(1)}% 行内重複:${sameLine} ユニーク行:${uL.size} バース:${uV.size}`);
}
console.log("\n=== サンプル ===");
const m=s=>s.replace(/<[^>]+>/g,"");
for(const id in F){const{key,lines}=buildVerse(F[id],rng(id.length*61+4));console.log(`\n【${F[id].name}】[-${key}]`);lines.forEach(l=>console.log("  "+m(l)));}
