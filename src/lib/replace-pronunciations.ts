import { PRONUNCIATIONS_MAP } from "@/components/tiptap/constants";
import { escapeRegex } from "./escape-regex";

/** テキスト中の PRONUNCIATIONS_MAP にある単語をカタカナに置換する */
export const replacePronunciations = (text: string) => {
  let result = text;

  for (const [word, pronunciation] of Object.entries(PRONUNCIATIONS_MAP)) {
    const escapedWord = escapeRegex(word);
    const regex = new RegExp(escapedWord, "gi");
    result = result.replaceAll(regex, pronunciation);
  }

  return result;
};
