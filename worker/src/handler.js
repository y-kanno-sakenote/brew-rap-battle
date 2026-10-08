// 中継の中身（Node から単体テストできる形。SDK・プロンプトの取り込みは index.js が渡す）。
// 流れ: CORS(オリジン) → 入力検証 → 帳場（Durable Object 1個）で予算（日・月）と IP 回数を判定し見込み額を仮積み → 生成 → 検査
//       → 外れたら1回だけ作り直し → 出せたら実際の額で精算／こちらの失敗なら IP 回数を戻す → アプリが描画できる形（verses/flavor）で返す
import { IDS, checkBattle, toAppShape, userMessage, retryMessage } from "../../live/check.mjs";

const JSON_TYPE = "application/json; charset=utf-8";
const STYLES = ["standard", "savage"];
const BARS = [4, 8, 12];
export const THEME_MAX = 30;
const BODY_MAX = 2048;
// 生成に使える持ち時間（画面側は約200秒で諦めるので、その手前で切り上げる）と、作り直しに入るのに要る残り時間
export const DEADLINE_MS = 185_000;
export const MIN_RETRY_MS = 60_000;
// 料金（USD / 100万トークン）。claude-opus-5-5：入力4・出力20・キャッシュ読み0.2・キャッシュ書き込みは入力の1.25倍
export const PRICE_PER_MTOK = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };

/** 入力検証。戻り値 {ok:true, card} か {ok:false, message} */
export function validateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, message: "送られた内容が読めません" };
  const { aId, bId, bars, style = "standard", theme = "" } = body;
  if (!IDS.includes(aId) || !IDS.includes(bId)) return { ok: false, message: "対戦カードが正しくありません" };
  if (aId === bId) return { ok: false, message: "同じキャラ同士では戦えません" };
  const n = Number(bars);
  if (!BARS.includes(n)) return { ok: false, message: "小節数は4・8・12のどれかです" };
  if (!STYLES.includes(style)) return { ok: false, message: "作風が正しくありません" };
  if (typeof theme !== "string") return { ok: false, message: "お題は文字で入れてください" };
  // 制御文字・書式文字（ゼロ幅など）を除き、お題の囲み <お題>…</お題> を壊す山括弧も除く
  const t = theme.replace(/[\p{Cc}\p{Cf}]/gu, "").replace(/[<>＜＞]/g, "").trim();
  if ([...t].length > THEME_MAX) return { ok: false, message: `お題は${THEME_MAX}字までです` };
  return { ok: true, card: { aId, bId, bars: n, style, theme: t } };
}

/** 日本時間の日付・月（区切りの数え方は帳場 budget.js と共通） */
export { dayJST, monthJST } from "./budget.js";

/** 1回の呼び出しの usage → USD（input_tokens はキャッシュ分を含まない数え方） */
export function costUSD(usage) {
  if (!usage) return 0;
  const p = PRICE_PER_MTOK;
  return ((usage.input_tokens || 0) * p.input + (usage.output_tokens || 0) * p.output
    + (usage.cache_read_input_tokens || 0) * p.cacheRead + (usage.cache_creation_input_tokens || 0) * p.cacheWrite) / 1e6;
}

/** IP を数える単位に（IPv6 は /64 にまとめる）→ SHA-256 の先頭16桁（帳場に生の IP を残さない） */
export async function ipKey(ip) {
  let k = ip || "unknown";
  if (k.includes(":")) {
    const [head, tail = ""] = k.toLowerCase().split("::");
    const a = head ? head.split(":") : [], b = k.includes("::") && tail ? tail.split(":") : [];
    const full = k.includes("::") ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"), ...b] : a;
    k = full.slice(0, 4).join(":") + "::/64";
  }
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(k));
  return [...new Uint8Array(h)].slice(0, 8).map((x) => x.toString(16).padStart(2, "0")).join("");
}

const num = (v, d) => { const n = Number(v); return v !== "" && v != null && Number.isFinite(n) ? n : d; };

/**
 * deps.prompt: {system, user, retry}（live/prompt.md を splitPrompt したもの）
 * deps.generate(env, system, userText, {timeoutMs}) → {data|null, stopReason, usage}。
 *   API の失敗は {status, message} を、持ち時間切れは {status:504, message, timeout:true} を投げる
 */
