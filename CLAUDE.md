# 醸造ラップバトル ジェネレーター

麹・酵母・杜氏・乳酸菌・酒米の醸造キャラがラップバトルする単一HTMLの遊びアプリ。
既定のルールエンジンは完全オフライン・APIキー不要。任意で Claude（お題でつくる・中継 `worker/` 経由）／Ollama（手元のPC）でも生成できる。成果物は `index.html`（ブラウザで開くだけで動く）＋中継 `worker/`（Cloudflare Worker）。

## 正典地図（詳細はここを読む。CLAUDE.mdには書き足さない）
- 韻ロジック・意味ルール(R1/R2/R3)・エンジン構成・語彙拡張の指針: `docs/rhyme_reference.md`
- 日付付きの増設履歴・計測値・次の一手・ネタ元: `docs/dev_log.md`
- 検証ツール（このフォルダ常駐）: `mix_test.js`（名勝負ミックスの組み替え規則）・`harness.js`（韻/反復/深さ/クロス）・`rep.js`（バース内反復）・`lint.js`（R2/R3意味整合）
- 旧proto版13本は `archive/` に退避済み

## 憲法（変えない原則）
- 韻＝母音シグネチャ（末尾3母音コア＋響き韻/グラデーション韻の段階緩和）。同一role内は単一sig3が絶対。
- 意味ルール R1(韻)/R2(formの純度)/R3(スロット適合) を必ず守る。
- 語・フレームを足したら必ず `node lint.js`＋`node harness.js`＋`node rep.js` で機械検証してから確定。数値は実測が正。
- 3スロットフレームは10語以上のバケット限定（反復ガード）。

## 現状（2026-09-27時点）
総語220／役割68。韻100%全キャラ・意味lint 0件・クロス10/10・rep最大0.3%・**全語出現**（死に語ゼロ）。
エンジンは各フィルタ（hardDeep/フレーム形/音数・子音/softDeep）を確率化済み。
**既定エンジンは「名勝負ミックス」**（2026-09-27〜：コーパスの2行組を同じ相手・同じ韻で組み替える。検証は `node mix_test.js`。コーパスが読めない file:// では旧・単語シグネチャ方式）。B/C案（Claude/Ollama）とペルソナ・ビート・呼応（旧方式側の踏み返し2型＋先攻側）も実装済み。画面上の呼び名は名勝負ミックス／Claude（お題でつくる）／Ollama。
AIエンジンは生成中ボタン無効・タイムアウト付き（Ollama 60秒〜・Claude 200秒）。
**B案 Claude（2026-10-08 Gemini から置き換え）**: 画面→中継 `worker/`（claude-opus-5-5・effort low・プロンプト/スキーマ/韻検査は `live/` を Python 試作 `tools/live_trial.py` と共有）。中継は**実際に使った金額**を Durable Object 1個（SQLite・`worker/src/budget.js`）に1件ずつ積み（同時要求でも素通りしない）、日0.66ドル・月20ドル（wrangler.toml の vars）に見込み0.15ドルを足して超えるなら 429、IPごと1日3回。`index.html` の `LIVE_API_URL` が空のあいだは選択肢に出ない（未デプロイ）。検証は `cd worker && npm test`・`node gate_test.js`（4節が Claude 画面側）。
Ollamaを公開URLから使うには `OLLAMA_ORIGINS` に `https://y-kanno-sakenote.github.io` が必要（素のOllamaは github.io を403で拒否。このMacは launchctl で設定済み）。

## 名勝負ライブラリ（規格書: `docs/corpus_factory.md`）
Claude教師バトルを毎朝12本自動生産（スケジュールタスク・半数以上お題なし）＋手動バッチ。既定エンジン「名勝負ミックス」の素材（2026-09-28時点196本）。
コーパスは公開データ（`docs/claude_corpus.jsonl`）で、フッター「遊び心」の隠しリンクからビューアあり。

## 残タスク
- 補充のたびに `node mix_test.js`（DETAIL=1でペア別）と、相手違い（名指ししない当てこすり）の目視を1回。残る課題は看板語の繰り返し（12小節で1バトル3回以上が93%）＝工場の言い換えルールで改善待ち。詳細は `docs/dev_log.md`。

## 作業ルール
- 日本語で対応。トークン節約（巨大ファイルは一覧→部分読み、必要ならサブエージェント）。
- 編集対象は必ずこの `dev/brew-rap-battle/index.html`。
- ローカルプレビュー: launch.json の "brew-rap-static"（ポート8787）。
