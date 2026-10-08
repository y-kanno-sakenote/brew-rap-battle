// Cloudflare Workers の入口（npx wrangler deploy でこれをバンドルする）。中身は handler.js（Node から単体テストできる形）。
// プロンプトとスキーマは Python 試作（tools/live_trial.py）と同じ live/ のファイルをバンドル時に取り込む。
import Anthropic from "@anthropic-ai/sdk";
import { DurableObject } from "cloudflare:workers";
import promptMd from "../../live/prompt.md";
import schema from "../../live/schema.json";
import { splitPrompt } from "../../live/check.mjs";
import { createHandler } from "./handler.js";
import { Budget } from "./budget.js";

const MAX_TOKENS = 16000;

/**
 * Claude をストリーミングで呼び、最終メッセージから JSON を取り出す。
 * timeoutMs を過ぎたら打ち切る（画面側の待ち時間の上限に収めるため）。API の失敗は {status, message}（日本語）にして投げる
 */
async function generate(env, system, userText, { timeoutMs = 185_000 } = {}) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  let msg;
  const stream = client.messages.stream({
    model: env.MODEL || "claude-opus-5-5",
    max_tokens: MAX_TOKENS,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userText }],
    output_config: { effort: env.EFFORT || "low", format: { type: "json_schema", schema } },
  });
  const timer = setTimeout(() => stream.abort(), Math.max(1000, timeoutMs));
  try {
    msg = await stream.finalMessage();
  } catch (e) {
    // 運用の手がかり（キーは出さない）: wrangler tail で見る
    console.error("anthropic_error", e?.constructor?.name, e?.status ?? "", String(e?.message ?? e).slice(0, 300));
    if (e instanceof Anthropic.APIUserAbortError || e instanceof Anthropic.APIConnectionTimeoutError) {
      throw { status: 504, timeout: true, message: "時間がかかりすぎました。もう一度押してください" };
    }
    if (e instanceof Anthropic.RateLimitError || (e instanceof Anthropic.APIError && (e.status === 529 || e.status === 503))) {
      throw { status: 503, message: "AIが混み合っています。少し待ってからもう一度押してください" };
    }
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      throw { status: 500, message: "いまは使えません" };
    }
    if (e instanceof Anthropic.APIError) throw { status: 502, message: "うまく書けませんでした。もう一度押してください" };
    throw e;
  } finally {
    clearTimeout(timer);
  }
  // refusal・max_tokens などで止まった時は data なし（handler が1回だけ作り直す）
  if (msg.stop_reason !== "end_turn") return { data: null, stopReason: msg.stop_reason, usage: msg.usage };
  const block = msg.content.find((b) => b.type === "text");
  try {
    return { data: JSON.parse(block ? block.text : ""), stopReason: msg.stop_reason, usage: msg.usage };
  } catch {
    return { data: null, stopReason: msg.stop_reason, usage: msg.usage };
  }
}

/** 予算と IP 回数の帳場（SQLite バックエンドの Durable Object を1個だけ使う＝要求を1件ずつ処理）。中身は budget.js */
export class BudgetDO extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.b = new Budget(ctx); }
  reserve(ipK, est, opts) { return this.b.reserve(ipK, est, opts); }
  settle(id, actual) { return this.b.settle(id, actual); }
  release(id, actual) { return this.b.release(id, actual); }
}

const handle = createHandler({ prompt: splitPrompt(promptMd), generate });

export default {
  fetch: (req, env) => handle(req, env),
};
