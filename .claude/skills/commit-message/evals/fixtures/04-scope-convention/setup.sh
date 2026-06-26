#!/usr/bin/env bash
# scope 慣習のリポジトリ: 履歴が `feat(scope):` / `fix(scope):` 形式を一貫して使う。
# 認証まわりに新機能 (パスワードリセット) を追加してステージ。
# 期待: scope を踏襲した `feat(auth): ...`。
set -euo pipefail
DIR="${1:?usage: setup.sh <target_dir>}"
mkdir -p "$DIR"
cd "$DIR"
git init -q
git config user.email "dev@example.com"
git config user.name "Dev"

# --- 履歴 (一貫して scope を使用) ---
cat > package.json <<'EOF'
{ "name": "app", "version": "0.1.0" }
EOF
git add -A && git commit -qm "chore: プロジェクト初期化"

mkdir -p src/auth src/editor
cat > src/auth/login.js <<'EOF'
export function login(user, pass) {
  return fetch("/api/login", { method: "POST", body: JSON.stringify({ user, pass }) });
}
EOF
git add -A && git commit -qm "feat(auth): ログイン機能を実装"

cat > src/editor/toolbar.js <<'EOF'
export const toolbar = ["bold", "italic"];
EOF
git add -A && git commit -qm "feat(editor): ツールバーを追加"

cat > src/auth/login.js <<'EOF'
export function login(user, pass) {
  if (!user || !pass) throw new Error("required");
  return fetch("/api/login", { method: "POST", body: JSON.stringify({ user, pass }) });
}
EOF
git add -A && git commit -qm "fix(auth): 空入力時のバリデーションを追加"

# --- ステージ済みの変更 (入力) ---
cat > src/auth/reset.js <<'EOF'
export function requestPasswordReset(email) {
  return fetch("/api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
EOF
git add src/auth/reset.js
