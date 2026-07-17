#!/usr/bin/env python3
# B案(Gemini)コーパス採掘器 ── A案の素材(語彙・フレーム)候補を抽出する
#
# 使い方:
#   1) index.html の B案でバトルを回す → コーパストレイの「書き出し(.jsonl)」で gemini_corpus.jsonl を保存（docs/ へ）
#   2) エンジン情報を吐く:  node docs/dump_engine.js > /tmp/engine_dump.json
#   3) 採掘:  <venv>/bin/python docs/mine_corpus.py docs/gemini_corpus.jsonl /tmp/engine_dump.json
#      （venvは pykakasi 入り。無ければ python3 -m venv venv && venv/bin/pip install pykakasi）
#
# 出力: ①新語彙候補（既存バケットへのドロップイン or 新バケット）②フレーム(文型)候補
#   ※あくまで「候補」。読み・意味・form・語感は人が校正し、harness/lint を通してから index.html に取り込む。
#     これが「LLMの創造性 × ルールベースの正しさ保証」を両取りする品質ゲート。
import sys, re, json

try:
    import pykakasi
except ImportError:
    sys.exit("pykakasi が要ります: scratchpad の venv_kks/bin/python で実行してください")

# ---- app の vowels() を移植（sig3計算をエンジンと完全一致させる） ----
_ROWS = {'a':"あかさたなはまやらわがざだばぱぁゃ",'i':"いきしちにひみりゐぎじぢびぴぃ",
         'u':"うくすつぬふむゆるぐずづぶぷぅゅ",'e':"えけせてねへめれゑげぜでべぺぇ",
         'o':"おこそとのほもよろをごぞどぼぽぉょ"}
_V = {c:v for v,s in _ROWS.items() for c in s}
def vowels(s):
    o=[]
    for ch in s:
        if ch in _V: o.append(_V[ch])
        elif ch in "ー〜":
            if o: o.append(o[-1])
        elif ch in "んンっッ": pass
        else: o.append('?')
    return ''.join(o)
def sig3(y): return vowels(y)[-3:]

_kks = pykakasi.kakasi()
def yomi(w): return ''.join(x['hira'] for x in _kks.convert(w))

def main():
    if len(sys.argv) < 3:
        sys.exit("usage: mine_corpus.py <corpus.jsonl> <engine_dump.json>")
    corpus_path, dump_path = sys.argv[1], sys.argv[2]
    dump = json.load(open(dump_path, encoding='utf-8'))
    have = set(dump['vocab'])
    roles = dump['roles']  # role -> {sig, form}
    sig2roles = {}
    for r, d in roles.items():
        sig2roles.setdefault(d['sig'], []).append((r, d['form']))

    rows = [json.loads(l) for l in open(corpus_path, encoding='utf-8') if l.strip()]
    rhyme_re = re.compile(r'<span class="rhyme">([^<]+)</span>')

    word_freq = {}          # 韻語 -> 出現回数
    templates = {}          # 文型テンプレ -> 出現回数
    for rec in rows:
        for v in rec.get('data', {}).get('verses', []):
            for line in v.get('lines', []):
                ws = rhyme_re.findall(line)
                for w in ws:
                    word_freq[w] = word_freq.get(w, 0) + 1
                # フレーム候補：韻語を {a}{b}{c}... に置換して文型化
                slots = ['{a}', '{b}', '{c}', '{d}']
                i = [0]
                def repl(m):
                    s = slots[i[0]] if i[0] < len(slots) else '{x}'
                    i[0] += 1
                    return s
                tmpl = rhyme_re.sub(repl, line)
                if 2 <= i[0] <= 4:   # 2〜4韻語の行だけフレーム候補に
                    templates[tmpl] = templates.get(tmpl, 0) + 1

    # ---- ① 新語彙候補 ----
    print("=" * 60)
    print("① 新語彙候補（B案の韻語のうち A案に未収録のもの）")
    print("=" * 60)
    dropin, newbucket, badyomi = [], [], []
    for w, f in sorted(word_freq.items(), key=lambda x: -x[1]):
        if w in have:
            continue
        y = yomi(w)
        if '?' in vowels(y) or len(vowels(y)) < 2:
            badyomi.append((w, y)); continue
        s = sig3(y)
        if s in sig2roles:
            dropin.append((w, y, s, sig2roles[s], f))
        else:
            newbucket.append((w, y, s, f))
    print(f"\n[ドロップイン候補] 既存バケット(sig3)に入る＝フレーム不要。form一致を人が確認:")
    for w, y, s, rs, f in dropin:
        rinfo = ' / '.join(f"{r}({form})" for r, form in rs)
        print(f"  {w}({y}) sig={s} ×{f}回  → 候補role: {rinfo}")
    print(f"\n[新バケット候補] 既存にないsig3＝新role＋フレームが要る。接尾語ファミリーになりそうか吟味:")
    for w, y, s, f in newbucket:
        print(f"  {w}({y}) sig={s} ×{f}回")
    if badyomi:
        print(f"\n[要読み校正] pykakasiが母音化できず（熟字訓/専門語の誤読の可能性。人が読みを付ける）:")
        for w, y in badyomi:
            print(f"  {w}(自動読み:{y})")

    # ---- ② フレーム候補 ----
    print("\n" + "=" * 60)
    print("② フレーム(文型)候補（B案の行を韻語→スロット化）")
    print("=" * 60)
    print("  ※非スロット部分が汎用的で、連接語がR3ルールに合うものだけ採用。読点/固有名は要調整。")
    for t, f in sorted(templates.items(), key=lambda x: -x[1]):
        print(f"  ×{f}  {t}")

    print("\n[まとめ] ドロップイン{}語 / 新バケット{}語 / 要読み校正{}語 / フレーム候補{}種".format(
        len(dropin), len(newbucket), len(badyomi), len(templates)))
    print("次段: 上記を人が校正 → index.html に追加 → node lint.js && node harness.js && node rep.js が全て緑なら確定。")

if __name__ == '__main__':
    main()
