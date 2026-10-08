"""「Claude リクエスト生成」の出力検査（Python 試作 tools/live_trial.py が使う）。JS 版 live/check.mjs と同じ規則。
規則を変えたら両方を直し、live/check_cases.json を両方で回す（node --test worker/test ／ python3 tools/live_trial.py --self-test）。
"""
import re

IDS = ["koji", "yeast", "toji", "lactic", "rice"]
NAMES = {"koji": "麹菌", "yeast": "清酒酵母", "toji": "杜氏", "lactic": "乳酸菌", "rice": "酒米"}

# かな→母音（index.html の _V / vowels() と同じ表・同じ数え方）
_V = {}
for _v, _row in {"a": "あかさたなはまやらわがざだばぱぁゃ", "i": "いきしちにひみりゐぎじぢびぴぃ", "u": "うくすつぬふむゆるぐずづぶぷぅゅ",
                 "e": "えけせてねへめれゑげぜでべぺぇ", "o": "おこそとのほもよろをごぞどぼぽぉょ"}.items():
    for _c in _row:
        _V[_c] = _v


def vowels(s):
    o = []
    for ch in s:
        if ch in _V:
            o.append(_V[ch])
        elif ch in ("ー", "〜"):
            if o:
                o.append(o[-1])
        elif ch in "んンっッ":
            pass
        else:
            o.append("?")
    return "".join(o)


SPAN = re.compile(r'<span class="rhyme">([^<]*)</span>')
END_MARK = re.compile(r'<span class="rhyme">([^<]+)</span>[\s!?！？。、，,．.…・」』）)〜ー♪]*$')
HEAD_MARK = re.compile(r'^[\s「『（(]*<span class="rhyme">([^<]+)</span>')


def check_battle(data, a_id, b_id, bars):
    """戻り値 {ok, structural, codes, reasons}。data は構造化出力そのまま（lines[] は {text, end_kana}）"""
    codes, reasons = [], []

    def add(code, msg):
        codes.append(code)
        reasons.append(f"{code} {msg}")

    verses = data.get("verses") if isinstance(data, dict) else None
    if not isinstance(verses, list):
        add("all:count", "verses がない")
        return {"ok": False, "structural": False, "codes": codes, "reasons": reasons}
    want = bars // 2
    if len(verses) != want:
        add("all:count", f"バースが{len(verses)}本（{bars}小節なら{want}本）")
    for i, v in enumerate(verses):
        V = f"V{i + 1}"
        who = a_id if i % 2 == 0 else b_id
        if not isinstance(v, dict) or v.get("characterId") != who:
            add(f"{V}:speaker", f"話し手が {v.get('characterId') if isinstance(v, dict) else None}（{who} の番）")
        lines = v.get("lines") if isinstance(v, dict) and isinstance(v.get("lines"), list) else []
        if len(lines) != 4 or not all(isinstance(l, dict) and isinstance(l.get("text"), str) and isinstance(l.get("end_kana"), str) for l in lines):
            add(f"{V}:lines", f"行が{len(lines)}行（4行のはず）")
            continue
        sigs = []
        for j, l in enumerate(lines):
            L = f"{V}L{j + 1}"
            if re.search(r"[<>]", SPAN.sub("", l["text"])):
                add(f"{L}:html", "韻の印以外のタグがある")
            if not END_MARK.search(l["text"]):
                add(f"{L}:endmark", "行末が韻の印で終わっていない")
            vs = vowels(l["end_kana"])
            if not l["end_kana"] or "?" in vs:
                add(f"{L}:kana", f"end_kana「{l['end_kana']}」がひらがなだけでない")
            elif len(vs) < 3:
                add(f"{L}:kana", f"end_kana「{l['end_kana']}」の母音が3つ未満")
            else:
                sigs.append((j, vs))
        if len(sigs) >= 2:
            lasts = {vs[-1] for _, vs in sigs}
            sig3 = {vs[-3:] for _, vs in sigs}
            show = "／".join(f"{lines[j]['end_kana']}={'-'.join(vs[-3:])}" for j, vs in sigs)
            if len(lasts) > 1:
                add(f"{V}:last", f"行末の最後の母音が割れた（{show}）")
            elif len(sig3) > 1:
                add(f"{V}:sig3", f"末尾3母音が一致しない（{show}）")
        if i > 0:
            prev = verses[i - 1]
            prev_last = None
            if isinstance(prev, dict) and isinstance(prev.get("lines"), list) and len(prev["lines"]) > 3 \
                    and isinstance(prev["lines"][3], dict) and isinstance(prev["lines"][3].get("text"), str):
                found = SPAN.findall(prev["lines"][3]["text"])
                prev_last = found[-1] if found else None
            m = HEAD_MARK.search(lines[0]["text"])
            head = m.group(1).strip() if m else ""
            ok = bool(head and prev_last and (head == prev_last or prev_last in head or head in prev_last))
            if not ok:
                add(f"{V}L1:retort", f"1行目の頭で相手の締め語「{prev_last or '?'}」を拾っていない")
    structural = not any(re.search(r":(count|speaker|lines)$", c) for c in codes)
    return {"ok": not codes, "structural": structural, "codes": codes, "reasons": reasons}


def to_app_shape(data):
    """アプリ（index.html の drawAiBattle）が受け取る形: {verses:[{characterId, characterName, displayRhyme, lines:[文字列×4]}], flavor}"""
    out = []
    for v in data["verses"]:
        last = next((vs for vs in (vowels(l["end_kana"]) for l in v["lines"]) if len(vs) >= 3 and "?" not in vs), None)
        out.append({
            "characterId": v["characterId"],
            "characterName": NAMES.get(v["characterId"], v["characterName"]),
            "displayRhyme": "-".join(last[-3:]) if last else v["displayRhyme"],
            "lines": [l["text"] for l in v["lines"]],
        })
    return {"verses": out, "flavor": data["flavor"]}


# プロンプト（live/prompt.md）の分割と差し込み。JS 版と同じ印・同じ置き換え
USER_MARK, RETRY_MARK = "<!-- USER_TEMPLATE -->", "<!-- RETRY_TEMPLATE -->"


def split_prompt(md):
    system, rest = md.split(USER_MARK, 1)
    user, retry = rest.split(RETRY_MARK, 1)
    return {"system": system.strip(), "user": user.strip(), "retry": retry.strip()}


def fill(tpl, vars_):
    return re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: str(vars_.get(m.group(1), "")), tpl)


def user_message(tpl, a_id, b_id, bars, style, theme):
    n = bars // 2
    order = "→".join(NAMES[a_id if i % 2 == 0 else b_id] for i in range(n))
    return fill(tpl, {"A_NAME": NAMES[a_id], "A_ID": a_id, "B_NAME": NAMES[b_id], "B_ID": b_id, "BARS": bars,
                      "VERSES": n, "ORDER": order, "STYLE": style, "THEME": theme or ""})


def retry_message(user_tpl, retry_tpl, card, previous_json, reasons):
    return user_message(user_tpl, **card) + "\n\n" + fill(retry_tpl, {"REASONS": "\n".join(f"- {r}" for r in reasons), "PREVIOUS": previous_json})
