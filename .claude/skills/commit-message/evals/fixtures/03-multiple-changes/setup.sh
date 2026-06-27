#!/usr/bin/env bash
# 複数の論理変更が混在: 読み上げのバグ修正と、無関係な README 大幅更新を同時にステージ。
# 期待: 警告＋分割提案＋各メッセージ案。
set -euo pipefail
DIR="${1:?usage: setup.sh <target_dir>}"
mkdir -p "$DIR"
cd "$DIR"
git init -q
git config user.email "dev@example.com"
git config user.name "Dev"

# --- 履歴 ---
cat > package.json <<'EOF'
{ "name": "speech-sandbox", "version": "0.1.0" }
EOF
mkdir -p src
cat > src/speak.js <<'EOF'
export function speak(text) {
  const rate = 1;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  speechSynthesis.speak(u);
}
EOF
cat > README.md <<'EOF'
# speech-sandbox

Web Speech API のサンドボックス。
EOF
git add -A && git commit -qm "feat: 読み上げ機能を追加"

# --- ステージ済みの変更 (入力: 2つの無関係な変更) ---
# (1) バグ修正: rate の下限クランプ
cat > src/speak.js <<'EOF'
export function speak(text, rate = 1) {
  const safeRate = Math.max(0.1, Math.min(rate, 10));
  const u = new SpeechSynthesisUtterance(text);
  u.rate = safeRate;
  speechSynthesis.speak(u);
}
EOF
# (2) 無関係な README 更新
cat > README.md <<'EOF'
# speech-sandbox

ブラウザの Web Speech API (SpeechSynthesis) を試すためのサンドボックスです。

## セットアップ

```bash
pnpm install
pnpm dev
```

## 使い方

テキストを入力し、速度・音程・音声を調整して読み上げます。

## ライセンス

MIT
EOF
git add -A
