# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語

ユーザーへの応答は常に日本語で行うこと。

## 概要

ブラウザの [Web Speech API](https://developer.mozilla.org/ja/docs/Web/API/Web_Speech_API)（`SpeechSynthesis`）を試すためのシングルページのサンドボックス。ユーザーが Tiptap エディタにリッチテキストを入力／貼り付けると、アプリがそれを Markdown に変換し、速度（rate）・音程（pitch）・音声（voice）を調整しながら読み上げる。音声は日本語（`ja-JP`）に絞り込まれている。バックエンドは存在しない。

## コマンド

パッケージマネージャは **pnpm**。

- `pnpm dev` — Vite 開発サーバを起動（HMR 有効）
- `pnpm build` — 型チェック（`tsc -b`）を行ってから本番ビルド
- `pnpm lint` — oxlint を実行
- `pnpm fmt` — oxfmt でフォーマット（書き込まずチェックのみは `pnpm fmt:check`）
- `pnpm preview` — 本番ビルドをプレビュー

テストランナーは設定されていない。

## ツールチェーンの注意点

- ESLint/Prettier ではなく **oxc** を使用: リンタは `oxlint`（`.oxlintrc.json`）、フォーマッタは `oxfmt`（`.oxfmtrc.json`）。Zed のフォーマッタは `.zed/settings.json` で `oxfmt` に接続されている。
- **React Compiler** が `vite.config.ts` の Babel プラグイン（`@rolldown/plugin-babel` + `reactCompilerPreset`）経由で有効。コンパイラが自動で行うメモ化のために `useMemo`/`useCallback` を手動で追加しないこと。
- `@/*` は `./src/*` のエイリアス（`vite.config.ts` と `tsconfig.app.json` の両方で設定）。
- TypeScript はやや厳格: `noUnusedLocals`、`noUnusedParameters`、`verbatimModuleSyntax`、`erasableSyntaxOnly` が有効。意図的に未使用にする値は `_` を接頭辞に付ける（`App.tsx` の `_currentPhraseIndex` を参照）。

## アーキテクチャ

コードはすべて `src/` 配下にある。実質的なロジックは次の 2 ファイルが持つ:

- **`src/App.tsx`** — 読み上げの状態と合成（synthesis）制御をすべて担う。主な挙動:
  - テキストは日本語の句読点（`、。．？！\n`）で分割され、**1 フレーズずつ**読み上げられる。各 `SpeechSynthesisUtterance.onend` が再帰的に次のフレーズ（`speak(phraseIndex + 1)`）を起動する。これにより長い発話に対するブラウザの制限を回避している。
  - 単一の Play/Pause ボタンは `<form>` の submit（`playOrPause`）。既に読み上げ中なら一時停止／再開をトグルし、そうでなければフレーズ 0 から開始する。Reset は `speechSynthesis.cancel()` を呼ぶ。
  - 利用可能な音声は `voiceschanged` イベント（音声は非同期に読み込まれる）を購読する `useEffect` で取得し、`ja-JP` に絞り込む。
- **`src/components/Tiptap.tsx`** — リッチテキストエディタ。StarterKit + `@tiptap/markdown` 拡張 + list / task-list 拡張を使用。編集のたび（`onUpdate`/`onCreate`）に `editor.getMarkdown()` を呼び、**Markdown 文字列**を `onChange` prop 経由で `App` に渡す。この Markdown が読み上げ対象になる。貼り付けた平文を Markdown として解釈するためのカスタム `MarkdownPaste` ProseMirror プラグインを含む。

- **`src/components/ui/`** — shadcn/ui コンポーネント（スタイル `radix-nova`、ベースカラー `neutral`、アイコンは `lucide-react`）。設定は `components.json`。新しいコンポーネントは手書きせず shadcn CLI で追加すること。
- **`src/lib/utils.ts`** — `cn()`（clsx + tailwind-merge）。
- **`src/index.css`** — Tailwind CSS v4（`@tailwindcss/vite` で設定、`tailwind.config.js` は無い）。エディタの `prose` スタイル用に `@tailwindcss/typography` を含む。
