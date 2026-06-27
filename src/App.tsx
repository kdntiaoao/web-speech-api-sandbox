import { useEffect, useState, type SubmitEvent } from "react";
import { Field, FieldGroup, FieldLabel } from "./components/ui/field";
import { Slider } from "./components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Pause, Play, RotateCw } from "lucide-react";
import Tiptap, { type Phrase } from "./components/Tiptap";

function App() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number | null>(null);

  const targetVoice = voices.find((v) => v.name === voice);

  const handlePhrasesChange = (nextPhrases: Phrase[]) => {
    setPhrases(nextPhrases);
  };

  const handleRateChange = (values: number[]) => {
    setRate(values[0]);
  };

  const handlePitchChange = (values: number[]) => {
    setPitch(values[0]);
  };

  const handleVoiceChange = (value: string) => {
    if (value) {
      setVoice(value);
    }
  };

  const resume = () => {
    if (!window.speechSynthesis.paused) {
      return;
    }
    window.speechSynthesis.resume();
  };

  const pause = () => {
    if (!window.speechSynthesis.speaking) {
      return;
    }
    window.speechSynthesis.pause();
  };

  const speak = (phraseIndex: number) => {
    const phrase = phrases[phraseIndex];
    console.log("phrase:", phrase);

    const utterThis = new SpeechSynthesisUtterance(phrase.text);
    utterThis.voice = targetVoice ?? null;
    utterThis.pitch = pitch;
    utterThis.rate = rate;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterThis);

    utterThis.onpause = (event) => {
      setIsPaused(true);
      const char = event.utterance.text.charAt(event.charIndex);
      console.log(
        `Speech paused at character ${event.charIndex} of "${event.utterance.text}", which is "${char}".`,
      );
    };

    utterThis.onresume = (event) => {
      setIsPaused(false);
      const char = event.utterance.text.charAt(event.charIndex);
      console.log(
        `Speech resumed at character ${event.charIndex} of "${event.utterance.text}", which is "${char}".`,
      );
    };

    utterThis.onend = () => {
      if (phraseIndex < phrases.length - 1) {
        setCurrentPhraseIndex(phraseIndex + 1);
        speak(phraseIndex + 1);
      } else {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentPhraseIndex(null);
      }
    };
  };

  const playOrPause = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (phrases.length === 0) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.paused ? resume() : pause();
      return;
    }

    setCurrentPhraseIndex(0);
    speak(0);
  };

  const cancel = () => {
    if (!window.speechSynthesis.speaking) {
      return;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentPhraseIndex(null);
    window.speechSynthesis.cancel();
  };

  useEffect(() => {
    const populateVoices = () => {
      const localVoices = window.speechSynthesis.getVoices().filter((v) => v.lang === "ja-JP");
      setVoices(localVoices);
      const defaultVoice = localVoices.find((v) => v.default);
      setVoice(defaultVoice?.name ?? localVoices[0]?.name ?? "");
    };
    populateVoices();

    window.speechSynthesis.addEventListener("voiceschanged", populateVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", populateVoices);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col pt-5 xl:pt-8">
      <div className="px-3 xl:px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-1">
          <h1 className="text-xl font-bold xl:text-2xl">テキスト読み上げツール</h1>
          <p>
            テキストを入力して、再生速度や音程、声の種類を選択して読み上げることができます。
            <br />
            マークダウン形式で入力することも可能です。
          </p>
        </div>
      </div>

      <form className="flex flex-1 flex-col" onSubmit={playOrPause}>
        <div className="px-3 pt-6 xl:px-5 xl:pt-8">
          <div className="mx-auto max-w-5xl">
            <Tiptap
              onChange={handlePhrasesChange}
              currentPhraseIndex={currentPhraseIndex}
              editable={!isSpeaking}
            />
          </div>
        </div>

        <div className="sticky right-0 bottom-0 left-0 mt-auto bg-white px-3 py-6 xl:px-5 xl:py-8">
          <div
            data-hidden={isSpeaking ? true : undefined}
            className="mx-auto grid max-w-2xl grid-rows-[1fr] transition-[grid-template-rows] duration-500 data-hidden:grid-rows-[0fr]"
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-5 pb-6 xl:pb-7">
                <Field>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor="rate">再生速度</FieldLabel>
                    <span className="text-sm text-muted-foreground">{rate}</span>
                  </div>
                  <Slider
                    id="rate"
                    value={[rate]}
                    onValueChange={handleRateChange}
                    min={0.1}
                    max={10}
                    step={0.1}
                    disabled={isSpeaking}
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor="pitch">音程</FieldLabel>
                    <span className="text-sm text-muted-foreground">{pitch}</span>
                  </div>
                  <Slider
                    id="pitch"
                    value={[pitch]}
                    onValueChange={handlePitchChange}
                    min={0}
                    max={2}
                    step={0.1}
                    disabled={isSpeaking}
                  />
                </Field>

                <Field>
                  <FieldLabel>Voice</FieldLabel>
                  <Select value={voice} onValueChange={handleVoiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {voices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="submit"
              data-state={isSpeaking && !isPaused ? "speaking" : undefined}
              className="group relative flex h-10 items-center justify-center overflow-hidden rounded-sm bg-primary text-xl font-medium text-primary-foreground transition active:scale-90"
            >
              <div className="flex min-w-40 translate-x-0 items-center justify-center gap-3 pr-10 pl-7 transition group-data-[state=speaking]:translate-x-[-120%]">
                <Play className="size-5" />
                Play
              </div>
              <div className="absolute flex w-full translate-x-[120%] items-center justify-center gap-3 pr-7 pl-6 transition group-data-[state=speaking]:translate-x-0">
                <Pause className="size-5" />
                Pause
              </div>
            </button>
            <button
              type="button"
              className="group relative flex h-10 items-center justify-center overflow-hidden rounded-sm border border-primary bg-white text-xl font-medium transition active:scale-90"
              onClick={cancel}
            >
              <div className="flex min-w-40 translate-x-0 items-center justify-center gap-3 pr-6 pl-7 transition">
                Reset
                <RotateCw className="size-5 transition group-active:rotate-45" />
              </div>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default App;
