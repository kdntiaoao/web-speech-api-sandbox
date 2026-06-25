import { useEffect, useState } from "react";
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
  const [text, setText] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<string | undefined>(undefined);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
    setVoice(value);
  };

  const handleSpeak = (e: React.FormEvent) => {
    e.preventDefault();

    if (!text) {
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
    console.log(utterThis);
    console.log(utterThis.pitch);
    window.speechSynthesis.speak(utterThis);

    utterThis.onpause = (event) => {
      const char = event.utterance.text.charAt(event.charIndex);
      console.log(
        `Speech paused at character ${event.charIndex} of "${event.utterance.text}", which is "${char}".`,
      );
    };
  };

  useEffect(() => {
    let retryCount = 0;
    let timerId: number;

    const setupVoices = () => {
      if (voice) {
        return;
      }

      const localVoices = window.speechSynthesis.getVoices().filter((v) => v.lang === "ja-JP");

      // HACK: Chrome だと voices が空の配列で返ってくることがあるので、Retry 処理を入れる
      if (!localVoices.length) {
        if (retryCount < 5) {
          console.log("retry...");
          retryCount++;
          clearTimeout(timerId);
          timerId = window.setTimeout(() => {
            setupVoices();
          }, 1000);
        } else {
          console.log("no voices found");
        }
        return;
      }

      setVoices(localVoices);
    };

    setupVoices();

    return () => {
      clearTimeout(timerId);
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
              />
            </Field>

            <Field>
              <FieldLabel>Voice</FieldLabel>
              <Select onValueChange={handleVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {voices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Button>Speak</Button>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default App;
