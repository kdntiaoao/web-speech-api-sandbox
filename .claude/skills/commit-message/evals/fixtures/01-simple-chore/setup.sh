#!/usr/bin/env bash
# 自明な小変更: 日本語 Conventional Commits 履歴 (scope なし) のリポジトリに
# lint 設定を1行追加してステージする。
# 期待: `chore: ...` 1行、body なし。
set -euo pipefail
DIR="${1:?usage: setup.sh <target_dir>}"
mkdir -p "$DIR"
cd "$DIR"
git init -q
git config user.email "dev@example.com"
git config user.name "Dev"

# --- 履歴 (日本語 Conventional Commits, scope なし) ---
cat > package.json <<'EOF'
{
  "name": "speech-sandbox",
  "version": "0.1.0",
  "scripts": { "lint": "oxlint" }
}
EOF
git add -A && git commit -qm "chore: プロジェクト初期化"

cat > .oxlintrc.json <<'EOF'
{
  "rules": {
    "no-debugger": "error"
  }
}
EOF
git add -A && git commit -qm "chore: oxlint 導入"

echo "console.log('hi')" > index.js
git add -A && git commit -qm "feat: エントリポイント追加"

# --- ステージ済みの変更 (入力) ---
cat > .oxlintrc.json <<'EOF'
{
  "rules": {
    "no-debugger": "error",
    "no-console": "warn"
  }
}
EOF
git add .oxlintrc.json
