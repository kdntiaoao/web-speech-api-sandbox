import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Markdown の貼り付けをサポートする Extension
 * @see https://github.com/ueberdosis/tiptap/issues/1649#issuecomment-2731296289
 */
export const MarkdownPaste = Extension.create({
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

/** PlaybackHighlight Extension の PluginKey */
export const highlightPluginKey = new PluginKey("playbackHighlight");

/**
 * 読み上げ中フレーズの背景ハイライトを描く Extension \
 * `setMeta(highlightPluginKey, { from, to } | null)` で対象範囲を更新する
 */
export const PlaybackHighlight = Extension.create({
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
                class: "bg-yellow-400/20",
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
