import { cn } from "@/lib/utils";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { useEffect, useRef, type FC } from "react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TaskItem, TaskList } from "@tiptap/extension-list";

/** 読み上げ 1 フレーズ。`from`/`to` は ProseMirror ドキュメント上の位置。 */
export type Phrase = { text: string; from: number; to: number };

type Props = {
  onChange: (phrases: Phrase[]) => void;
  /** 読み上げ中のフレーズ index。null ならハイライト無し。 */
  currentPhraseIndex: number | null;
  /** 編集可能か（読み上げ中は false にして位置を固定する）。 */
  editable: boolean;
};

const SPLIT_CHARS = "、。．？！\n";

/**
 * ProseMirror ドキュメントを走査し、表示テキストを句読点とブロック境界で
 * フレーズに分割する。各フレーズはドキュメント上の位置（from/to）を保持する。
 */
const computePhrases = (doc: ProseMirrorNode): Phrase[] => {
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

/**
 * Markdown の貼り付けをサポートする Extension
 * @see https://github.com/ueberdosis/tiptap/issues/1649#issuecomment-2731296289
 */
const MarkdownPaste = Extension.create({
  name: "markdownPaste",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          handlePaste: (_view, event) => {
            const clipboardText = event.clipboardData?.getData("text/plain");

            if (clipboardText) {
              this.editor.commands.insertContent(clipboardText, { contentType: "markdown" });

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

const highlightPluginKey = new PluginKey("playbackHighlight");

/**
 * 読み上げ中フレーズの背景ハイライトを描く Extension。
 * `setMeta(highlightPluginKey, { from, to } | null)` で対象範囲を更新する。
 */
const PlaybackHighlight = Extension.create({
  name: "playbackHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: highlightPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          // ProseMirror に何か変化 (トランザクション) が起きるたびに呼ばれる
          apply(tr, value) {
            const meta = tr.getMeta(highlightPluginKey) as
              | { from: number; to: number }
              | null
              | undefined;
            if (meta === undefined) {
              return value.map(tr.mapping, tr.doc);
            }
            if (meta === null) {
              return DecorationSet.empty;
            }
            return DecorationSet.create(tr.doc, [
              Decoration.inline(meta.from, meta.to, {
                class: "speaking-highlight",
              }),
            ]);
          },
        },
        props: {
          decorations(state) {
            return highlightPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

const Tiptap: FC<Props> = ({ onChange, currentPhraseIndex, editable }) => {
  // 最後に算出したフレーズ配列。currentPhraseIndex から位置を引くために保持する。
  const phrasesRef = useRef<Phrase[]>([]);

  const emitPhrases = (doc: ProseMirrorNode) => {
    const phrases = computePhrases(doc);
    phrasesRef.current = phrases;
    onChange(phrases);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      MarkdownPaste,
      PlaybackHighlight,
      TaskList,
      TaskItem.configure({
        HTMLAttributes: {
          class: cn("flex items-start gap-2 p-0", "[&>div]:flex-1 [&>div>p]:m-0"),
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-ul:data-[type=taskList]:ps-2 p-5 [&_li>p]:m-0 border border-input max-w-none rounded-lg",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        ),
      },
    },
    content: `
<h2>
  こんにちは！
</h2>
<p>
  これは <strong>Tiptap</strong> の<em>基本構造</em>を示したサンプルです。もちろん、**テキストエディタ**に期待されるような、あらゆる基本的なテキストスタイルに対応しています。ですが、こちらのリスト機能もぜひご覧ください：
</p>
<ul>
  <li>
    このように箇条書きの項目が1つ…
  </li>
  <li>
    …または2つと並べられます。
  </li>
</ul>
<p>
  素敵だと思いませんか？しかも、これらはすべてその場で編集可能です。まだまだこれだけではありません。次はコードブロックを試してみましょう：
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  驚くのも無理はありません。ですが、これでもほんの氷山の一角にすぎないのです。ぜひ実際に色々とクリックして試してみてください。他のサンプルをチェックするのもお忘れなく！
</p>
<blockquote>
  わあ、本当に素晴らしいわ。よくやったわね！👏
  <br />
  — お母さんより
</blockquote>
`,
    onUpdate: ({ editor: currentEditor }) => {
      emitPhrases(currentEditor.state.doc);
    },
    onCreate: ({ editor: currentEditor }) => {
      emitPhrases(currentEditor.state.doc);
    },
  });

  // 読み上げ中は編集を禁止し、フレーズ位置を固定する。
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // 現在のフレーズ位置にハイライトの Decoration を反映する。
  useEffect(() => {
    if (!editor) {
      return;
    }
    // currentPhraseIndex が null の場合はハイライトを消す (DecorationSet.empty)
    if (currentPhraseIndex === null) {
      editor.view.dispatch(
        editor.view.state.tr.setMeta(highlightPluginKey, null),
      );
      return;
    }
    const phrase = phrasesRef.current[currentPhraseIndex];
    editor.view.dispatch(
      editor.view.state.tr.setMeta(
        highlightPluginKey,
        {  from: phrase.from, to: phrase.to },
      ),
    );
  }, [editor, currentPhraseIndex]);

  return <EditorContent editor={editor} />;
};

export default Tiptap;
