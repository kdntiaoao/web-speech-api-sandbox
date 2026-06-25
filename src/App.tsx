import { useEffect, useState, type SubmitEvent } from "react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "./components/ui/field";
import { Input } from "./components/ui/input";
import { Slider } from "./components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button";

function App() {
  const [text, setText] = useState(
    "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。",
    // "こんにちは",
  );
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
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

  const handleSpeak = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      return;
    }

    const utterThis = new SpeechSynthesisUtterance(text);
    for (const v of voices) {
      if (v.name === voice) {
        utterThis.voice = v;
      }
    }
    utterThis.pitch = pitch;
    utterThis.rate = rate;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterThis);

    utterThis.onpause = (event) => {
      const char = event.utterance.text.charAt(event.charIndex);
      console.log(
        `Speech paused at character ${event.charIndex} of "${event.utterance.text}", which is "${char}".`,
      );
    };
  };

  const pause = () => {
    if (!window.speechSynthesis.speaking) {
      return;
    }
    setIsPaused(true);
    window.speechSynthesis.pause();
  };

  const resume = () => {
    if (!window.speechSynthesis.paused) {
      return;
    }
    setIsPaused(false);
    window.speechSynthesis.resume();
  };

  useEffect(() => {
    const setupVoices = () => {
      const localVoices = window.speechSynthesis.getVoices().filter((v) => v.lang === "ja-JP");
      setVoices(localVoices);
      const defaultVoice = localVoices.find((v) => v.default);
      setVoice(defaultVoice?.name ?? localVoices[0]?.name ?? "");
    };
    setupVoices();

    window.speechSynthesis.addEventListener("voiceschanged", setupVoices);

    let animationFrameId: number;
    const getStatus = () => {
      setIsSpeaking(window.speechSynthesis.speaking);
      setIsPaused(window.speechSynthesis.paused);
      animationFrameId = window.requestAnimationFrame(getStatus);
    };
    animationFrameId = window.requestAnimationFrame(getStatus);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", setupVoices);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSpeak}>
          <FieldGroup>
            <div className="flex flex-col gap-1">
              <FieldLegend>Speech synthesizer</FieldLegend>
              <FieldDescription>
                Enter some text in the input below and press return to hear it. change voices using
                the dropdown menu.
              </FieldDescription>
            </div>

            <Input
              id="text"
              type="text"
              placeholder="Enter text"
              value={text}
              onChange={handleTextChange}
              disabled={isSpeaking}
            />

            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="rate">Rate (再生速度)</FieldLabel>
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
                <FieldLabel htmlFor="pitch">Pitch (音程)</FieldLabel>
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

            <Button>Speak</Button>

            <Button type="button" onClick={pause}>
              Pause
            </Button>

            <Button type="button" onClick={resume}>
              Resume
            </Button>

            <p>
              isSpeaking: {isSpeaking ? "true" : "false"} / isPaused: {isPaused ? "true" : "false"}
            </p>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default App;
