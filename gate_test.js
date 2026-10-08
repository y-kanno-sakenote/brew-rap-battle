// 担当: ✅ 検証係（マンガー×ファインマン）
// C案（Ollama）採点ゲートの独立検証。index.html の <script> を harness.js と同じ流儀で eval し、
// DOM/localStorage/fetch をスタブにして renderBattleOllama を直接叩く。
// 4節で B案「Claude（お題でつくる）」の画面側（中継への送信・描画・断られた時）もモック fetch で確かめる。
//   node gate_test.js        … 単体＋モック fetch のループ検証
//   node gate_test.js live   … 実機 Ollama(localhost:11434, gemma4:12b) で3バトル
const fs = require('fs');
const HTML = '/Users/ymacmini/Documents/claudecode@macmini/dev/brew-rap-battle/index.html';
const html = fs.readFileSync(HTML, 'utf8');

function load({ usageLogic = true, hook = null } = {}) {
  let script = html.slice(html.indexOf('<script>') + 8, html.indexOf('// ---- 選択UI ----'));
  // 実コードの corpus 部分（CORPUS_KEY〜saveToCorpus）を原文のまま連結
  const cs = html.indexOf("const CORPUS_KEY = 'brew_corpus';");
  const ce = html.indexOf('function exportCorpus()');
  script += '\n' + html.slice(cs, ce);
  if (!usageLogic) {
    if (!script.includes('const USAGE_LOGIC = true;')) throw new Error('USAGE_LOGIC 行が見つからない');
    script = script.replace('const USAGE_LOGIC = true;', 'const USAGE_LOGIC = false;');
  }
  // 試行ごとの gate を覗くフック（in-memory のみ・append-only）
  const anchor = 'r.gate = usageGateValue(usageScore(r.cleanVerses)); r.tries = t;';
  if (!script.includes(anchor)) throw new Error('フック位置が見つからない: ' + anchor);
  script = script.replace(anchor, anchor + ' if(__hook) __hook(r);');

  // ---- DOM/ストレージのスタブ ----
  const el = () => { const o = { value: '', textContent: '', style: {}, _html: '', history: [] };
    Object.defineProperty(o, 'innerHTML', { get() { return o._html; }, set(v) { o._html = v; o.history.push(v); } });
    o.scrollIntoView = () => {}; return o; };
  const elements = { battleStyle: el(), battleTheme: el(), corpusTray: el(), corpusCount: el() };
  elements.battleStyle.value = 'standard';
  const document = { getElementById: id => elements[id] || el(), createElement: () => el() };
  const store = {};
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const battle = el(), beat = el(), stage = el(), ollamaModelInput = el(), ollamaHostInput = el();
  ollamaModelInput.value = 'gemma4:12b'; ollamaHostInput.value = 'http://localhost:11434';
  const fetchHolder = { fn: () => { throw new Error('fetch 未設定'); } };
  const fetch = (...a) => fetchHolder.fn(...a);
  const quiet = { error: () => {}, log: console.log, warn: () => {} };

  const sandbox = {};
  const fn = new Function('sandbox', 'document', 'localStorage', 'fetch', 'console', 'battle', 'beat', 'stage', 'ollamaModelInput', 'ollamaHostInput', '__hook',
    script + '\n; Object.assign(sandbox,{usageScore,usageGateValue,USAGE_GATE,USAGE_LOGIC,renderBattleOllama,FIGHTERS,loadCorpus,VOCAB_ATTRS});');
  fn(sandbox, document, localStorage, fetch, quiet, battle, beat, stage, ollamaModelInput, ollamaHostInput, hook);
  return { ...sandbox, battle, store, fetchHolder, elements };
}

