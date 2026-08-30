import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/** 読み上げ 1 フレーズ。`from`/`to` は ProseMirror ドキュメント上の位置。 */
export type Phrase = { text: string; from: number; to: number };

const SPLIT_CHARS = "、。．？！\n";

/**
 * ProseMirror ドキュメントを走査し、表示テキストを句読点とブロック境界で
 * フレーズに分割する。各フレーズはドキュメント上の位置（from/to）を保持する。
 */
export const computePhrases = (doc: ProseMirrorNode): Phrase[] => {
  const phrases: Phrase[] = [];
  let current: Phrase | null = null;

  // 組み立て中のフレーズを吐き出して、current を空にする (空・空白のみは捨てる)
  const flush = () => {
    if (current && current.text.trim() !== "") {
      phrases.push(current);
    }
    current = null;
  };

  doc.descendants((node, pos) => {
    // 新しいブロック・改行（hardBreak）でフレーズを区切る
    if (node.isBlock || node.type.name === "hardBreak") {
      flush();
      return;
    }

    if (node.isText && node.text) {
      const text = node.text;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charPos = pos + i;
        if (!current) {
          current = { text: "", from: charPos, to: charPos };
        }
        current.text += char;
        current.to = charPos + 1;
        if (SPLIT_CHARS.includes(char)) {
          flush();
        }
      }
    }
  });

  flush();
  return phrases;
};
