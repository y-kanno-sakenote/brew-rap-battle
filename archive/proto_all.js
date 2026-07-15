// 厳密押韻ルールベース：全5キャラの韻ファミリー（方式A）＋検証
const V={};
const rows={a:"あかさたなはまやらわがざだばぱぁゃ",i:"いきしちにひみりゐぎじぢびぴぃ",u:"うくすつぬふむゆるぐずづぶぷぅゅ",e:"えけせてねへめれゑげぜでべぺぇ",o:"おこそとのほもよろをごぞどぼぽぉょ"};
for(const v in rows) for(const c of rows[v]) V[c]=v;
function vowels(seg){const o=[];for(const ch of seg){if(V[ch])o.push(V[ch]);else if(ch==="ー"||ch==="〜"){if(o.length)o.push(o[o.length-1]);}else if("んンっッ".includes(ch)){}else o.push("?");}return o;}
function tail2(seg){return vowels(seg).slice(-2).join("");}
const R=s=>`<span class="rhyme">${s}</span>`;
const segsOf=line=>[...line.matchAll(/<span class="rhyme">([^<]+)<\/span>/g)].map(x=>x[1]);

// 各キャラ: families{ key(末尾2母音): [ `前半 ${R(末尾A)}／後半 ${R(末尾B)}` ... ] }
const FIGHTERS={
  koji:{name:"麹菌",emoji:"🌾",families:{
    ua:[
      `蒸米に菌糸 ${R("這わすんだ")}／糖化の魔法 俺が ${R("かますんだ")}`,
      `デンプン割って 糖 ${R("生むんだ")}／室の温度も 俺が ${R("組むんだ")}`,
      `破精を利かせ 芯まで ${R("食うんだ")}／甘い旨味 そこで ${R("作るんだ")}`,
      `外硬内軟 選んで ${R("蒸すんだ")}／芯まで菌糸 深く ${R("攻めるんだ")}`,
      `酵素を湧かせ 旨味 ${R("盛るんだ")}／一麹の名 胸に ${R("刻むんだ")}`,
      `派手な香りも 元は ${R("俺が生むんだ")}／糖のねぇ蔵は すぐ ${R("詰むんだ")}`,
    ],
    ee:[
      `製麹三日 隙を ${R("見せねぇ")}／糖化の主役 譲りゃ ${R("しねぇ")}`,
      `温度も湿度も 手を ${R("抜かねぇ")}／麹の底力 ぶれや ${R("しねぇ")}`,
      `突き破精なら 誰にも ${R("負けねぇ")}／グルコアミラーゼ 止まら ${R("ねぇ")}`,
      `種麹の血統 崩れ ${R("やしねぇ")}／製麹こそが 品質 ${R("裏切らねぇ")}`,
      `室の職人 妥協 ${R("しねぇ")}／破精の仕上げに 抜かり ${R("ねぇ")}`,
      `俺を舐めたら 酒が ${R("危ねぇ")}／糖化なくして 発酵 ${R("できやしねぇ")}`,
    ],
  }},
  yeast:{name:"清酒酵母",emoji:"🫧",families:{
    uo:[
      `もろみに飛び込み 香り ${R("飛ばすぞ")}／二億の同胞 一気に ${R("醸すぞ")}`,
      `カプロン酸で メロン ${R("出すぞ")}／薫酒の王座 譲らず ${R("守るぞ")}`,
      `泡なし01 タンク ${R("攻めるぞ")}／溢れず効率 スター ${R("魅せるぞ")}`,
      `RIM15捨てて 限界 ${R("超えるぞ")}／二十度の壁も 軽く ${R("越えるぞ")}`,
      `低温もろみで じっくり ${R("攻めるぞ")}／吟醸香を 天まで ${R("上げるぞ")}`,
    ],
    ae:[
      `酢酸イソアミル バナナ ${R("香らせ")}／グラス開ければ 客を ${R("酔わせ")}`,
      `九号の血統 香りで ${R("躍らせ")}／もろみ沸かせて 熱を ${R("たぎらせ")}`,
      `エステル爆弾 一気に ${R("弾けさせ")}／脇役どもは 後ろに ${R("下がらせ")}`,
      `花から生まれ 芸風 ${R("広がらせ")}／蔵付きブレンド 個性 ${R("際立たせ")}`,
      `炭酸ガスで 泡を ${R("躍らせ")}／高泡立てて 頂 ${R("見せつけさせ")}`,
    ],
  }},
  toji:{name:"杜氏",emoji:"👘",families:{
    ua:[
      `三段仕込み 淀まず ${R("刻むんだ")}／初添え留添え 順に ${R("積むんだ")}`,
      `並行複発酵 俺が ${R("操るんだ")}／糖化と発酵 同時に ${R("回すんだ")}`,
      `櫂ひとつで 全部 ${R("動かすんだ")}／蔵の秩序は 俺が ${R("決めるんだ")}`,
      `火入れ六十五度 雑味 ${R("焼くんだ")}／火落ち菌ごと まとめ ${R("断つんだ")}`,
      `暴れる発酵 手綱 ${R("握るんだ")}／狙った酒質 一発 ${R("出すんだ")}`,
      `寒造り一本 命 ${R("込めるんだ")}／この蔵の味 俺が ${R("守るんだ")}`,
    ],
    ou:[
      `洗米浸漬 秒で ${R("見極めよう")}／限定吸水 狂い ${R("止めよう")}`,
      `あらばしりから せめまで ${R("読み切ろう")}／中取りの旨味 そこで ${R("掴み取ろう")}`,
      `蔵人まとめ ひとつに ${R("しよう")}／号令ひとつで 蔵を ${R("回そう")}`,
      `ひやおろし待つ 秋を ${R("狙おう")}／生詰め生貯蔵 引き出し ${R("増やそう")}`,
      `微生物どもの 喧嘩 ${R("裁こう")}／杜氏の度量 ここで ${R("見せよう")}`,
    ],
  }},
  lactic:{name:"乳酸菌",emoji:"🦠",families:{
    uo:[
      `生酛の底で 酸を ${R("効かすぞ")}／雑菌どもを 静かに ${R("散らすぞ")}`,
      `硝酸還元 バトン ${R("受け継ぐぞ")}／亜硝酸から 道を ${R("空けるぞ")}`,
      `低いpHで 結界 ${R("張るぞ")}／酵母の舞台 俺が ${R("守るぞ")}`,
      `菩提酛の昔 元祖 ${R("名乗るぞ")}／そやし水から 歴史 ${R("作るぞ")}`,
      `速醸なんかにゃ 出せぬ ${R("深さ見せるぞ")}／多層の酸味 織って ${R("魅せるぞ")}`,
    ],
    ee:[
      `甘さ自慢も 腐りゃ ${R("意味ねぇ")}／守る俺なしにゃ 酒は ${R("できねぇ")}`,
      `山廃仕込みの 陰で ${R("負けねぇ")}／地味な守りも 手は ${R("抜かねぇ")}`,
      `火落ち菌とは 一緒に ${R("すんねぇ")}／蔵を腐らす奴とは ${R("相容れねぇ")}`,
      `キレのある酸 飲み飽き ${R("させねぇ")}／醇酒のコクは 誰にも ${R("譲らねぇ")}`,
      `目立たねぇけど 抜けや ${R("しねぇ")}／俺が消えたら 蔵は ${R("もたねぇ")}`,
    ],
  }},
  rice:{name:"酒米",emoji:"🍚",families:{
    ee:[
      `すべての始まり 誰にも ${R("負けねぇ")}／山田錦の誇り 揺るぎゃ ${R("しねぇ")}`,
      `心白どまん中 隠しゃ ${R("しねぇ")}／溶けやすさじゃ 誰にも ${R("負けねぇ")}`,
      `特A地区の 誇りは 揺るが ${R("しねぇ")}／磨きの果てにゃ 綺麗しか ${R("残さねぇ")}`,
      `原料抜きにゃ 酒は ${R("できねぇ")}／田から蔵まで 旅は ${R("止まらねぇ")}`,
      `五百万石 雄町 名は ${R("汚さねぇ")}／現存酒米の祖 譲りゃ ${R("しねぇ")}`,
    ],
    uo:[
      `蒸せばα化 麹 ${R("迎えるぞ")}／さばけの良い肌 芯まで ${R("溶かすぞ")}`,
      `竪型精米 金剛ロールで ${R("削るぞ")}／四十八時間 磨き ${R("抜くぞ")}`,
      `雑味の元は 削って ${R("落とすぞ")}／磨きの果てで 綺麗 ${R("出すぞ")}`,
      `掛米麹米 役割 ${R("こなすぞ")}／どこに回っても 主役 ${R("張るぞ")}`,
      `でんぷんの塊 糖に ${R("変わるぞ")}／お前らの飯だ 感謝 ${R("させるぞ")}`,
    ],
  }},
};

