# コーパス工場 生成規格書（名勝負ライブラリのストック生産）

手動バッチ（content係）と毎日のスケジュールタスクが共通で従う正典。変えたらここを直す。

## 目的
Claude（Opusサブエージェント＝サブスク枠内）で高品質バトルを量産し、`docs/claude_corpus.jsonl` に蓄積する。
用途は2つ: ①A案エンジンへの採掘素材 ②将来の「名勝負モード」（校正済みバトルをランダム再生）の弾。
**コーパスは非公開（gitignore済み）。公開判断が出るまでリポジトリに載せない。**

## スキーマ（1バトル=1行のJSONL・整形JSON不可）
`docs/claude_corpus.jsonl` の既存行を必ず1行読んで踏襲する。要点:
- `{ts, model:"claude-opus-sub", aId, bId, bars:8, mode:"claude-teacher", style, theme, data:{verses:[...4個], flavor}}`
- verses は a,b,a,b の順。各バース `{characterId, characterName, displayRhyme, lines:[4行]}`
- ts は生成時刻のISO文字列。aId/bId は koji/yeast/toji/lactic/rice

## 品質基準
- 各バースの行末を**2〜3語で母音末尾3つ一致**（拗音は2母音と数える）。displayRhymeに主韻を書く
- **日本語の意味が通ることが韻より優先**。人格は `docs/personas.md` に従う（dis/respect/一人称/口調）
- 実在しない醸造用語を作らない（怪しければ一般語に逃がす）。大言壮語（最強・無敵・伝説等）は歓迎
- 同じ語を別バトルで使うのは可。ただし1バース内で同語3回は不可

## 作風ローテーション（偏り防止。曜日または担当バッチで回す）
1. 王道戦: standard多め・テーマ薄め（基本の名勝負）
2. 毒舌回: savage多め（dis全開・ただし醸造の事実に基づく攻め口）
3. 季節テーマ戦: 花見・梅雨・夏の火入れ・秋あがり・雪の仕込み・正月 など全戦テーマ付き
4. 変わり種テーマ戦: 停電の夜・品評会落選・後継者問題・海外輸出・百年蔵の記念日・AI導入 など
5. リスペクト戦: standard・相手を認めつつ超える構成
- ペアは全10組をまんべんなく。乳酸菌・杜氏・酒米など薄いペアを優先的に厚く

## 出力先と検証（追記事故防止のプロトコル）
- **手動バッチ（並列時）**: `docs/corpus_batches/YYYY-MM-DD_<記号>.jsonl` に自分専用ファイルで書く（マスターへ直接追記しない）。マージは本体が検証後に行う
- **スケジュールタスク（単独実行）**: マスター `docs/claude_corpus.jsonl` へ直接追記してよい。ただし追記前に既存行数を数え、追記後に「全行 json.loads 可・verses4×lines4」を必ず検証。検証コマンド:
  `python3 -c "import json;rows=[json.loads(l) for l in open('docs/claude_corpus.jsonl')];assert all(len(r['data']['verses'])==4 and all(len(v['lines'])==4 for v in r['data']['verses']) for r in rows);print(len(rows),'行OK')"`
  検証に失敗したら自分の追記行を取り除いて戻す
- index.html・lint.js・docs/の他ファイルは触らない

## 記録
- スケジュールタスクは実行後、Vault `📤受け渡し/当日.md` の「💡今日やったこと」に1行（例: `- 醸造ラップバトル工場: 6本追加（累計N本・作風=季節テーマ戦）`）
- ストックが+50本たまるごとに、通常セッションで校正（採掘→A案還元 or 名勝負選定）を回すのが目安