// ---- モック応答の材料 ----
const V = (cid, name, lines) => ({ characterId: cid, characterName: name, displayRhyme: 'o-i', lines });
const HIGH = [V('koji', '麹菌', ['白麹', '種麹', '黄麹', '糖化酵素']), V('yeast', '酵母', ['清酒酵母', '花酵母', '協会酵母', '吟醸香'])];
const LOW = [V('koji', '麹菌', ['乾杯', '祝杯', '徳利', '吟醸']), V('yeast', '酵母', ['乾杯', '祝杯', '徳利', '吟醸'])];
const LOW2 = [V('koji', '麹菌', ['山田錦', '乾杯', '山田錦', '吟醸']), V('yeast', '酵母', ['山田錦', '乾杯', '山田錦', '吟醸'])];
const NONE = [V('koji', '麹菌', ['あ', 'い', 'う', 'え']), V('yeast', '酵母', ['か', 'き', 'く', 'け'])];
const ok = verses => async () => ({ ok: true, status: 200, json: async () => ({ message: { content: JSON.stringify({ verses, flavor: 'test' }) } }), text: async () => '' });
const badjson = async () => ({ ok: true, status: 200, json: async () => ({ message: { content: 'これはJSONではない' } }), text: async () => '' });
const neterr = async () => { throw new TypeError('Failed to fetch'); };
const http500 = async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => 'boom' });
function seq(list) { let i = 0; const calls = []; const fn = async (url, opt) => { calls.push({ url, opt }); const r = list[Math.min(i, list.length - 1)]; i++; return r(); }; return { fn, calls }; }

let pass = 0, fail = 0, HIGH_G = null;
function check(name, cond, detail) { if (cond) { pass++; console.log(`  PASS ${name}${detail ? '  [' + detail + ']' : ''}`); } else { fail++; console.log(`  FAIL ${name}${detail ? '  [' + detail + ']' : ''}`); } }

async function unit() {
  console.log('== 1. 単体: usageGateValue ==');
  const { usageGateValue, usageScore } = load();
  check('null入力 → null', usageGateValue(null) === null);
  check('ownRate null → null', usageGateValue({ ownRate: null, punchRate: 1, backRate: 0, properRepeat: 0 }) === null);
  check('punchRate null → null', usageGateValue({ ownRate: 1, punchRate: null, backRate: 0, properRepeat: 0 }) === null);
  check('backRate null → 1扱い (1+1+1=3)', usageGateValue({ ownRate: 1, punchRate: 1, backRate: null, properRepeat: 0 }) === 3, usageGateValue({ ownRate: 1, punchRate: 1, backRate: null, properRepeat: 0 }));
  check('backRate 0.5 → 0.5加算', usageGateValue({ ownRate: 0, punchRate: 0, backRate: 0.5, properRepeat: 0 }) === 0.5);
  check('properRepeat 2 → −0.5', usageGateValue({ ownRate: 1, punchRate: 1, backRate: 0, properRepeat: 2 }) === 2.5);
  check('全ゼロ+repeat → 負値もそのまま', usageGateValue({ ownRate: 0, punchRate: 0, backRate: 1, properRepeat: 1 }) === -0.25);
  check('小数2桁丸め', usageGateValue({ ownRate: 0.33, punchRate: 0.67, backRate: 0.333, properRepeat: 0 }) === 1.67, usageGateValue({ ownRate: 0.33, punchRate: 0.67, backRate: 0.333, properRepeat: 0 }));
  // usageScore 経由でモック素材の実値を確定（ループ検証の前提）
  const g = vs => usageGateValue(usageScore(vs));
  console.log('  素材の実値: HIGH=' + g(HIGH) + ' LOW=' + g(LOW) + ' LOW2=' + g(LOW2) + ' NONE=' + g(NONE) + '  詳細LOW2=' + JSON.stringify(usageScore(LOW2)));
  check('素材 HIGH>=1.5 / LOW=1 / LOW2=0.75 / NONE=null（HIGH の実値は下のループ検証の期待値に使う）', g(HIGH) >= 1.5 && g(LOW) === 1 && g(LOW2) === 0.75 && g(NONE) === null);
  HIGH_G = g(HIGH);
}

async function run(list, opts = {}) {
  const gates = [];
  const env = load({ ...opts, hook: r => gates.push(r.gate) });
  const s = seq(list); env.fetchHolder.fn = s.fn;
  // モック素材は2バース。bars=4（rounds=1→要求2バース）で本数条件を満たす。本数不足の検証だけ bars=8 を渡す
  await env.renderBattleOllama('koji', 'yeast', opts.bars || 4);
  const corpus = env.loadCorpus();
  const rec = corpus[corpus.length - 1] || null;
  return { callList: s.calls, calls: s.calls.length, gates, rec, html: env.battle.innerHTML, history: env.battle.history, corpusLen: corpus.length };
}

