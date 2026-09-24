// 醸造ラップバトル 意味整合リンター（R2 形の純度 / R3 スロット適合）
// 使い方: node lint.js  （語やフレームを足したら必ず実行。0件で適合）
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8, html.indexOf('// ---- 選択UI ----'));
const sb={}; new Function('sandbox',script+'\n;Object.assign(sandbox,{FIGHTERS,ROLE_WORDS,ROLE_SIG,VOCAB,vowels,yomiOf});')(sb);
const {FIGHTERS,ROLE_WORDS,ROLE_SIG,vowels,yomiOf}=sb;
const sig3=y=>vowels(y).slice(-3);

// ── R2: 役割→form（語の“形/意味クラス”）。役割内の全語がこの form であること ──
const FORM = {
  koji:'物', kojikin:'物', komeu:'物', hakumai:'物', kakemai:'物', mill:'物', grain:'物',
  moto:'物', shubo:'物', bug:'物', vessel:'器', variety:'物', kanban:'物', yamahai:'物', koubo:'物', awa:'物',
  person:'人',
  gin:'産酒', type:'産酒', junmai:'産酒', karakuchi:'産酒', sakerui:'産酒', shinshu:'産酒', genshu:'産酒',
  aroma:'香り',
  umami:'味', sweet:'味', bitter:'味', acid:'味', nyusan:'味', sousan:'味', ringosan:'味',
  fruit:'果実', pear:'果実',
  banzai:'掛け声', shukuhai:'掛け声',
  hakkou:'工程', shikomi:'工程', moromi:'工程', zukuri:'工程', touka:'工程',
  hiire:'工程', jukusei:'工程', utase:'工程',
  spirit:'心意気', hokori:'心意気', kihaku:'心意気',
  teppeki:'心意気', shukumei:'心意気', ikigomi:'心意気',
  shinpaku:'物', dodai:'物', takuwae:'物', butai:'物', hinshu:'物',
  degree:'様子', hanayaka:'様子', nobiyaka:'様子', nameraka:'様子',
};
const NOUN=['物','器','人','産酒','香り','味','果実','工程','掛け声','心意気']; // 様子以外＝名詞系

// ── R3: スロット直前の連接語 → 許される form ──
const BEFORE = [
  { re:/^(この|その|あの)$/, allow:NOUN, note:'指示語→名詞（様子は不可）' },
  { re:/^(我が|俺の|己が)$/, allow:['物','器','人','産酒','工程','掛け声','心意気'], note:'所有→自分の名詞（様子/味/香り/果実は不可）' },
  { re:/^蔵の$/, allow:['物','器','人','産酒','工程'], note:'蔵の→名詞' },
  { re:/^(職人の|王者の)$/, allow:['物','心意気','産酒','味'], note:'職人の/王者の→物・心意気・味' },
  { re:/^(実に|どこまでも|なんとも)$/, allow:['様子'], note:'副詞→様子のみ' },
  { re:/^(もはや|まるで)$/, allow:['様子','果実','産酒'], note:'比況→様子・果実・産酒' },
  { re:/^(キレも|キレが|精度は|匂い|完成度)$/, allow:['様子','産酒'], note:'述語主語→様子・産酒' },
  { re:/^(熟れた|甘き|香る|立ちのぼる)$/, allow:['果実','香り'], note:'熟れた/香る→果実・香り' },
  { re:/^深き$/, allow:['味','産酒','香り'], note:'深き→味・産酒・香り' },
  { re:/^(濃き|上等|極み|攻めの|化ける|熟成映え|生む|生むは|醸す)$/, allow:['産酒','味','香り','物','工程'], note:'生む/攻めの→産物系名詞' },
  { re:/^(込めた|効かせた|抑えた)$/, allow:['味','心意気'], note:'込めた/効かせた→味・心意気' },
  { re:/^豊かな$/, allow:['味'], note:'豊かな→味' },
  { re:/^白き$/, allow:['物','果実'], note:'白き→物・果実' },
  { re:/^(蒸した|蒸れた|蒸される|削った|研いだ|削られ)$/, allow:['物'], note:'蒸した/削った→米（物）' },
  { re:/^(叫ぶ|みなで|皆で|飲めば)$/, allow:['掛け声','産酒'], note:'叫ぶ/飲めば→掛け声・産酒' },
  { re:/^(高き|高く)$/, allow:['掛け声','産酒'], note:'高き→掛け声・産酒' },
];
// 行頭スロット（直前が無い）→ 直後の助詞で判定
const HEAD_AFTER = [
  { re:/^(に|を|が|も|と|は)/, allow:NOUN, note:'行頭+助詞→名詞（様子は不可）' },
];

// ── 検査 ──
let flags=0, checked=0;
const noForm=Object.keys(ROLE_WORDS).filter(r=>!FORM[r]);
if(noForm.length) console.log('⚠ form未登録の役割:', noForm.join(','), '(FORMに追加せよ)');

for(const id in FIGHTERS){
  for(const fr of FIGHTERS[id].frames){
    const f=fr.f;
    for(const m of f.matchAll(/([^\s／]{0,5})\{([abc])\}([^\s／]{0,4})/g)){
      const before=m[1].trim(), slot=m[2], after=m[3];
      const role = slot==='a'?fr.ra:(slot==='b'?fr.rb:fr.rc); if(!role) continue;
      const form = FORM[role]; if(!form) continue;
      let rule = BEFORE.find(r=>r.re.test(before));
      if(!rule && !before) rule = HEAD_AFTER.find(r=>r.re.test(after));
      if(!rule) continue;
      checked++;
      if(!rule.allow.includes(form)){
        flags++;
        console.log(`✗ [${FIGHTERS[id].name}] 「${before||'▶'}{${slot}}${after}」= ${role}(${form}) ／ ${rule.note}`);
        console.log(`     例語: ${ROLE_WORDS[role].slice(0,4).join('・')}`);
        console.log(`     文: ${f}`);
      }
    }
  }
}
console.log(`\nR3検査: ${checked}スロット検査 / ${flags}件の不適合`);
console.log(flags===0?'✅ 全フレームがルール適合':'要修正');
