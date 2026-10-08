// 予算と IP ごとの回数の帳場（Durable Object 1個の中身。SQLite バックエンド）。
// 判定・仮積み・精算をすべて同期処理で書く＝1個の DO の中では1件ずつ順に処理され、同時の要求でも読み→判定→書きが割り込まれない。
// Node から単体テストできるよう cloudflare:workers に依存しない（DO の外枠は index.js の BudgetDO）。
//   reserve(ipKey, est, {now, daily, monthly, perIp}) → {ok:true, id} | {ok:false, error, retryAfter}
//   settle(id, actual)  … 仮積みの見込み額を実際の額に置き換える（IP の回数はそのまま）
//   release(id, actual) … こちらの失敗：IP の回数を1戻し、金額は actual（実際にかかった分）だけ残す

/** 日本時間の日付（日の予算・IP 回数の区切り）と月（月の予算の区切り） */
const JST = 9 * 3600e3, DAY = 86400e3;
export function dayJST(now) { return new Date(now + JST).toISOString().slice(0, 10); }
export function monthJST(now) { return dayJST(now).slice(0, 7); }
/** 日本時間の次の0時・次の月初0時までの秒数（429 の Retry-After） */
export function secondsToNextDayJST(now) { return Math.max(1, Math.ceil((DAY - ((now + JST) % DAY)) / 1000)); }
export function secondsToNextMonthJST(now) {
  const j = new Date(now + JST);
  return Math.max(1, Math.ceil((Date.UTC(j.getUTCFullYear(), j.getUTCMonth() + 1, 1) - JST - now) / 1000));
}

const r6 = (x) => Math.max(0, Math.round(x * 1e6) / 1e6);
// 古い行の掃除の目安（日のキーは2日・月のキーは40日・精算されなかった仮積みの控えは1日で消す。消しても積んだ額は残る）
const DAY_KEEP = 2 * DAY, MONTH_KEEP = 40 * DAY, HOLD_KEEP = DAY;

export class Budget {
  constructor(ctx) {
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS counts (k TEXT PRIMARY KEY, n REAL NOT NULL, exp INTEGER NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS holds (id TEXT PRIMARY KEY, day_k TEXT NOT NULL, month_k TEXT NOT NULL, ip_k TEXT NOT NULL, est REAL NOT NULL, at INTEGER NOT NULL)");
  }

  get(k) {
    const row = this.sql.exec("SELECT n FROM counts WHERE k = ?", k).toArray()[0];
    return row ? Number(row.n) : 0;
  }

  add(k, delta, exp) {
    if (!delta) return;
    this.sql.exec("INSERT INTO counts (k, n, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET n = excluded.n",
      k, r6(this.get(k) + delta), exp);
  }

  reserve(ipK, est, { now, daily, monthly, perIp }) {
    this.sql.exec("DELETE FROM counts WHERE exp < ?", now);
    this.sql.exec("DELETE FROM holds WHERE at < ?", now - HOLD_KEEP);
    const day = dayJST(now);
    const dayK = `usd:day:${day}`, monthK = `usd:month:${monthJST(now)}`, ipKey = `ip:${day}:${ipK}`;
    if (this.get(monthK) + est > monthly) return { ok: false, error: "budget_month", retryAfter: secondsToNextMonthJST(now) };
    if (this.get(dayK) + est > daily) return { ok: false, error: "budget_day", retryAfter: secondsToNextDayJST(now) };
    if (this.get(ipKey) >= perIp) return { ok: false, error: "daily_limit_ip", retryAfter: secondsToNextDayJST(now) };
    // 見込み額を先に積む（途中で接続が切れて精算まで届かなくても、多めに数えた側に倒れる）
    this.add(ipKey, 1, now + DAY_KEEP);
    this.add(dayK, est, now + DAY_KEEP);
    this.add(monthK, est, now + MONTH_KEEP);
    const id = crypto.randomUUID();
    this.sql.exec("INSERT INTO holds (id, day_k, month_k, ip_k, est, at) VALUES (?, ?, ?, ?, ?, ?)", id, dayK, monthK, ipKey, est, now);
    return { ok: true, id };
  }

  #close(id, actual, giveBackIp) {
    const h = this.sql.exec("SELECT * FROM holds WHERE id = ?", id).toArray()[0];
    if (!h) return false;
    const at = Number(h.at), d = (Number(actual) || 0) - Number(h.est);
    this.add(h.day_k, d, at + DAY_KEEP);
    this.add(h.month_k, d, at + MONTH_KEEP);
    if (giveBackIp) this.add(h.ip_k, -1, at + DAY_KEEP);
    this.sql.exec("DELETE FROM holds WHERE id = ?", id);
    return true;
  }

  settle(id, actual) { return this.#close(id, actual, false); }
  release(id, actual = 0) { return this.#close(id, actual, true); }
}