async function loop() {
  console.log('== 2. ループ（モック fetch） ==');
  let r;
  r = await run([ok(LOW), ok(HIGH)]);
  check('(a) 低→高: fetch 2回・tries=2・gate=HIGH実値', r.calls === 2 && r.rec && r.rec.tries === 2 && r.rec.gate === HIGH_G, `calls=${r.calls} gates=${JSON.stringify(r.gates)} rec.gate=${r.rec && r.rec.gate} rec.tries=${r.rec && r.rec.tries}`);
  check('(a) 再生成中の表示に「醸造し直し中（2/3）」', r.history.some(h => h.includes('醸造し直し中（2/3）')), JSON.stringify((r.history[1]||'').replace(/<[^>]+>/g,'').trim()));
  check('(a) 画面に HIGH の行が出る', r.html.includes('糖化酵素') && r.html.includes('mic drop'));

  r = await run([ok(LOW2), ok(LOW), ok(LOW2)]);
  check('(b) 3回とも低: fetch 3回・最良(1.0)は2回目 → tries=2', r.calls === 3 && r.rec && r.rec.gate === 1 && r.rec.tries === 2, `calls=${r.calls} gates=${JSON.stringify(r.gates)} rec.gate=${r.rec && r.rec.gate} rec.tries=${r.rec && r.rec.tries}`);
  check('(b) 画面は最良(LOW=乾杯…)の行', r.html.includes('乾杯') && !r.html.includes('山田錦'));
  r = await run([ok(LOW2), ok(LOW2), ok(LOW)]);
  check('(b\') 最良が3回目 → tries=3', r.calls === 3 && r.rec && r.rec.gate === 1 && r.rec.tries === 3, `gates=${JSON.stringify(r.gates)} tries=${r.rec && r.rec.tries}`);
  r = await run([ok(LOW), ok(LOW2), ok(LOW)]);
  check('(b\'\') 同点(1,0.75,1) → 先勝ち tries=1', r.rec && r.rec.tries === 1, `tries=${r.rec && r.rec.tries}`);

  r = await run([badjson, ok(HIGH)]);
  check('(c) 1回目JSON不正→2回目成功: fetch 2回・tries=2・エラー表示なし', r.calls === 2 && r.rec && r.rec.tries === 2 && r.rec.gate === HIGH_G && !r.html.includes('⚠️'), `calls=${r.calls} gates=${JSON.stringify(r.gates)}`);
  r = await run([neterr, ok(HIGH)]);
  check('(c\') 1回目ネットワーク失敗→2回目成功', r.calls === 2 && r.rec && r.rec.tries === 2 && !r.html.includes('⚠️'), `calls=${r.calls}`);

  r = await run([ok(HIGH)], { bars: 8 });
  check('(g) 本数不足(2/4バース)は高スコアでも不合格 → 3回叩いて最良を採用・full=false', r.calls === 3 && r.rec && r.rec.full === false && r.rec.gate === HIGH_G, `calls=${r.calls} full=${r.rec && r.rec.full}`);
  r = await run([ok(LOW), ok(HIGH)], { bars: 4 });
  check('(g\') 本数が揃えば従来どおり2回目で採用・full=true', r.calls === 2 && r.rec && r.rec.full === true, `calls=${r.calls} full=${r.rec && r.rec.full}`);

  r = await run([neterr, http500, badjson]);
  check('(d) 3回失敗: fetch 3回・コーパス未保存・画面に ⚠️', r.calls === 3 && r.corpusLen === 0 && r.html.includes('⚠️ Ollamaでエラー'), `calls=${r.calls} corpus=${r.corpusLen}`);
  check('(d) 表示メッセージは最後の例外（JSON取り出し失敗）', r.html.includes('モデル出力からJSONを取り出せませんでした'), r.html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 120));
  r = await run([http500, http500, http500]);
  check('(d\') HTTP500×3 → 画面に "Ollama HTTP 500 boom"', r.calls === 3 && r.html.includes('Ollama HTTP 500 boom'));
  r = await run([neterr, neterr, neterr]);
  check('(d\'\') Failed to fetch×3 → 接続案内のヒント', r.calls === 3 && r.html.includes('Ollamaに接続できません'));

  r = await run([ok(LOW), ok(HIGH)], { usageLogic: false });
  check('(e) USAGE_LOGIC=false: fetch 1回・tries=1・低スコアでも採用', r.calls === 1 && r.rec && r.rec.tries === 1 && r.rec.gate === 1, `calls=${r.calls} gates=${JSON.stringify(r.gates)} rec.gate=${r.rec && r.rec.gate}`);
  r = await run([neterr, ok(HIGH)], { usageLogic: false });
  check('(e\') USAGE_LOGIC=false で1回目失敗 → 再試行せずエラー表示', r.calls === 1 && r.html.includes('⚠️'), `calls=${r.calls}`);

  console.log('-- 追加（仕様の穴を測る）--');
  r = await run([neterr, ok(LOW), neterr]);
  check('(g) 失敗→低→失敗: 最後が失敗でも best(1.0, tries=2) を採用・エラー非表示', r.calls === 3 && r.rec && r.rec.gate === 1 && r.rec.tries === 2 && !r.html.includes('⚠️'), `calls=${r.calls} gates=${JSON.stringify(r.gates)}`);
  r = await run([ok(NONE), ok(HIGH)]);
  console.log(`  (f1) 1回目が語彙ゼロ(gate=null): calls=${r.calls} gates=${JSON.stringify(r.gates)} rec.gate=${r.rec && r.rec.gate} tries=${r.rec && r.rec.tries} → ${r.calls === 1 ? 'null を「合格」扱いで即採用（再生成しない）' : '再生成した'}`);
  r = await run([ok(LOW), ok(NONE), ok(HIGH)]);
  console.log(`  (f2) 低(1.0)→語彙ゼロ(null)→高: calls=${r.calls} gates=${JSON.stringify(r.gates)} rec.gate=${r.rec && r.rec.gate} tries=${r.rec && r.rec.tries} → ${r.calls === 2 ? 'null でループ打ち切り、基準未満の1回目を採用（3回目の高スコアは試されない）' : '3回目まで試した'}`);
  r = await run([ok(LOW)]);
  check('保存レコードに usage/gate/tries/model が揃う', r.rec && r.rec.usage && typeof r.rec.gate === 'number' && r.rec.tries === 1 && r.rec.model === 'ollama:gemma4:12b' && r.rec.mode === 'ollama', JSON.stringify({ gate: r.rec.gate, tries: r.rec.tries, usage: r.rec.usage }));
  { const c0 = r.callList[0] || {}, bo = c0.opt ? JSON.parse(c0.opt.body) : {};
    check('(t) Ollama への送信に think:false（gemma4 の思考オンで空出力・時間切れになるのを防ぐ）と format:"json"', bo.think === false && bo.format === 'json', JSON.stringify({ think: bo.think, format: bo.format })); }
}

