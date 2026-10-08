// 「Claude リクエスト生成」の出力検査（Worker と node テストが使う）。Python 版 live/check.py と同じ規則。
// 規則を変えたら両方を直し、live/check_cases.json を両方で回す（node --test worker/test ／ python3 tools/live_trial.py --self-test）。
//   - verses の数 = 小節数 / 2（4小節=2本・8小節=4本・12小節=6本）、先攻・後攻が交互、各4行
//   - 各バースで end_kana の最後の母音が4行で一致し、末尾3母音も一致（数え方は index.html の vowels() と同じ）
//   - 各行の行末は韻の印（<span class="rhyme">…</span>）で終わる（後ろは記号だけ可）。印以外のタグは不可
//   - 2番目以降のバースの1行目は、直前のバースの締め語を頭で拾って印を付ける

export const IDS = ["koji", "yeast", "toji", "lactic", "rice"];
export const NAMES = { koji: "麹菌", yeast: "清酒酵母", toji: "杜氏", lactic: "乳酸菌", rice: "酒米" };

// ---- かな→母音（index.html の _V / vowels() と同じ表・同じ数え方。拗音は2母音、ん・っは数えない、ー・〜は直前をくり返す）----
const _V = {};
{
  const rows = { a: "あかさたなはまやらわがざだばぱぁゃ", i: "いきしちにひみりゐぎじぢびぴぃ", u: "うくすつぬふむゆるぐずづぶぷぅゅ", e: "えけせてねへめれゑげぜでべぺぇ", o: "おこそとのほもよろをごぞどぼぽぉょ" };
  for (const v in rows) for (const c of rows[v]) _V[c] = v;
}
export function vowels(s) {
  const o = [];
  for (const ch of s) {
    if (_V[ch]) o.push(_V[ch]);
    else if (ch === "ー" || ch === "〜") { if (o.length) o.push(o[o.length - 1]); }
    else if ("んンっッ".includes(ch)) { /* 数えない */ }
    else o.push("?");
  }
  return o.join("");
}

const SPAN_G = /<span class="rhyme">([^<]*)<\/span>/g;
const END_MARK = /<span class="rhyme">([^<]+)<\/span>[\s!?！？。、，,．.…・」』）)〜ー♪]*$/;
const HEAD_MARK = /^[\s「『（(]*<span class="rhyme">([^<]+)<\/span>/;

function spans(text) { return [...String(text).matchAll(SPAN_G)].map((m) => m[1]); }

/** 検査。data は構造化出力そのまま（lines[] は {text, end_kana}）。戻り値 {ok, structural, codes, reasons} */
export function checkBattle(data, { aId, bId, bars }) {
  const codes = [], reasons = [];
  const add = (code, msg) => { codes.push(code); reasons.push(`${code} ${msg}`); };
  const verses = data && Array.isArray(data.verses) ? data.verses : null;
  if (!verses) {
    add("all:count", "verses がない");
    return { ok: false, structural: false, codes, reasons };
  }
  const want = bars / 2;
  if (verses.length !== want) add("all:count", `バースが${verses.length}本（${bars}小節なら${want}本）`);
  verses.forEach((v, i) => {
    const V = `V${i + 1}`;
    const who = i % 2 === 0 ? aId : bId;
    if (!v || v.characterId !== who) add(`${V}:speaker`, `話し手が ${v && v.characterId}（${who} の番）`);
    const lines = v && Array.isArray(v.lines) ? v.lines : [];
    if (lines.length !== 4 || !lines.every((l) => l && typeof l.text === "string" && typeof l.end_kana === "string")) {
      add(`${V}:lines`, `行が${lines.length}行（4行のはず）`);
      return;
    }
    const sigs = [];
    lines.forEach((l, j) => {
      const L = `${V}L${j + 1}`;
      if (/[<>]/.test(l.text.replace(SPAN_G, ""))) add(`${L}:html`, "韻の印以外のタグがある");
      if (!END_MARK.test(l.text)) add(`${L}:endmark`, "行末が韻の印で終わっていない");
      const vs = vowels(l.end_kana);
      if (!l.end_kana || vs.includes("?")) add(`${L}:kana`, `end_kana「${l.end_kana}」がひらがなだけでない`);
      else if (vs.length < 3) add(`${L}:kana`, `end_kana「${l.end_kana}」の母音が3つ未満`);
      else sigs.push({ j, vs });
    });
    if (sigs.length >= 2) {
      const lasts = new Set(sigs.map((s) => s.vs.slice(-1)));
      const sig3 = new Set(sigs.map((s) => s.vs.slice(-3)));
      const show = sigs.map((s) => `${lines[s.j].end_kana}=${s.vs.slice(-3).split("").join("-")}`).join("／");
      if (lasts.size > 1) add(`${V}:last`, `行末の最後の母音が割れた（${show}）`);
      else if (sig3.size > 1) add(`${V}:sig3`, `末尾3母音が一致しない（${show}）`);
    }
    if (i > 0) {
      const prev = verses[i - 1];
      const prevLast = prev && Array.isArray(prev.lines) && prev.lines[3] && typeof prev.lines[3].text === "string" ? spans(prev.lines[3].text).pop() : undefined;
      const m = HEAD_MARK.exec(lines[0].text);
      const head = m ? m[1].trim() : "";
      const ok = head && prevLast && (head === prevLast || head.includes(prevLast) || prevLast.includes(head));
      if (!ok) add(`${V}L1:retort`, `1行目の頭で相手の締め語「${prevLast || "?"}」を拾っていない`);
    }
  });
  const structural = !codes.some((c) => /:(count|speaker|lines)$/.test(c));
  return { ok: codes.length === 0, structural, codes, reasons };
}

/** アプリ（index.html の drawAiBattle）が受け取る形に直す: {verses:[{characterId, characterName, displayRhyme, lines:[文字列×4]}], flavor} */
export function toAppShape(data) {
  return {
    verses: data.verses.map((v) => {
      const last = v.lines.map((l) => vowels(l.end_kana)).find((vs) => vs.length >= 3 && !vs.includes("?"));
      return {
        characterId: v.characterId,
        characterName: NAMES[v.characterId] || v.characterName,
        displayRhyme: last ? last.slice(-3).split("").join("-") : v.displayRhyme,
        lines: v.lines.map((l) => l.text),
      };
    }),
    flavor: data.flavor,
  };
}

// ---- プロンプト（live/prompt.md）の分割と差し込み。Python 版と同じ印・同じ置き換え ----
const USER_MARK = "<!-- USER_TEMPLATE -->", RETRY_MARK = "<!-- RETRY_TEMPLATE -->";
export function splitPrompt(md) {
  const [system, rest] = md.split(USER_MARK);
  const [user, retry] = rest.split(RETRY_MARK);
  return { system: system.trim(), user: user.trim(), retry: retry.trim() };
}
export function fill(tpl, vars) { return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => (k in vars ? String(vars[k]) : "")); }
export function userMessage(tpl, { aId, bId, bars, style, theme }) {
  const n = bars / 2;
  const order = Array.from({ length: n }, (_, i) => NAMES[i % 2 === 0 ? aId : bId]).join("→");
  return fill(tpl, { A_NAME: NAMES[aId], A_ID: aId, B_NAME: NAMES[bId], B_ID: bId, BARS: bars, VERSES: n, ORDER: order, STYLE: style, THEME: theme || "" });
}
export function retryMessage(userTpl, retryTpl, card, previousJson, reasons) {
  return `${userMessage(userTpl, card)}\n\n${fill(retryTpl, { REASONS: reasons.map((r) => `- ${r}`).join("\n"), PREVIOUS: previousJson })}`;
}
