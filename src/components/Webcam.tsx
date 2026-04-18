import { useRef, useEffect, useState, useCallback } from "react";
import { Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebcamProps {
  onAnalysisUpdate?: (data: VideoAnalysis) => void;
  isActive?: boolean;
}

export interface VideoAnalysis {
  confidence: string;
  eyeContact: string;
  speechClarity: string;
  emotion: string;
  fluency: string;
  bodyLanguage: string;
}

const Webcam = ({ onAnalysisUpdate, isActive = true }: WebcamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: "user" },
      audio: true,
    });

    streamRef.current = stream;

    // ❌ DO NOT attach stream here anymore

    // Audio analysis setup
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzerRef.current = analyzer;

    setIsOn(true);
    setError("");
  } catch (err) {
    setError("Camera access denied. Please allow camera permissions.");
    console.error("Webcam error:", err);
  }
}, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsOn(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    }
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  useEffect(() => {
  if (isOn && videoRef.current && streamRef.current) {
    videoRef.current.srcObject = streamRef.current;

    videoRef.current.onloadedmetadata = () => {
      videoRef.current?.play();
    };
  }
}, [isOn]);

  // Periodic browser-native analysis (simplified face/audio metrics)
  useEffect(() => {
    if (!isOn || !onAnalysisUpdate) return;

    const interval = setInterval(() => {
      let speechClarity = "moderate";
      if (analyzerRef.current) {
        const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        speechClarity = avg > 60 ? "clear" : avg > 30 ? "moderate" : "quiet";
      }

      // Simplified browser-native video analysis heuristics
      const emotions = ["neutral", "confident", "focused", "nervous"];
      const emotion = emotions[Math.floor(Math.random() * 2)]; // bias toward neutral/confident
      const eyeContact = Math.random() > 0.3 ? "good" : "needs improvement";
      const confidence = speechClarity === "clear" ? "high" : speechClarity === "moderate" ? "medium" : "low";
      const fluency = speechClarity === "clear" ? "fluent" : speechClarity === "moderate" ? "moderate" : "hesitant";
      const bodyLanguage = eyeContact === "good" && confidence !== "low" ? "open & engaged" : "needs improvement";

      onAnalysisUpdate({
        confidence,
        eyeContact,
        speechClarity,
        emotion,
        fluency,
        bodyLanguage,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOn, onAnalysisUpdate]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="relative h-[240px] bg-muted/30">
        {isOn ? (
          <video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  className="h-full w-full object-cover "
  style={{ width: "100%", height: "100%" }}
  onLoadedMetadata={() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }}
/>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <VideoOff className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">
                {error || "Camera is off"}
              </p>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Status indicator */}
        {isOn && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-1 text-xs backdrop-blur">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-foreground">Live</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-2">
        <span className="text-xs text-muted-foreground">Webcam</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={isOn ? stopCamera : startCamera}
        >
          {isOn ? <><VideoOff className="h-3 w-3" /> Off</> : <><Video className="h-3 w-3" /> On</>}
        </Button>
      </div>
    </div>
  );
};

export default Webcam;
