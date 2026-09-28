#!/usr/bin/env python3
"""コーパス工場（毎朝の定期タスク）の固定コマンド。

定期タスクは無人なので、毎回違う形のBashを打つと承認待ちで止まる。
この1本の3サブコマンドだけで済むようにして、許可リストは
`Bash(python3 "/Users/.../tools/factory.py" *)` の1行で足りるようにしている。

  plan               本数・作風・ペア割り当て・ts・今日すでに回ったかを表示
  append <batch>     バッチを検証→マスターに追記→全行検証（失敗なら元に戻す）→受け渡しノートに1行
  fail <理由>        受け渡しノートに失敗の1行だけ書く
"""
import json
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "docs" / "claude_corpus.jsonl"
VAULT_HANDOFF = Path(
    "/Users/ymacmini/Library/Mobile Documents/iCloud~md~obsidian/Documents/sakenote-vault/📤受け渡し"
)
IDS = ["koji", "yeast", "toji", "lactic", "rice"]
KEYS = ["ts", "model", "aId", "bId", "bars", "mode", "style", "theme", "data"]
# 月=0 … 日=6（規格書の作風ローテーション）
STYLE_BY_WEEKDAY = ["王道戦", "毒舌回", "季節テーマ戦", "変わり種テーマ戦", "リスペクト戦", "王道戦", "季節テーマ戦"]
SAVAGE_SHARE = {"王道戦": 1 / 3, "毒舌回": 2 / 3, "季節テーマ戦": 1 / 4, "変わり種テーマ戦": 1 / 4, "リスペクト戦": 0}
THEMED_SHARE = {"季節テーマ戦": 1 / 3, "変わり種テーマ戦": 1 / 3}  # 規格は「半数未満」
MARK = "醸造ラップバトル工場:"
JST = timezone(timedelta(hours=9))


def now_jst():
    return datetime.now(JST)


def load_rows():
    return [json.loads(l) for l in CORPUS.read_text(encoding="utf-8").splitlines() if l.strip()]


def handoff_path(d):
    return VAULT_HANDOFF / f"{d:%Y-%m-%d}.md"


def ran_today(d):
    p = handoff_path(d)
    return p.exists() and MARK in p.read_text(encoding="utf-8")


def write_handoff(line):
    d = now_jst()
    p = handoff_path(d)
    head = "## 💡 今日やったこと"
    text = p.read_text(encoding="utf-8") if p.exists() else f"# {d:%Y-%m-%d} 受け渡し\n\n{head}\n"
    if head not in text:
        text = text.rstrip("\n") + f"\n\n{head}\n"
    lines = text.split("\n")
    i = lines.index(head) + 1
    while i < len(lines) and not lines[i].startswith("## "):
        i += 1
    while i > 0 and lines[i - 1].strip() == "":
        i -= 1
    lines.insert(i, line)
    p.write_text("\n".join(lines).rstrip("\n") + "\n", encoding="utf-8")
    print(f"受け渡しノートに記録: {p.name} ← {line}")


def check_row(r):
    assert list(r) == KEYS, f"キー順が違う: {list(r)}"
    assert r["model"] == "claude-opus-sub" and r["bars"] == 8 and r["mode"] == "claude-teacher"
    assert r["aId"] in IDS and r["bId"] in IDS and r["aId"] != r["bId"], "aId/bId が不正"
    assert r["style"] in ("standard", "savage")
    v = r["data"]["verses"]
    assert len(v) == 4 and all(len(x["lines"]) == 4 for x in v), "verses4×lines4 でない"
    assert [x["characterId"] for x in v] == [r["aId"], r["bId"], r["aId"], r["bId"]], "話者順が a,b,a,b でない"
    assert all('<span class="rhyme">' in l for x in v for l in x["lines"]), "韻語の span が無い行がある"
    assert r["data"].get("flavor"), "flavor が空"


def plan():
    d = now_jst()
    rows = load_rows()
    n_rows = len(rows)
    n = 12 if n_rows < 300 else 6
    style = STYLE_BY_WEEKDAY[d.weekday()]
    if n_rows >= 300:
        style = "季節テーマ戦"
    print(f"日付(JST): {d:%Y-%m-%d} {'月火水木金土日'[d.weekday()]}曜")
    if ran_today(d):
        print("今日はすでに工場が回っている（受け渡しノートに記録あり）。何もせず終了すること。")
        return
    print(f"ストック: {n_rows}本 → 生成本数: {n}本 / 作風: {style}")
    pc = Counter(tuple(sorted([r["aId"], r["bId"]])) for r in rows)
    pairs = [tuple(sorted((a, b))) for i, a in enumerate(IDS) for b in IDS[i + 1:]]
    pairs.sort(key=lambda p: pc[p])
    n_savage = round(n * SAVAGE_SHARE[style])
    n_themed = int(n * THEMED_SHARE.get(style, 0))
    print(f"口調: savage {n_savage}本・standard {n - n_savage}本 / お題つき: {n_themed}本まで（残りは theme 空）")
    print("割り当て（少ないペア優先・向きは交互）:")
    for k in range(n):
        a, b = pairs[k % len(pairs)]
        if k % 2 == 1:
            a, b = b, a
        st = "savage" if (k * n_savage) // n != ((k + 1) * n_savage) // n else "standard"
        print(f"  {k + 1:2d} {a}→{b} {st}")
    ts0 = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")
    print(f"ts: \"{ts0}:01Z\" から1秒ずつの連番")


def append(batch_path, style_label):
    batch = Path(batch_path)
    new = [l for l in batch.read_text(encoding="utf-8").splitlines() if l.strip()]
    for i, l in enumerate(new, 1):
        try:
            check_row(json.loads(l))
        except Exception as e:
            print(f"バッチ{i}行目が不正: {e}。マスターは触っていない。")
            sys.exit(1)
    before = CORPUS.read_bytes()
    body = before if before.endswith(b"\n") or not before else before + b"\n"
    CORPUS.write_bytes(body + ("\n".join(new) + "\n").encode("utf-8"))
    try:
        rows = load_rows()
        assert all(len(r["data"]["verses"]) == 4 and all(len(v["lines"]) == 4 for v in r["data"]["verses"]) for r in rows)
    except Exception as e:
        CORPUS.write_bytes(before)
        print(f"追記後の検証に失敗（{e}）。マスターを元に戻した。")
        sys.exit(1)
    print(f"{len(new)}本追記・全{len(rows)}行OK")
    write_handoff(f"- {MARK} {len(new)}本追加（累計{len(rows)}本・作風={style_label}）")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "plan":
        plan()
    elif cmd == "append" and len(sys.argv) == 4:
        append(sys.argv[2], sys.argv[3])
    elif cmd == "fail" and len(sys.argv) >= 3:
        write_handoff(f"- {MARK} 本日失敗（{' '.join(sys.argv[2:])}）")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