export function createHandler(deps) {
  const now = deps.now || Date.now;
  return async function handle(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = okOrigin ? { "access-control-allow-origin": origin, vary: "Origin" } : { vary: "Origin" };
    const json = (status, body, extra = {}) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": JSON_TYPE, "cache-control": "no-store", ...cors, ...extra } });

    if (!okOrigin) return json(403, { error: "origin_not_allowed", message: "このページからは使えません" });
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" } });
    }
    if (req.method !== "POST") return json(405, { error: "method_not_allowed", message: "POST で送ってください" }, { allow: "POST, OPTIONS" });

    const raw = await req.text();
    if (raw.length > BODY_MAX) return json(400, { error: "bad_request", message: "送られた内容が長すぎます" });
    let body;
    try { body = JSON.parse(raw); } catch { return json(400, { error: "bad_request", message: "送られた内容が読めません" }); }
    const v = validateInput(body);
    if (!v.ok) return json(400, { error: "bad_request", message: v.message });
    const card = v.card;

    // 予算（実際に使った金額）と IP ごとの回数。検証を通った要求だけ見る。判定と仮積みは帳場（DO 1個）で1件ずつ＝同時の要求でも素通りしない
    if (!env.BUDGET) return json(500, { error: "no_budget", message: "いまは使えません" });
    const ledger = env.BUDGET.get(env.BUDGET.idFromName("budget"));
    const t0 = now();
    const est = num(env.EST_COST_USD, 0.15);
    let hold;
    try {
      hold = await ledger.reserve(await ipKey(req.headers.get("CF-Connecting-IP") || ""), est, {
        now: t0, daily: num(env.DAILY_BUDGET_USD, 0.66), monthly: num(env.MONTHLY_BUDGET_USD, 20), perIp: num(env.DAILY_LIMIT_PER_IP, 3),
      });
    } catch {
      return json(500, { error: "no_budget", message: "いまは使えません" });
    }
    // 文言は事実だけ。名勝負ミックスへの案内は画面側のボタンが受け持つ（二重に言わない）
    if (!hold.ok) {
      const message = hold.error === "budget_month" ? "今月の分は終わりました" : "今日の分は終わりました";
      return json(429, { error: hold.error, message }, { "retry-after": String(hold.retryAfter) });
    }

    // 生成 → 検査 → 外れたら1回だけ作り直し（作り直しは前回の案と外れた理由を添えた新しい1往復）。各呼び出しの usage を金額にして足す
    const { prompt } = deps;
    let text = userMessage(prompt.user, card);
    let best = null, tries = 0, spent = 0, failure = null;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const left = DEADLINE_MS - (now() - t0);
        if (attempt > 0 && left < MIN_RETRY_MS) break;   // 作り直す時間が残っていなければ手元の案で返す
        tries++;
        let out;
        try { out = await deps.generate(env, prompt.system, text, { timeoutMs: left }); }
        catch (e) {
          // 時間切れで打ち切った呼び出しは、そこまでの額が分からないので見込み額で数える
          if (e && e.usage) spent += costUSD(e.usage); else if (e && e.timeout) spent += est;
          throw e;
        }
        spent += costUSD(out.usage);
        const data = out.data;
        const res = data ? checkBattle(data, card) : null;
        if (data && res.structural && (!best || res.codes.length < best.res.codes.length)) best = { data, res };
        if (res && res.ok) break;
        if (data) text = retryMessage(prompt.user, prompt.retry, card, JSON.stringify(data), res.reasons);
      }
    } catch (e) {
      failure = e || {};
    }
    // 出せたら見込み → 実際の額に精算。出せなかった（こちらの失敗）なら IP の回数を戻し、金額は実際にかかった分だけ残す
    try {
      if (best) await ledger.settle(hold.id, spent);
      else await ledger.release(hold.id, spent);
    } catch (e) {
      console.error("budget settle failed", e && e.message);   // 仮積みの見込み額が残る＝多めに数えた側に倒れる
    }
    const RETRY = "うまく書けませんでした。もう一度押してください";
    // 作り直しが時間切れ・失敗でも、1回目の遊べる案があればそれを返す
    if (!best && failure) return json(failure.status || 502, { error: "upstream", message: (failure.status && failure.message) || RETRY });
    if (!best) return json(502, { error: "generation_failed", message: RETRY });
    return json(200, { ...toAppShape(best.data), meta: { model: env.MODEL, tries, ok: best.res.ok } });
  };
}
