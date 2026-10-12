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

  const captureFrame = useCallback(() => {
    if (!videoElement || !canvasRef.current || !recordingStartTimeRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85); // JPEG for smaller size
    const now = Date.now();
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
  }, [videoElement]);

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

    onRecordingComplete(frames);
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

        <div className="continuous-capture-buttons">
          {!isRecording ? (
            <button
              className="continuous-capture-start"
              onClick={startRecording}
              disabled={!videoElement}
            >
              Start Recording
            </button>
          ) : (
            <button
              className="continuous-capture-stop"
              onClick={stopRecording}
            >
              Stop Recording
            </button>
          )}
        </div>

        {isRecording && (
          <div className="continuous-capture-status">
            <span className="continuous-capture-time">
              {formatTime(elapsedTime)}
            </span>
            <span className="continuous-capture-frames">
              {framesRef.current.length} frames captured
            </span>
          </div>
        )}
      </div>

      <div className="continuous-capture-info">
        <p>ℹ️ Recording at {sampleRate} fps. Captures game state changes for OCR training.</p>
        <p>After stopping, you'll tag and select frames to export.</p>
      </div>
    </div>
  );
}
