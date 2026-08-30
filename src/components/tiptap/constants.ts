/** Tiptap の初期コンテンツ */
export const INITIAL_CONTENT = `
<h2>
こんにちは！
</h2>
<p>
これは <strong>Tiptap</strong> の<em>基本構造</em>を示したサンプルです。もちろん、**テキストエディタ**に期待されるような、Markdown に対応しています。ですが、こちらのリスト機能もぜひご覧ください：
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
`;

/** 英単語と読み方の対応表 */
export const PRONUNCIATIONS_MAP = {
  markdown: "マークダウン",
  chatgpt: "チャットジーピーティー",
  openai: "オープンエーアイ",
  vite: "ヴィート",
  aws: "エーダブリュエス",
  cli: "シーエルアイ",
  ec2: "イーシーツー",
  iam: "アイエーエム",
  npm: "エヌピーエム",
  sql: "エスキューエル",
  ssh: "エスエスエイチ",
  vpc: "ブイピーシー",
  ai: "エーアイ",
  ci: "シーアイ",
  s3: "エススリー",
} as const satisfies Record<string, string>;
