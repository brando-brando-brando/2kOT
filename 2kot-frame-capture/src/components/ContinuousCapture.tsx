import { useRef, useState, useCallback, useEffect } from "react";

export interface CapturedFrame {
  id: string;
  timestamp: Date;
  relativeTimeMs: number; // Time since recording started
  label: string;
  dataUrl: string;
  selected: boolean;
}

export interface ContinuousCaptureProps {
  videoElement: HTMLVideoElement | null;
  onRecordingComplete: (frames: CapturedFrame[]) => void;
}

export function ContinuousCapture({ videoElement, onRecordingComplete }: ContinuousCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sampleRate, setSampleRate] = useState(2); // fps
  // "samples" keeps frames for tagging; "live" sends them to the tracker instead.
  const [mode, setMode] = useState<"samples" | "live">("samples");
  const [liveStatus, setLiveStatus] = useState("");
  const [frameCount, setFrameCount] = useState(0);
  const modeRef = useRef<"samples" | "live">("samples");
  const sendingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<CapturedFrame[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const sampleRateRef = useRef(2);

  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    sampleRateRef.current = sampleRate;
  }, [sampleRate]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const sendToTracker = useCallback((canvas: HTMLCanvasElement, capturedAt: Date) => {
    // The tracker reads one frame at a time; skip frames while it is busy
    // rather than letting a backlog build up.
    if (sendingRef.current) return;
    sendingRef.current = true;
    canvas.toBlob(
      async (blob) => {
        try {
          if (!blob) return;
          const body = new FormData();
          body.append("file", blob, "frame.jpg");
          body.append("captured_at", capturedAt.toISOString());
          const response = await fetch("/api/frames/analyze", { method: "POST", body });
          if (!response.ok) throw new Error(`Tracker answered ${response.status}`);
          const result = await response.json();
          setLiveStatus(
            result.game
              ? `Game recorded: ${result.game.your_score} - ${result.game.opponent_score}`
              : `Screen: ${result.kind} · session: ${result.session.phase}`
          );
        } catch {
          setLiveStatus("Tracker not reachable. Is 2kot-server running?");
        } finally {
          sendingRef.current = false;
        }
      },
      "image/jpeg",
      0.9
    );
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoElement || !canvasRef.current || !recordingStartTimeRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    setFrameCount((count) => count + 1);
    if (modeRef.current === "live") {
      sendToTracker(canvas, new Date(now));
      return;
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85); // JPEG for smaller size
    const relativeTimeMs = now - recordingStartTimeRef.current!;

    const frame: CapturedFrame = {
      id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(now),
      relativeTimeMs,
      label: "",
      dataUrl,
      selected: true, // All frames selected by default
    };

    framesRef.current.push(frame);
  }, [videoElement, sendToTracker]);

  const processFrame = useCallback(() => {
    if (!isRecordingRef.current) return;

    const now = Date.now();
    const intervalMs = 1000 / sampleRateRef.current;

    if (now - lastCaptureTimeRef.current >= intervalMs) {
      captureFrame();
      lastCaptureTimeRef.current = now;
    }

    setElapsedTime(now - (recordingStartTimeRef.current || now));
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [captureFrame]);

  const startRecording = () => {
    if (!videoElement) return;

    framesRef.current = [];
    recordingStartTimeRef.current = Date.now();
    lastCaptureTimeRef.current = Date.now();
    setIsRecording(true);
    isRecordingRef.current = true;
    setElapsedTime(0);
    setFrameCount(0);
    setLiveStatus("");

    // Capture first frame immediately
    captureFrame();

    // Start continuous capture loop
    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const frames = [...framesRef.current];
    framesRef.current = [];
    recordingStartTimeRef.current = null;

    // Live tracking keeps no frames, so there is nothing to tag afterwards.
    if (modeRef.current === "samples") {
      onRecordingComplete(frames);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Format elapsed time as MM:SS.ms
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="continuous-capture">
      <canvas ref={canvasRef} className="hidden" />

      <div className="continuous-capture-controls">
        <div className="continuous-capture-settings">
          <label className="continuous-capture-label">
            Sample Rate:
            <select
              className="continuous-capture-select"
              value={sampleRate}
              onChange={(e) => setSampleRate(Number(e.target.value))}
              disabled={isRecording}
            >
              <option value={1}>1 fps (game state)</option>
              <option value={2}>2 fps (recommended)</option>
              <option value={3}>3 fps</option>
              <option value={5}>5 fps (detailed)</option>
            </select>
          </label>
        </div>

        <div className="continuous-capture-settings">
          <label className="continuous-capture-label">
            Mode:
            <select
              className="continuous-capture-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as "samples" | "live")}
              disabled={isRecording}
            >
              <option value="samples">Collect samples (tag and export)</option>
              <option value="live">Live tracking (send to dashboard)</option>
            </select>
          </label>
        </div>

        <div className="continuous-capture-buttons">
          {!isRecording ? (
            <button
              className="continuous-capture-start"
              onClick={startRecording}
              disabled={!videoElement}
            >
              {mode === "live" ? "Start Tracking" : "Start Recording"}
            </button>
          ) : (
            <button
              className="continuous-capture-stop"
              onClick={stopRecording}
            >
              {mode === "live" ? "Stop Tracking" : "Stop Recording"}
            </button>
          )}
        </div>

        {isRecording && (
          <div className="continuous-capture-status">
            <span className="continuous-capture-time">
              {formatTime(elapsedTime)}
            </span>
            <span className="continuous-capture-frames">
              {frameCount} frames {mode === "live" ? "seen" : "captured"}
            </span>
            {mode === "live" && liveStatus && (
              <span className="continuous-capture-frames">{liveStatus}</span>
            )}
          </div>
        )}
      </div>

      <div className="continuous-capture-info">
        {videoElement && (
          <p>
            Capture size: {videoElement.videoWidth} x {videoElement.videoHeight}
            {videoElement.videoHeight < 720 && " (low: text may not read reliably)"}
          </p>
        )}
        {mode === "live" ? (
          <p>Frames go straight to the tracker and are not kept here. Needs 2kot-server running.</p>
        ) : (
          <>
            <p>ℹ️ Recording at {sampleRate} fps. Captures game state changes for OCR training.</p>
            <p>After stopping, you'll tag and select frames to export.</p>
          </>
        )}
      </div>
    </div>
  );
}
