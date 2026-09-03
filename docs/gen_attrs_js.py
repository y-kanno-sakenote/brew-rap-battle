#!/usr/bin/env python3
"""docs/vocab_attrs.json → index.html の VOCAB_ATTRS ブロックを再生成する。使い方: python3 docs/gen_attrs_js.py"""
import json, os, re
D=os.path.dirname(os.path.abspath(__file__)); root=os.path.dirname(D)
rows=json.load(open(os.path.join(D,"vocab_attrs.json"),encoding="utf-8"))["rows"]
attrs={r["w"]:{"stage":r.get("stage") or None,"owner":r.get("owner") or None,"spec":r.get("spec") or None} for r in rows}
js="const VOCAB_ATTRS = "+json.dumps(attrs,ensure_ascii=False,separators=(",",":"))+";"
p=os.path.join(root,"index.html"); s=open(p,encoding="utf-8").read()
s2=re.sub(r"(// ==== VOCAB_ATTRS \(auto[^\n]*\n)(.*?)(\n// ==== /VOCAB_ATTRS ====)", lambda m: m.group(1)+js+m.group(3), s, count=1, flags=re.S)
assert s2!=s or js in s, "ブロックが見つからない"
open(p,"w",encoding="utf-8").write(s2); print(f"VOCAB_ATTRS {len(attrs)}語を書き込み")
