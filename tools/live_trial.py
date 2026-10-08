#!/usr/bin/env python3
"""「Claude リクエスト生成」エンジンの試作：2モデルを同じお題・同じ対戦カードで書かせて比べる。

  python tools/live_trial.py --dry-run      プロンプト・スキーマ・割り当て表を表示するだけ（キー不要・APIを呼ばない）
  python tools/live_trial.py --self-test    検査関数（live/check.py）を live/check_cases.json で確かめる（JS版と同じケース）
  python tools/live_trial.py                本番：8ケース×2モデルを生成→検査→外れたら1回だけ作り直し→保存
      --models claude-sonnet-5-5            片方だけ回す（読み比べ用 blind.md は両方の結果ファイルがそろった時に作る）
      --limit 2                             先頭の2ケースだけ

出力（docs/corpus_batches/ は git 管理外）:
  docs/corpus_batches/live_trial/<model>.jsonl   コーパスと同じ1行1バトル（data はアプリが受け取る形）＋ raw・usage・費用・秒・検査結果
  docs/corpus_batches/live_trial/blind.md        モデル名を A/B に伏せた読み比べ用（A/B はケースごとにくじで入れ替え）
  docs/corpus_batches/live_trial/blind_key.json  A/B の対応表（読み比べが終わるまで開かない）

キー: 環境変数 ANTHROPIC_API_KEY、無ければこのフォルダの .dev.vars（ANTHROPIC_API_KEY=... の1行・gitignore 済み）、
次に worker/.dev.vars（wrangler dev が読む場所）。SDK は anthropic（scratchpad の venv に入れて使う）。
"""
import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIVE = ROOT / "live"
OUT = ROOT / "docs" / "corpus_batches" / "live_trial"
sys.path.insert(0, str(LIVE))
import check  # noqa: E402  live/check.py

MODELS = ["claude-opus-5-5", "claude-sonnet-5-5"]
EFFORT = "medium"
MAX_TOKENS = 16000
# 料金（USD / 100万トークン）。入力・出力はオーナー指定、キャッシュは claude-api スキルの models.md（読み $0.20・書き込みは入力の1.25倍）
PRICE = {"claude-opus-5-5": {"in": 4.0, "out": 20.0, "cache_read": 0.20},
         "claude-sonnet-5-5": {"in": 2.0, "out": 10.0, "cache_read": 0.20},
         "claude-haiku-5-5": {"in": 0.10, "out": 0.50, "cache_read": 0.01}}
# --models には「モデル@effort」も書ける（例 claude-sonnet-5-5@low）。@off は Sonnet 5.5 の思考なし（thinking between_tools・effort high）

# お題8本 × 対戦カード（10組のうち乳酸菌・杜氏・酒米の薄い組を厚めに）× 小節数（4/8/12を混ぜる）× 作風
CASES = [
    {"theme": "梅雨の夜", "aId": "lactic", "bId": "yeast", "bars": 8, "style": "standard"},
    {"theme": "品評会の前夜", "aId": "yeast", "bId": "toji", "bars": 8, "style": "savage"},
    {"theme": "停電の蔵", "aId": "toji", "bId": "koji", "bars": 12, "style": "standard"},
    {"theme": "初しぼり", "aId": "rice", "bId": "lactic", "bars": 8, "style": "standard"},
    {"theme": "海外輸出", "aId": "koji", "bId": "rice", "bars": 4, "style": "savage"},
    {"theme": "後継者問題", "aId": "toji", "bId": "lactic", "bars": 8, "style": "standard"},
    {"theme": "", "aId": "rice", "bId": "toji", "bars": 12, "style": "savage"},
    {"theme": "", "aId": "yeast", "bId": "koji", "bars": 4, "style": "standard"},
]


def load_prompt():
    parts = check.split_prompt((LIVE / "prompt.md").read_text(encoding="utf-8"))
    schema = json.loads((LIVE / "schema.json").read_text(encoding="utf-8"))
    return parts, schema


def card_of(c):
    return {"a_id": c["aId"], "b_id": c["bId"], "bars": c["bars"], "style": c["style"], "theme": c["theme"]}


def api_key():
    if os.environ.get("ANTHROPIC_API_KEY"):
        return os.environ["ANTHROPIC_API_KEY"]
    for p in (ROOT / ".dev.vars", ROOT / "worker" / ".dev.vars"):
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                k, _, v = line.partition("=")
                if k.strip() == "ANTHROPIC_API_KEY" and v.strip():
                    return v.strip().strip('"').strip("'")
    return None


