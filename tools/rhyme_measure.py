#!/usr/bin/env python3
# 押韻の質の計測（2026-10 押韻の組み直しで作った物差し。根拠は docs/rhyme_research_2026-10.md）
#   使い方: <fugashi と unidic-lite を入れた python> tools/rhyme_measure.py measure <対象.jsonl> [--ledger docs/rhyme_pairs_ledger.txt]
#   測るもの: 語幹で数えた韻の長さ・行末の品詞・「〜の【名詞】」締めの率・韻の種類の偏り・中韻・使用済みの韻語の組との重複
#   台帳そのものは tools/factory.py ledger が作る（こちらの ledger は比較用の別コーパスから作る時だけ使う）
import json, re, sys, itertools
from collections import Counter
import fugashi

T = fugashi.Tagger()
SPAN = re.compile(r'<span class="rhyme">([^<]*)</span>')
KV = {}
for row, v in [("アカサタナハマヤラワガザダバパァ", 'a'), ("イキシチニヒミリギジヂビピィ", 'i'),
               ("ウクスツヌフムユルグズヅブプゥヴ", 'u'), ("エケセテネヘメレゲゼデベペェ", 'e'),
               ("オコソトノホモヨロヲゴゾドボポォ", 'o')]:
    for ch in row: KV[ch] = v
SMALL = {'ャ': 'a', 'ュ': 'u', 'ョ': 'o'}          # 拗音は2母音で数える（エンジンと同じ）
INFLECT = {'動詞', '形容詞', '助動詞'}

def analyze(word):
    toks = list(T(word))
    kana = ''.join((t.feature.kana or t.surface) if t.feature.kana not in (None, '*') else t.surface for t in toks)
    vs = []
    for ch in kana:
        if ch in SMALL: vs.append(SMALL[ch])
        elif ch in KV: vs.append(KV[ch])
        elif ch == 'ー' and vs: vs.append(vs[-1])
    last = toks[-1] if toks else None
    pos = last.feature.pos1 if last else ''
    return ''.join(vs), pos, (pos in INFLECT)

_cache = {}
def A(word):
    if word not in _cache: _cache[word] = analyze(word)
    return _cache[word]

def common_suffix(a, b):
    n = 0
    while n < min(len(a), len(b)) and a[-1-n] == b[-1-n]: n += 1
    return n

def stem_len(w1, w2):
    """語幹で数えた韻の長さ：両方が活用語（動詞・形容詞・助動詞）で終わるなら、活用語尾の1母音を数えない"""
    (v1, _, inf1), (v2, _, inf2) = A(w1), A(w2)
    n = common_suffix(v1, v2)
    return max(0, n - 1) if (inf1 and inf2) else n

def load(p): return [json.loads(l) for l in open(p) if l.strip()]

def verse_words(v, vi):
    """(行末の韻語のリスト, 行の途中の韻語のリスト[(語, 直後の1文字)])。2番目以降のバースの冒頭の最初の印は返し（相手の締め語）として除く"""
    ends, inner = [], []
    for li, l in enumerate(v['lines']):
        spans = list(SPAN.finditer(l))
        if not spans: continue
        ends.append(spans[-1].group(1))
        for k, m in enumerate(spans[:-1]):
            if vi > 0 and li == 0 and k == 0: continue
            nxt = re.sub(r'<[^>]*>', '', l[m.end():])[:1]
            inner.append((m.group(1), nxt, spans[-1].group(1)))
    return ends, inner

def pairs_of(rows):
    ps = []
    for r in rows:
        for vi, v in enumerate(r['data']['verses']):
            ends, inner = verse_words(v, vi)
            ws = sorted(set(ends + [w for w, _, _ in inner]))
            ps += ['|'.join(p) for p in itertools.combinations(ws, 2)]
    return ps

