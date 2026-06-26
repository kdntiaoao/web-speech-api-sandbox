import { cn } from "@/lib/utils";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import type { FC } from "react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ListKit, TaskItem, TaskList } from "@tiptap/extension-list";

type Props = {
  onChange: (content: string) => void;
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

const Tiptap: FC<Props> = ({ onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      MarkdownPaste,
      TaskList,
      TaskItem.configure({
        HTMLAttributes: {
          class: cn("flex items-start gap-2", "[&>div]:flex-1 [&>div>p]:m-0"),
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "prose p-5 [&_li>p]:m-0 border border-input max-w-none rounded-lg",
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
      onChange(currentEditor.getMarkdown());
    },
    onCreate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getMarkdown());
    },
  });

  return <EditorContent editor={editor} />;
};

export default Tiptap;