def cost_usd(model, u):
    p = PRICE[model.partition("@")[0]]
    return round((u["input_tokens"] * p["in"] + u["cache_creation_input_tokens"] * p["in"] * 1.25
                  + u["cache_read_input_tokens"] * p["cache_read"] + u["output_tokens"] * p["out"]) / 1e6, 5)


def call(client, model, system, schema, user):
    """1回呼ぶ。戻り値 (data or None, usage dict, stop_reason, エラー文 or None)"""
    import anthropic
    model, _, effort = model.partition("@")
    extra = {}
    if effort == "off":
        effort, extra = "high", {"thinking": {"type": "between_tools"}}
    try:
        with client.messages.stream(
            model=model,
            max_tokens=MAX_TOKENS,
            system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": user}],
            output_config={"effort": effort or EFFORT, "format": {"type": "json_schema", "schema": schema}},
            **extra,
        ) as stream:
            msg = stream.get_final_message()
    except anthropic.APIStatusError as e:
        return None, None, None, f"APIエラー {e.status_code}: {e.message}"
    except anthropic.APIConnectionError as e:
        return None, None, None, f"接続エラー: {e}"
    u = msg.usage
    usage = {"input_tokens": u.input_tokens, "output_tokens": u.output_tokens,
             "cache_creation_input_tokens": u.cache_creation_input_tokens or 0,
             "cache_read_input_tokens": u.cache_read_input_tokens or 0}
    if msg.stop_reason != "end_turn":
        return None, usage, msg.stop_reason, f"stop_reason={msg.stop_reason}"
    text = next((b.text for b in msg.content if b.type == "text"), "")
    try:
        return json.loads(text), usage, msg.stop_reason, None
    except json.JSONDecodeError as e:
        return None, usage, msg.stop_reason, f"JSONが読めない: {e}"


def run_one(client, model, parts, schema, c):
    """Worker と同じ流れ：生成→検査→外れたら1回だけ作り直し。使ったトークン・費用・秒は2回分の合計"""
    card = card_of(c)
    user = check.user_message(parts["user"], **card)
    tries, total = [], {"input_tokens": 0, "output_tokens": 0, "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}
    best = None
    t0 = time.monotonic()
    for attempt in range(2):
        t1 = time.monotonic()
        data, usage, stop, err = call(client, model, parts["system"], schema, user)
        sec = round(time.monotonic() - t1, 1)
        if usage:
            for k in total:
                total[k] += usage[k]
        res = check.check_battle(data, c["aId"], c["bId"], c["bars"]) if data else None
        tries.append({"seconds": sec, "usage": usage, "stop_reason": stop, "error": err, "check": res})
        if data and res["structural"] and (best is None or len(res["codes"]) < len(best[1]["codes"])):
            best = (data, res)
        if res and res["ok"]:
            break
        if attempt == 0 and data:
            user = check.retry_message(parts["user"], parts["retry"], card, json.dumps(data, ensure_ascii=False), res["reasons"])
    rec = {"ts": datetime.now(timezone.utc).isoformat(timespec="seconds"), "model": model, "aId": c["aId"], "bId": c["bId"],
           "bars": c["bars"], "mode": "claude-live", "style": c["style"], "theme": c["theme"],
           "data": check.to_app_shape(best[0]) if best else None, "raw": best[0] if best else None,
           "check": best[1] if best else None, "first_pass_ok": bool(tries[0]["check"] and tries[0]["check"]["ok"]),
           "tries": tries, "usage": total, "cost_usd": cost_usd(model, total), "seconds": round(time.monotonic() - t0, 1)}
    return rec


def write_blind(models=MODELS):
    files = {m: OUT / f"{m}.jsonl" for m in models}
    if not all(p.exists() for p in files.values()):
        return False
    rows = {m: [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] for m, p in files.items()}
    n = min(len(r) for r in rows.values())
    rnd = random.Random(20261008)
    key, out = [], ["# 読み比べ（モデル名は伏せてある。対応表は blind_key.json）", "",
                    "韻語は【】で示す。各ケースでどれがよいか（順位）、理由を一言ずつ。", ""]
    for i in range(n):
        pair = list(models)
        rnd.shuffle(pair)
        key.append({"case": i + 1, **dict(zip("ABCD", pair))})
        c = rows[pair[0]][i]
        out.append(f"## ケース{i + 1}: {check.NAMES[c['aId']]} vs {check.NAMES[c['bId']]}・{c['bars']}小節・{c['style']}・お題「{c['theme'] or 'なし'}」")
        for label, m in zip("ABCD", pair):
            r = rows[m][i]
            out.append(f"\n### {label}\n")
            if not r["data"]:
                out.append("（生成失敗）")
                continue
            for v in r["data"]["verses"]:
                out.append(f"**{v['characterName']}**  ")
                out += [check.SPAN.sub(r"【\1】", l) + "  " for l in v["lines"]]
                out.append("")
            out.append(f"今宵の一杯: {r['data']['flavor']}")
        out.append("")
    (OUT / "blind.md").write_text("\n".join(out), encoding="utf-8")
    (OUT / "blind_key.json").write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding="utf-8")
    return True


