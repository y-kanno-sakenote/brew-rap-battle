#!/usr/bin/env python3
# 既存コーパスの甘いバースの書き直し（2026-10）。fugashi＋unidic-lite が要る（tools/rhyme_measure.py と同じ）。
#   split <n_batches> <出力フォルダ>      … 重症（語幹の韻が組の中央値で3母音未満 かつ 動詞止め/「〜の」締めが3行以上）を書き直し用のバッチに分ける
#   check <書き直し.json>...              … 書き直しを機械で検査（組ごとの語幹韻3母音以上・台帳と重複なし・バッチ間の重複なし・返しの形・4行・同母音だけの韻）
#   apply <書き直し.json>...              … 検査に通った書き直しをコーパスの該当バースに差し込む（行番号とバース番号で特定。行の位置は変えない）
# 書き直しの各項目: {id, battle_line, verse_index, speaker, prev_verse_last_word, displayRhyme, lines}（split が出す形と同じ）
import json, re, sys, itertools
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import rhyme_measure as M

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "docs" / "claude_corpus.jsonl"


def severe(v, vi):
    ends, _ = M.verse_words(v, vi)
    pl = [M.stem_len(a, b) for a, b in itertools.combinations(ends, 2)]
    med = sorted(pl)[len(pl) // 2] if pl else 0
    verb = sum(1 for w in ends if M.A(w)[1] in ('動詞', '助動詞'))
    no = sum(1 for x in v['lines'] if (m := list(M.SPAN.finditer(x))) and re.sub(r'<[^>]*>', '', x[:m[-1].start()]).endswith('の'))
    return med < 3 and (verb >= 3 or no >= 3)


def split(n_batches, outdir):
    out = Path(outdir); out.mkdir(parents=True, exist_ok=True)
    items = []
    for n, l in enumerate(CORPUS.read_text(encoding='utf-8').splitlines(), 1):
        if not l.strip(): continue
        r = json.loads(l)
        for vi, v in enumerate(r['data']['verses']):
            if severe(v, vi):
                prev = M.SPAN.findall(r['data']['verses'][vi - 1]['lines'][-1])[-1] if vi > 0 else None
                opp = r['bId'] if v['characterId'] == r['aId'] else r['aId']
                items.append({'id': f"L{n}V{vi}", 'battle_line': n, 'verse_index': vi, 'speaker': v['characterId'], 'opponent': opp,
                              'style': r['style'], 'theme': r.get('theme') or '', 'prev_verse_last_word': prev,
                              'displayRhyme': v['displayRhyme'], 'lines': v['lines']})
    k = max(1, n_batches)
    for i in range(k):
        part = items[i::k]
        (out / f"batch_{i+1:02d}.json").write_text(json.dumps(part, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"重症 {len(items)}バース → {k}バッチ（{outdir}）")


def problems(items, used, seen_global):
    bad = []
    for it in items:
        key = it['id']; vi = it['verse_index']; L = it['lines']
        if len(L) != 4: bad.append(f"{key}: 4行でない"); continue
        ends, inner = M.verse_words({'lines': L}, vi)
        if len(ends) != 4: bad.append(f"{key}: 行末の印が4つない"); continue
        pl = [(a, b, M.stem_len(a, b)) for a, b in itertools.combinations(ends, 2)]
        weak = [f"{a}／{b}={s}" for a, b, s in pl if s < 3]
        if weak: bad.append(f"{key}: 語幹で3母音に届かない組 " + '、'.join(weak))
        tails = {M.A(w)[0][-3:] for w in ends}
        if any(len(set(t)) == 1 for t in tails): bad.append(f"{key}: 全部同じ母音の韻 {tails}")
        if vi > 0:
            first = M.SPAN.findall(L[0])
            if not first or first[0] != it.get('prev_verse_last_word'): bad.append(f"{key}: 1行目の返し（相手の締め語「{it.get('prev_verse_last_word')}」の印）がない")
        ws = sorted(set(ends + [w for w, _, _ in inner]))
        for a, b in itertools.combinations(ws, 2):
            p = f"{a}|{b}"
            if p in used: bad.append(f"{key}: 韻語の組「{p}」は台帳にある")
            elif p in seen_global and seen_global[p] != key: bad.append(f"{key}: 韻語の組「{p}」が {seen_global[p]} と重なる")
            else: seen_global[p] = key
    return bad


def load_used(exclude_keys=()):
    """台帳＝コーパスの全バースの韻語の組。ただし書き直し対象のバース自身の（古い）組は除く"""
    ex = set(exclude_keys); used = set()
    for n, l in enumerate(CORPUS.read_text(encoding='utf-8').splitlines(), 1):
        if not l.strip(): continue
        for vi, v in enumerate(json.loads(l)['data']['verses']):
            if f"L{n}V{vi}" not in ex: used |= _pairs_single(v, vi)
    return used


def _pairs_single(v, vi):
    ends, inner = M.verse_words(v, vi)
    ws = sorted(set(ends + [w for w, _, _ in inner]))
    return {f"{a}|{b}" for a, b in itertools.combinations(ws, 2)}


def check(paths):
    items = [it for p in paths for it in json.load(open(p))]
    used = load_used([it['id'] for it in items])
    bad = problems(items, used, {})
    print('\n'.join(bad) if bad else f"✅ {len(items)}バース すべて合格")
    return not bad


def apply(paths):
    if not check(paths):
        print("検査に通らないので差し込まない"); sys.exit(1)
    items = {it['id']: it for p in paths for it in json.load(open(p))}
    lines = CORPUS.read_text(encoding='utf-8').splitlines()
    for key, it in items.items():
        n, vi = it['battle_line'], it['verse_index']
        r = json.loads(lines[n - 1])
        v = r['data']['verses'][vi]
        assert v['characterId'] == it['speaker'], f"{key}: 話者が違う"
        v['lines'] = it['lines']; v['displayRhyme'] = it['displayRhyme']
        lines[n - 1] = json.dumps(r, ensure_ascii=False)
    CORPUS.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f"{len(items)}バースを差し込んだ")


# ── 返しの付け直し ──
# 書き直しで4行目の締め語が変わると、次のバース（相手）の1行目が拾っている「相手の締め語」が古い語のまま浮く。
#   heads <出力.json> <書き直し.json>...   … 書き直しを差し込んだと仮定して、新たにずれる返しを一覧にする（直す対象の項目を書き出す）
#   applyheads <付け直し.json>             … 付け直しを検査（1〜2行目だけ変更・全行の行末の印は不変・1行目の最初の印＝新しい相手の締め語）して差し込む
#   checkheads <付け直し.json> <書き直し.json>... … 差し込む前の検査だけ
#   apply の後に applyheads の順で使う

def _rows():
    return [json.loads(l) for l in CORPUS.read_text(encoding='utf-8').splitlines() if l.strip()]


def _breaks(rows):
    out = set()
    for n, r in enumerate(rows, 1):
        vs = r['data']['verses']
        for vi in range(1, len(vs)):
            h = M.SPAN.findall(vs[vi]['lines'][0]); last = M.SPAN.findall(vs[vi - 1]['lines'][-1])
            if not h or not last or h[0] != last[-1]: out.add((n, vi))
    return out


def heads(outfile, paths):
    rows = _rows(); before = _breaks(rows)
    for p in paths:
        for it in json.load(open(p)):
            rows[it['battle_line'] - 1]['data']['verses'][it['verse_index']]['lines'] = it['lines']
    new = sorted(_breaks(rows) - before)
    items = []
    for n, vi in new:
        vs = rows[n - 1]['data']['verses']; v = vs[vi]
        items.append({'id': f"L{n}V{vi}", 'battle_line': n, 'verse_index': vi, 'speaker': v['characterId'],
                      'old_prev_word': M.SPAN.findall(v['lines'][0])[0], 'new_prev_word': M.SPAN.findall(vs[vi - 1]['lines'][-1])[-1],
                      'prev_lines': vs[vi - 1]['lines'], 'displayRhyme': v['displayRhyme'], 'lines': v['lines']})
    Path(outfile).write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"付け直しが要る返し {len(items)}か所 → {outfile}（元からずれていた {len(before)}か所は対象外）")