// ---- B案 Claude（お題でつくる）：中継（worker/）の応答をモックして画面側を確かめる ----
function loadClaude({ url = 'https://live.example/' } = {}) {
  let script = html.slice(html.indexOf('<script>') + 8, html.indexOf('// ---- 選択UI ----'));
  const cs = html.indexOf("const CORPUS_KEY = 'brew_corpus';"), ce = html.indexOf('function exportCorpus()');
  script += '\n' + html.slice(cs, ce);
  if (!/const LIVE_API_URL = '[^']*';/.test(script)) throw new Error('LIVE_API_URL 行が見つからない');
  script = script.replace(/const LIVE_API_URL = '[^']*';/, `const LIVE_API_URL = ${JSON.stringify(url)};`);
  // 子要素を持てる最小の DOM（textContent は子の連結。innerHTML を入れると子は消える）
  const node = () => { const o = { className: '', style: {}, value: '', children: [], _text: null, _html: '', history: [] };
    o.appendChild = c => { o.children.push(c); return c; }; o.append = (...cs) => cs.forEach(c => o.children.push(c));
    Object.defineProperty(o, 'textContent', { get() { return o._text != null ? o._text : o.children.map(c => c.textContent).join(''); }, set(v) { o._text = String(v); } });
    Object.defineProperty(o, 'innerHTML', { get() { return o._html + o.children.map(c => c.textContent).join(''); }, set(v) { o._html = v; o.children = []; o.history.push(v); } });
    o.querySelector = () => o.appendChild(node()); o.scrollIntoView = () => {}; o.dispatchEvent = () => {}; return o; };
  const elements = { battleStyle: node(), battleTheme: node(), corpusTray: node(), corpusCount: node() };
  elements.battleStyle.value = 'savage'; elements.battleTheme.value = '梅雨の夜';
  const document = { getElementById: id => elements[id] || node(), createElement: () => node(), createTextNode: t => { const n = node(); n.textContent = t; return n; } };
  const store = {};
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const battle = node(), beat = node(), stage = node(), engineSel = node();
  engineSel.value = 'claude';
  const calls = [], fetchHolder = { fn: null };
  const fetch = (u, o) => { calls.push({ url: u, opt: o }); return fetchHolder.fn(u, o); };
  const sandbox = {};
  new Function('sandbox', 'document', 'localStorage', 'fetch', 'console', 'battle', 'beat', 'stage', 'engineSel', 'ollamaModelInput', 'ollamaHostInput',
    script + '\n; Object.assign(sandbox,{renderBattleClaude,loadCorpus,LIVE_TIMEOUT_MS});')(sandbox, document, localStorage, fetch, { error: () => {}, log: console.log, warn: () => {} }, battle, beat, stage, engineSel, node(), node());
  return { ...sandbox, battle, engineSel, calls, fetchHolder };
}
const reply = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const LIVE_OK = { verses: [
  { characterId: 'koji', characterName: '麹菌', displayRhyme: 'o-u-a', lines: ['蔵に舞う<span class="rhyme">糖化</span>', '二行目', '三行目', '四行目<span class="rhyme">効果</span>'] },
  { characterId: 'yeast', characterName: '清酒酵母', displayRhyme: 'a-a-a', lines: ['<span class="rhyme">効果</span>なら俺', 'b2', 'b3', 'b4'] } ],
  flavor: '吟醸酒', meta: { model: 'claude-opus-5-5', tries: 1, ok: true } };