// 検証
let ok=0,ck=0,fails=[];
for(const id in FIGHTERS){const f=FIGHTERS[id];
  for(const key in f.families){for(const line of f.families[key]){
    const s=segsOf(line); ck++;
    if(s.length===2 && tail2(s[0])===key && tail2(s[1])===key) ok++;
    else fails.push(`[${id}/${key}] ${s.map(x=>x+"("+tail2(x)+")").join(" / ")}`);
  }}
}
console.log(`内部韻（前半末尾＝後半末尾＝キー, 末尾2母音）: ${ok}/${ck} (${Math.round(ok/ck*100)}%)`);

// 生成バース AAAA 検証
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%1e5)/1e5;};}
function buildVerse(f,rnd){const keys=Object.keys(f.families).filter(k=>f.families[k].length>=4);const key=keys[Math.floor(rnd()*keys.length)];const pool=f.families[key].slice();const out=[];for(let i=0;i<4;i++){out.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);}return{key,lines:out};}
let vok=0,vck=0,vf=[];
for(const id in FIGHTERS){for(let s=1;s<=2000;s++){const{key,lines}=buildVerse(FIGHTERS[id],rng(s*97+id.length));const ends=lines.map(l=>tail2(segsOf(l)[1]));vck++;if(ends.every(e=>e===key))vok++;else if(vf.length<5)vf.push(`${id} ${key} ${ends}`);}}
console.log(`生成バース 行末AAAA(末尾2母音そろい): ${vok}/${vck} (${Math.round(vok/vck*100)}%)`);
if(fails.length){console.log("--- 内部韻NG ---");fails.forEach(x=>console.log("  "+x));}
if(vf.length){console.log("--- AAAA NG ---");vf.forEach(x=>console.log("  "+x));}
// families with <4 lines (生成対象外)
for(const id in FIGHTERS)for(const k in FIGHTERS[id].families){const n=FIGHTERS[id].families[k].length;if(n<4)console.log(`  注意: ${id}/${k} は${n}行(<4)で生成対象外`);}
