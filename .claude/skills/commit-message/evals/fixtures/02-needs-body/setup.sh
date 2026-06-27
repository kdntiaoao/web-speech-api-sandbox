#!/usr/bin/env bash
# 理由を書くべき変更: 長文読み上げが途中で停止するバグを、句読点で分割して
# 逐次再生する方式に変更。diff だけでは「なぜ」が分かりにくい。
# 期待: `fix: ...` ＋ 理由・影響を説明する body。
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
git add -A && git commit -qm "chore: プロジェクト初期化"

mkdir -p src
cat > src/speak.js <<'EOF'
export function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(u);
}
EOF
git add -A && git commit -qm "feat: 読み上げ機能を追加"

# --- ステージ済みの変更 (入力) ---
cat > src/speak.js <<'EOF'
function splitPhrases(text) {
  return text.split(/(?<=[、。．？！\n])/).filter((s) => s.trim());
}

export function speak(text, index = 0) {
  const phrases = splitPhrases(text);
  if (index >= phrases.length) return;
  const u = new SpeechSynthesisUtterance(phrases[index]);
  u.onend = () => speak(text, index + 1);
  speechSynthesis.speak(u);
}
EOF
git add src/speak.js