async function claude() {
  console.log('== 4. B案 Claude（お題でつくる）・モック中継 ==');
  let e = loadClaude();
  e.fetchHolder.fn = reply(200, LIVE_OK);
  await e.renderBattleClaude('koji', 'yeast', 4);
  const sent = e.calls[0] && JSON.parse(e.calls[0].opt.body);
  check('(L1) 中継へ1回 POST・送るのは対戦カード/小節数/作風/お題だけ', e.calls.length === 1 && e.calls[0].url === 'https://live.example/' && e.calls[0].opt.method === 'POST'
    && JSON.stringify(sent) === JSON.stringify({ aId: 'koji', bId: 'yeast', bars: 4, style: 'savage', theme: '梅雨の夜' }), JSON.stringify(sent));
  check('(L1) 生成中の表示が出てから描画される', e.battle.history.some(h => h.includes('醸造中')));
  const txt = e.battle.textContent;
  check('(L1) 返ってきた行・韻の印・乾杯が出る（印のタグは文字として出ない）', txt.includes('蔵に舞う糖化') && txt.includes('効果なら俺') && txt.includes('mic drop') && txt.includes('吟醸酒') && !txt.includes('<span'), txt.slice(0, 80));
  const rhymes = e.battle.children.flatMap(v => (v.children[1] || { children: [] }).children).filter(c => c.className === 'rhyme').map(c => c.textContent);
  check('(L1) 韻語は class="rhyme" の要素に組み直す', JSON.stringify(rhymes) === JSON.stringify(['糖化', '効果', '効果']), JSON.stringify(rhymes));
  const rec = e.loadCorpus()[0];
  check('(L1) コーパスに claude: のモデル名・お題・作風で残す', rec && rec.model === 'claude:claude-opus-5-5' && rec.theme === '梅雨の夜' && rec.style === 'savage' && rec.data.verses.length === 2, rec && rec.model);

  e = loadClaude();
  e.fetchHolder.fn = reply(200, { ...LIVE_OK, meta: { model: 'claude-opus-5-5', tries: 2, ok: false } });
  await e.renderBattleClaude('koji', 'yeast', 4);
  check('(L2) meta.ok:false（2回とも韻が外れた）でもそのまま出す', e.battle.textContent.includes('蔵に舞う糖化') && !e.battle._html.includes('名勝負ミックスで遊ぶ'));

  e = loadClaude();
  e.fetchHolder.fn = reply(429, { error: 'budget_day', message: '今日の分は終わりました' });
  await e.renderBattleClaude('koji', 'yeast', 4);
  check('(L3) 429：中継の文言を出し、名勝負ミックスに戻す・コーパスに残さない', e.battle.textContent.includes('今日の分は終わりました') && e.engineSel.value === 'template' && e.battle._html.includes('名勝負ミックスで遊ぶ') && e.loadCorpus().length === 0, e.battle.textContent);

  e = loadClaude();
  e.fetchHolder.fn = reply(502, { error: 'generation_failed', message: 'うまく書けませんでした。もう一度押してください' });
  await e.renderBattleClaude('koji', 'yeast', 4);
  check('(L4) 502：中継の日本語の理由を出す・エンジンはそのまま', e.battle.textContent.includes('うまく書けませんでした') && e.engineSel.value === 'claude');

  e = loadClaude();
  e.fetchHolder.fn = async () => { throw new TypeError('Failed to fetch'); };
  await e.renderBattleClaude('koji', 'yeast', 4);
  check('(L5) つながらない：英語の例外文をそのまま出さない', e.battle.textContent.includes('つながりませんでした') && !e.battle.textContent.includes('Failed to fetch'), e.battle.textContent);

  e = loadClaude();
  e.fetchHolder.fn = reply(500, {});
  await e.renderBattleClaude('koji', 'yeast', 4);
  check('(L6) 理由の無いエラーでも短い日本語', /うまくつながりませんでした（500）/.test(e.battle.textContent), e.battle.textContent);

  check('(L7) 待ち時間の上限は約200秒（中継の持ち時間185秒より長い）', e.LIVE_TIMEOUT_MS >= 190000 && e.LIVE_TIMEOUT_MS <= 210000, e.LIVE_TIMEOUT_MS);
  check('(L8) 中継の URL が空のあいだは選択肢を出さない', /if \(!LIVE_API_URL\)[^\n]*option\[value="claude"\][^\n]*remove\(\)/.test(html));
  check('(L9) お題の入力欄は30字まで', /id="battleTheme"[^>]*maxlength="30"/.test(html));
  check('(L10) Gemini の選択肢・キー入力欄・キーの保存が残っていない', !/value="gemini"|id="apiKey|setItem\('gemini_api_key'|generativelanguage/.test(html));
}

async function live() {
  console.log('== 3. 実機 Ollama（gemma4:12b, 8小節=4バース, 各バトル最大3回生成） ==');
  const pairs = [['koji', 'yeast'], ['lactic', 'toji'], ['rice', 'koji']];
  const out = [];
  for (const [a, b] of pairs) {
    const gates = [], durs = [];
    const env = load({ hook: r => gates.push(r.gate) });
    let n = 0;
    env.fetchHolder.fn = async (url, opt) => { n++; const t0 = Date.now(); try { return await globalThis.fetch(url, { ...opt, signal: AbortSignal.timeout(600000) }); } finally { durs.push(((Date.now() - t0) / 1000).toFixed(1)); } };
    const T0 = Date.now();
    await env.renderBattleOllama(a, b, 8);
    const sec = ((Date.now() - T0) / 1000).toFixed(1);
    const rec = env.loadCorpus()[0] || null;
    const err = env.battle.innerHTML.includes('⚠️') ? env.battle.innerHTML.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 160) : '';
    const row = { pair: `${a}×${b}`, gates, tries_best: rec && rec.tries, gate_best: rec && rec.gate, calls: n, per_call_sec: durs, total_sec: sec, usage: rec && rec.usage, err };
    console.log('  ' + JSON.stringify(row));
    if (rec) console.log('    採用バース(先頭2):' + rec.data.verses.slice(0, 2).map(v => ' ' + v.characterName + '『' + v.lines.map(l => l.replace(/<[^>]+>/g, '')).join('／') + '』').join(''));
    out.push(row);
  }
  fs.writeFileSync('/Users/ymacmini/Documents/claudecode@macmini/dev/brew-rap-battle/verification/gate_live.json', JSON.stringify(out, null, 1));
}

(async () => {
  if (process.argv[2] === 'live') { await live(); return; }
  await unit(); await loop(); await claude();
  console.log(`\n合計: PASS ${pass} / FAIL ${fail}`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error('テスト実行エラー:', e); process.exitCode = 2; });