def ledger(corpus, out):
    rows = load(corpus)
    ps = Counter(pairs_of(rows))
    wc = Counter(w for r in rows for vi, v in enumerate(r['data']['verses']) for w in verse_words(v, vi)[0])
    with open(out, 'w') as f:
        f.write(f"# 使用済みの韻語の組の台帳（{corpus.split('/')[-1]} {len(rows)}本から自動生成・1行1組）。ここにある組は新しいバトルで使わない\n")
        f.write("# 多用語（行末の韻語として5回以上）: " + '、'.join(w for w, c in wc.most_common() if c >= 5) + "\n")
        for p in sorted(ps): f.write(p + "\n")
    print(f"台帳: {len(ps)}組・多用語 {sum(1 for c in wc.values() if c >= 5)}語 → {out}")

def measure(path, ledger_path=None):
    rows = load(path)
    used = set()
    if ledger_path:
        used = {l.strip() for l in open(ledger_path) if l.strip() and not l.startswith('#')}
    nl = 0; no_end = 0; endpos = Counter(); fam = Counter(); stems = []; deep = ok3 = nv = 0
    inner_n = inner_ok = inner_cut = 0; lines_with_inner = 0
    for r in rows:
        for vi, v in enumerate(r['data']['verses']):
            nv += 1; nl += len(v['lines'])
            fam[re.sub(r'[^aiueo]', '', v.get('displayRhyme', ''))[-3:]] += 1
            ends, inner = verse_words(v, vi)
            for w in ends: endpos[A(w)[1]] += 1
            for l in v['lines']:
                ms = list(SPAN.finditer(l))
                if ms and re.sub(r'<[^>]*>', '', l[:ms[-1].start()]).endswith('の'): no_end += 1
            pl = [stem_len(a, b) for a, b in itertools.combinations(ends, 2)]
            if pl:
                med = sorted(pl)[len(pl)//2]; stems.append(med)
                ok3 += med >= 3; deep += max(pl) >= 4
            seen_lines = set()
            for w, nxt, end in inner:
                inner_n += 1
                if A(w)[0][-3:] == A(end)[0][-3:]: inner_ok += 1
                if nxt in '、。！？ 　はがをにでともへやの': inner_cut += 1
            lines_with_inner += sum(1 for li, l in enumerate(v['lines']) if len(SPAN.findall(l)) >= (3 if (vi > 0 and li == 0) else 2))
    ps = pairs_of(rows); pc = Counter(ps)
    reused = sum(1 for p in ps if p in used); dup_in_batch = sum(c - 1 for c in pc.values() if c > 1)
    tot_end = sum(endpos.values()); top5 = sum(c for _, c in fam.most_common(5)) / max(1, sum(fam.values()))
    print(f"■ {path.split('/')[-1]}: {len(rows)}本・{nv}バース・{nl}行")
    print(f"  語幹で数えた韻の長さ（バース内の行末どうし・中央値）: 平均 {sum(stems)/max(1,len(stems)):.2f}母音 ／ 3母音以上 {ok3/nv*100:.0f}% ／ 4母音以上の組を含む {deep/nv*100:.0f}%")
    print(f"  行末の品詞: " + '・'.join(f"{k}{c/tot_end*100:.0f}%" for k, c in endpos.most_common(5)) + f" ／ 「〜の【名詞】」で締める行 {no_end/nl*100:.0f}%")
    print(f"  韻の種類 {len(fam)}種（{nv}バース）・上位5種で{top5*100:.0f}%")
    print(f"  中韻のある行 {lines_with_inner/nl*100:.0f}% ／ 中韻語のうち行末と末尾3母音一致 {inner_ok/max(1,inner_n)*100:.0f}% ・句の切れ目（読点・助詞の直前）に置いた {inner_cut/max(1,inner_n)*100:.0f}%")
    if ledger_path:
        print(f"  韻語の組 {len(ps)}組のうち台帳に既出 {reused/max(1,len(ps))*100:.0f}% ／ バッチ内の重複 {dup_in_batch}組")

if __name__ == '__main__':
    if sys.argv[1] == 'ledger': ledger(sys.argv[2], sys.argv[3])
    else:
        lp = sys.argv[sys.argv.index('--ledger')+1] if '--ledger' in sys.argv else None
        for p in [a for a in sys.argv[2:] if a != '--ledger' and a != lp]: measure(p, lp)