def head_problems(fix, base_lines):
    key = fix['id']; L = fix['lines']; bad = []
    if len(L) != 4: return [f"{key}: 4行でない"]
    if L[2:] != base_lines[2:]: bad.append(f"{key}: 3〜4行目が変わっている")
    for a, b in zip(L, base_lines):
        ea, eb = M.SPAN.findall(a), M.SPAN.findall(b)
        if not ea or not eb or ea[-1] != eb[-1]: bad.append(f"{key}: 行末の印が変わっている（{eb[-1:]}→{ea[-1:]}）")
    h = M.SPAN.findall(L[0])
    if not h or h[0] != fix['new_prev_word']: bad.append(f"{key}: 1行目の最初の印が新しい相手の締め語「{fix['new_prev_word']}」でない")
    return bad


def applyheads(path, dry=False, rewrites=()):
    """dry=True と rewrites（書き直し.json）を渡すと、書き直しを差し込んだと仮定して検査だけする（コーパスは触らない）"""
    fixes = json.load(open(path)); rows = _rows(); bad = []
    for p in rewrites:
        for it in json.load(open(p)): rows[it['battle_line'] - 1]['data']['verses'][it['verse_index']]['lines'] = it['lines']
    for f in fixes:
        v = rows[f['battle_line'] - 1]['data']['verses'][f['verse_index']]
        prev = rows[f['battle_line'] - 1]['data']['verses'][f['verse_index'] - 1]
        if M.SPAN.findall(prev['lines'][-1])[-1] != f['new_prev_word']: bad.append(f"{f['id']}: 相手の締め語が今のコーパスと違う（書き直しを先に apply する）")
        bad += head_problems(f, v['lines'])
    if bad:
        print('\n'.join(bad)); print("検査に通らないので差し込まない"); sys.exit(1)
    if dry: print(f"✅ {len(fixes)}か所 すべて合格"); return
    for f in fixes: rows[f['battle_line'] - 1]['data']['verses'][f['verse_index']]['lines'] = f['lines']
    CORPUS.write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows) + '\n', encoding='utf-8')
    print(f"{len(fixes)}か所の返しを付け直した")


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'split': split(int(sys.argv[2]), sys.argv[3])
    elif cmd == 'check': sys.exit(0 if check(sys.argv[2:]) else 1)
    elif cmd == 'apply': apply(sys.argv[2:])
    elif cmd == 'heads': heads(sys.argv[2], sys.argv[3:])
    elif cmd == 'applyheads': applyheads(sys.argv[2])
    elif cmd == 'checkheads': applyheads(sys.argv[2], dry=True, rewrites=sys.argv[3:])
