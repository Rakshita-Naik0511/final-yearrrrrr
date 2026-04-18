import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  value: string;
}

// Browser SpeechRecognition fallback typing
const SR: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const MicRecorder = ({ onTranscript, disabled, value }: MicRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef<string>("");
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (!SR) setSupported(false);
  }, []);

  useEffect(() => {
    finalRef.current = value;
  }, [value]);

  const start = () => {
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalTranscript += r[0].transcript + " ";
        } else {
          interim += r[0].transcript;
        }
      }

      finalRef.current = finalTranscript.trim();
      onTranscript((finalRef.current + " " + interim).trim());
    };

    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed") {
        setSupported(false);
      }
      setRecording(false);
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        rec.start();
      } else {
        setRecording(false);
      }
    };

    recognitionRef.current = rec;
    isListeningRef.current = true;
    rec.start();
    setRecording(true);
  };

  const stop = () => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setRecording(false);
  };

  if (!supported) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Speech recognition not supported in this browser. Please type your answer.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!recording ? (
        <Button type="button" variant="hero" size="sm" onClick={start} disabled={disabled}>
          <Mic className="h-4 w-4" /> Start Speaking
        </Button>
      ) : (
        <Button type="button" variant="destructive" size="sm" onClick={stop}>
          <Square className="h-4 w-4" /> Stop
        </Button>
      )}
      {recording && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening...
        </span>
      )}
      {!recording && value && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MicOff className="h-3 w-3" /> Recorded
        </span>
      )}
    </div>
  );
};

export default MicRecorder;
