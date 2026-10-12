import { useRef, useState } from "react";

export interface CapturedFrame {
  id: string;
  timestamp: Date;
  relativeTimeMs?: number;
  label: string;
  dataUrl: string;
  selected?: boolean;
}

export interface FrameCaptureProps {
  videoElement: HTMLVideoElement | null;
  onFrameCaptured: (frame: CapturedFrame) => void;
}

export function FrameCapture({ videoElement, onFrameCaptured }: FrameCaptureProps) {
  const [label, setLabel] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function captureFrame() {
    if (!videoElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL("image/png");

    // Create captured frame object
    const frame: CapturedFrame = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      label: label.trim() || "Unnamed Frame",
      dataUrl,
    };

    onFrameCaptured(frame);
    setLabel(""); // Reset label after capture
  }

  return (
    <div className="frame-capture">
      <canvas ref={canvasRef} className="hidden" />
      <div className="frame-capture-controls">
        <input
          type="text"
          className="frame-capture-label"
          placeholder="Frame label (e.g., 'Opponent Name HUD')"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") captureFrame();
          }}
        />
        <button
          className="frame-capture-button"
          onClick={captureFrame}
          disabled={!videoElement}
        >
          Capture Frame
        </button>
      </div>
      <p className="frame-capture-hint">
        Press Enter or click Capture to save the current frame
      </p>
    </div>
  );
}
