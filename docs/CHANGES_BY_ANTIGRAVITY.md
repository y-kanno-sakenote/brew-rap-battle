# Antigravity(Gemini)での変更内容サマリー

## 概要
既存の「テンプレート方式（A案）」を完全に維持しつつ、Google Gemini API を使った「AIバトルモード（B案）」を `index.html` に追加した。
ユーザーがUI上で切り替えて使える**ハイブリッド構成**。

---

## 変更箇所（すべて `index.html` 内）

### 1. HTML部分（コントロールパネル）
- **生成エンジン切り替え `<select id="engine">`** を追加
  - 「テンプレート (A案)」と「Gemini AI (B案)」を選択可能
- **Gemini APIキー入力欄 `<div id="apiKeyArea">`** を追加
  - `type="password"` の入力欄、表示/非表示トグルボタン付き
  - Gemini AI選択時のみ表示される（`display:none` ↔ `display:flex`）
  - 注意書き「キーはローカル（localStorage）に保存され、Google APIと直接通信します。」を表示
- 既存の「韻モード」ラベルに `id="modeOpt"` を付与（エンジン切り替え時の表示制御用）

### 2. JavaScript部分

#### 新しい変数・DOM参照
```javascript
const engineSel = document.getElementById('engine');
const apiKeyArea = document.getElementById('apiKeyArea');
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const modeOpt = document.getElementById('modeOpt');
```

#### エンジン切り替えロジック
- `engineSel.onchange` でGemini選択時にAPIキー入力欄を表示し、韻モードを非表示に
- `localStorage` からAPIキーを読み込み・保存
- パスワード表示/非表示切り替え

#### `renderBattle()` の変更
- `function` → `async function` に変更
- 冒頭で `engineSel.value === 'gemini'` の場合に `renderBattleGemini()` へ分岐
- テンプレート方式（A案）のロジックはそのまま維持

#### 新関数 `renderBattleGemini(aId, bId, bars)`
- APIキー未入力時はtoastを出してテンプレート方式にフォールバック
- ローディングアニメーション表示
- **Gemini API呼び出し**:
  - エンドポイント: `v1beta/models/gemini-3.5-flash:generateContent`
  - `systemInstruction` でキャラクター設定・韻のルール・ディスとアンサーの指示を送信
  - `generationConfig` で `responseMimeType: "application/json"` + `responseSchema` を使い構造化出力
  - `temperature: 0.8`
- **レスポンスのパース**: JSON → verses配列 → 既存UIの `.verse` HTMLに変換
- **エラーハンドリング**: エラー時は画面にメッセージ表示 + テンプレート方式へのフォールバックボタン

### 3. プロンプト設計（systemInstruction の内容）
以下のルールをAIに指示:
- **脚韻（行末）と中間韻（行中）の両立**: 行末で3〜5文字以上の長い母音で韻を踏みつつ、行中・行頭でも韻を散りばめる
- **アンサーでの踏み返し**: 後攻は先攻の最後の韻の母音で1行目を踏み返す
- **韻の可視化**: 韻を踏んでいるすべての単語を `<span class="rhyme">単語</span>` で囲む（行末だけでなく行中も）
- **キャラクター性、ディスとアンサー、醸造専門用語の活用**

---

## 今後の課題・残タスク
1. **プロンプトのさらなるチューニング**: 韻の精度がまだ改善の余地あり。Few-shotの例をプロンプトに入れる等の工夫が有効
2. **テンプレート方式（A案）の高度化**: 品詞メタデータ、対話性（アンサーロジック）、トーンチェイン（自己紹介→ディス→誇り→オチ）の導入
3. **APIモデルの将来対応**: 現在 `gemini-3.5-flash` を使用。モデル名が変更される場合は更新が必要
