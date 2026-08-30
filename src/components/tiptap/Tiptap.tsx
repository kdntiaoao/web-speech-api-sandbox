import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { useEffect, useRef, type FC } from "react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { highlightPluginKey, MarkdownPaste, PlaybackHighlight } from "./extensions";
import { initialContent } from "./initial-content";
import { computePhrases, type Phrase } from "./utils";

type Props = {
  onChange: (phrases: Phrase[]) => void;
  /** 読み上げ中のフレーズ index (null ならハイライトなし) */
  currentPhraseIndex: number | null;
  /** 編集可能か (読み上げ中は false にして位置を固定する) */
  editable: boolean;
};

const Tiptap: FC<Props> = ({ onChange, currentPhraseIndex, editable }) => {
  // 最後に算出したフレーズ配列
  // currentPhraseIndex から位置を引くために保持する
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
          "prose prose-sm max-w-none rounded-lg border border-input p-3 xl:prose-base xl:p-5 prose-ul:data-[type=taskList]:ps-2 [&_li>p]:m-0",
          "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
          "[[contenteditable='false']]:cursor-not-allowed [[contenteditable='false']]:bg-input/50",
        ),
      },
    },
    content: initialContent,
    onUpdate: ({ editor: currentEditor }) => {
      emitPhrases(currentEditor.state.doc);
    },
    onCreate: ({ editor: currentEditor }) => {
      emitPhrases(currentEditor.state.doc);
    },
  });

  // 読み上げ中は編集を禁止し、フレーズ位置を固定する
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // 現在のフレーズ位置にハイライトの Decoration を反映する
  useEffect(() => {
    if (!editor) {
      return;
    }
    // currentPhraseIndex が null の場合はハイライトを消す (DecorationSet.empty)
    if (currentPhraseIndex === null) {
      editor.view.dispatch(editor.view.state.tr.setMeta(highlightPluginKey, null));
      return;
    }
    const phrase = phrasesRef.current[currentPhraseIndex];
    editor.view.dispatch(
      editor.view.state.tr.setMeta(highlightPluginKey, { from: phrase.from, to: phrase.to }),
    );
  }, [editor, currentPhraseIndex]);

  return <EditorContent editor={editor} />;
};

export default Tiptap;
