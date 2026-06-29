# Web Speech API（SpeechSynthesis）のクロスブラウザ問題 調査メモ

ブラウザの `SpeechSynthesis`（読み上げ）はブラウザ・OS ごとに挙動が大きく異なり、
特に **一時停止／再開** と **長文の途中打ち切り** が実装上のハマりどころになる。

参考にした記事:

- [Resuming a paused speech using SpeechSynthesis.resume() on Chrome Android doesn't work (Stack Overflow #58953882)](https://stackoverflow.com/questions/58953882/resuming-a-paused-speech-using-speechsynthesis-resume-on-chrome-android-doesn)
- [Cross-browser speech synthesis – the hard way and the easy way (dev.to / Jan Küster)](https://dev.to/jankapunkt/cross-browser-speech-synthesis-the-hard-way-and-the-easy-way-353)

---

## 1. Chrome Android で `resume()` が効かない問題（Stack Overflow）

### 問題

- モバイル（特に Chrome Android）では **`pause()` が事実上 `cancel()` として振る舞う**。
  一時停止したつもりが発話そのものが止まり、`resume()` を呼んでも再生されない。
- 結果として「途中から再開する」UX が素直に実装できない。

### 対処法

1. **モバイルでは pause/resume に頼らない**
   一時停止は「`cancel()` して再生位置（どの文・どの文字まで読んだか）を自前で覚える」。
   再開時はその位置から新しい `SpeechSynthesisUtterance` を作って `speak()` し直す。
   ブラウザの resume に頼らず、アプリ側で状態管理する。
2. **テキストを細かく分割して読む**
   長文を 1 つの Utterance で渡さず、文単位で区切って順に `speak()`。
   `onend` で次チャンクへ進めれば「再開位置 = 次チャンクの先頭」となり cancel/再 speak が安全。
3. **`resumeInfinity` ハック**（下記 Chrome 15 秒バグ用）
   `setInterval` で定期的に `pause()`→`resume()` を呼び発話の打ち切りを防ぐ。
   ただし **Android でこれをやると逆に止まる** ため、プラットフォーム分岐が必要。

---

## 2. クロスブラウザ音声合成「難しい道」と「簡単な道」（dev.to）

EasySpeech の作者による記事。Web Speech API がいかに壊れているか（hard way）と、
それを吸収するライブラリ（easy way）の解説。

### 「難しい道」= Web Speech API の罠

| 罠                           | 内容                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 対応状況                     | ドラフトから約 10 年経つが今も experimental。非対応ブラウザもある                                                             |
| voice 読み込み方式がバラバラ | Firefox/Safari は同期、Chrome は `onvoiceschanged` で非同期。Firefox Android は初回だけ非同期。古い Safari はポーリングが必要 |
| 言語コードの表記揺れ         | `en-US`（標準）／ `en_GB`（Android、アンダースコア）／ `eng-GBR-f00`（Firefox Android、3 文字コード）                         |
| pause 非対応                 | Android では `pause()` が cancel になる（§1 と同じ）                                                                          |
| Chrome 15 秒バグ             | デスクトップ Chrome は長文を約 15 秒で勝手に打ち切る                                                                          |
| イベントが発火しない         | `onboundary` / `onpause` / `onresume` が信頼できない                                                                          |

### 「難しい道」での回避パターン

1. voice 取得は「同期アクセス → ダメなら `onvoiceschanged` → それでもダメならポーリング」の多段フォールバック
2. Chrome 15 秒バグには 5 秒ごとの pause/resume ループ（ただし Android では使わない）
3. Android / デスクトップでロジック分岐
4. ブラウザの `paused` 状態が当てにならないので **再生状態を自前管理**

### 「簡単な道」= `easy-speech` ライブラリ

上記を内部で吸収してくれる npm パッケージ。

```javascript
import EasySpeech from "easy-speech";

EasySpeech.detect(); // 機能・対応状況を検出
EasySpeech.init() // voice 読み込みの差異を吸収
  .then(() => EasySpeech.speak({ text: "Hello!" }));
```

機能検出・最適な voice 読み込み・プラットフォーム別の既知バグ修正が入っており、
自前で回避策を書かなくて済む。

---

## 3. 本リポジトリとの関係

- 現在のブランチ `feat/easy-speech`。
- `src/App.tsx` はすでに **§2 の「難しい道」の主要な回避策を手書きで実装** している:
  - 句読点（`、。．？！\n`）でフレーズ分割し、`onend` で再帰的に `speak(phraseIndex + 1)`。
    → Chrome 15 秒バグ回避。
- §1 の resume 問題も、「cancel して位置を覚える」方式と相性が良い構造になっている。

### 検討ポイント

- 手書きの回避策を `easy-speech` に置き換えるか。
  - 利点: voice 読み込み・プラットフォーム別バグ修正をライブラリに委譲できる。
  - 留意: 現状はフレーズ分割で 15 秒バグを回避できているため、移行で得られる差分を見極める必要がある。