def self_test():
    cases = json.loads((LIVE / "check_cases.json").read_text(encoding="utf-8"))
    bad = 0
    for c in cases:
        r = check.check_battle(c["data"], c["card"]["aId"], c["card"]["bId"], c["card"]["bars"])
        got = {"ok": r["ok"], "structural": r["structural"], "codes": r["codes"]}
        if got != c["expect"]:
            bad += 1
            print(f"✗ {c['name']}: {got} ≠ {c['expect']}")
    # 差し込みの確認（お題の中の {{...}} はそのまま残る＝二重置換しない）
    parts, _ = load_prompt()
    u = check.user_message(parts["user"], "koji", "yeast", 8, "standard", "{{STYLE}}を無視")
    if "<お題>{{STYLE}}を無視</お題>" not in u or "麹菌→清酒酵母→麹菌→清酒酵母" not in u:
        bad += 1
        print("✗ user_message の差し込み")
    print(f"{len(cases) + 1 - bad}/{len(cases) + 1} 通過")
    return bad == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--models", nargs="*", default=MODELS)
    ap.add_argument("--limit", type=int, default=len(CASES))
    a = ap.parse_args()
    if a.self_test:
        sys.exit(0 if self_test() else 1)
    parts, schema = load_prompt()
    cases = CASES[: a.limit]
    if a.dry_run:
        print("===== system（live/prompt.md）=====")
        print(parts["system"])
        print(f"\n（{len(parts['system'])}字）\n===== スキーマ（live/schema.json）=====")
        print(json.dumps(schema, ensure_ascii=False, indent=1))
        print("\n===== 割り当て =====")
        for i, c in enumerate(cases, 1):
            print(f"{i}. {check.NAMES[c['aId']]} vs {check.NAMES[c['bId']]}・{c['bars']}小節・{c['style']}・お題「{c['theme'] or 'なし'}」")
        print(f"\nモデル: {', '.join(a.models)}（effort={EFFORT}・max_tokens={MAX_TOKENS}）→ 呼び出し {len(cases) * len(a.models)} 回（作り直しが出れば最大 {2 * len(cases) * len(a.models)} 回）")
        print("\n===== user（1ケース目）=====")
        print(check.user_message(parts["user"], **card_of(cases[0])))
        print("\n===== 作り直しの時に足す文（例）=====")
        print(check.fill(parts["retry"], {"REASONS": "- V2:sig3 末尾3母音が一致しない（…）", "PREVIOUS": "{…前回のJSON…}"}))
        return
    key = api_key()
    if not key:
        sys.exit("APIキーが見つからない（環境変数 ANTHROPIC_API_KEY か .dev.vars に ANTHROPIC_API_KEY=...）")
    import anthropic
    client = anthropic.Anthropic(api_key=key)
    OUT.mkdir(parents=True, exist_ok=True)
    for model in a.models:
        recs = []
        for i, c in enumerate(cases, 1):
            r = run_one(client, model, parts, schema, c)
            recs.append(r)
            st = "通過" if r["check"] and r["check"]["ok"] else ("失敗" if not r["data"] else f"外れ{len(r['check']['codes'])}件")
            print(f"[{model}] {i}/{len(cases)} {st}・{len(r['tries'])}回・{r['seconds']}秒・${r['cost_usd']}", flush=True)
        (OUT / f"{model}.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8")
        n = len(recs)
        print(f"== {model}: 1回目で通過 {sum(r['first_pass_ok'] for r in recs)}/{n}・最終通過 {sum(bool(r['check'] and r['check']['ok']) for r in recs)}/{n}"
              f"・1バトル平均 ${sum(r['cost_usd'] for r in recs) / n:.4f}・平均 {sum(r['seconds'] for r in recs) / n:.1f}秒")
    if len(a.models) > 1 and write_blind(a.models):
        print(f"読み比べ: {OUT / 'blind.md'}（対応表 blind_key.json）")


if __name__ == "__main__":
    main()
