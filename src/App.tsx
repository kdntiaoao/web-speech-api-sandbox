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
  const [text, setText] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<string>("");
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
    if (value) {
      setVoice(value);
    }
  };

  const handleSpeak = (e: SubmitEvent<HTMLFormElement>) => {
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
    window.speechSynthesis.speak(utterThis);
  };

  useEffect(() => {
    const setupVoices = () => {
      const localVoices = window.speechSynthesis.getVoices().filter((v) => v.lang === "ja-JP");
      setVoices(localVoices);
      const defaultVoice = localVoices.find((v) => v.default);
      if (defaultVoice) {
        setVoice(defaultVoice.name);
      }
    };
    setupVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setupVoices;
    }
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
              <Select value={voice} onValueChange={handleVoiceChange}>
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
