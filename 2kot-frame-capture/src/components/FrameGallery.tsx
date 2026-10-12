import { type CapturedFrame } from "./ContinuousCapture";
import { format } from "date-fns";

export interface FrameGalleryProps {
  frames: CapturedFrame[];
  onDeleteFrame: (id: string) => void;
  onExportFrames: () => void;
}

export function FrameGallery({ frames, onDeleteFrame, onExportFrames }: FrameGalleryProps) {
  return (
    <div className="frame-gallery">
      <div className="frame-gallery-header">
        <h2>Captured Frames ({frames.length})</h2>
        <button
          className="frame-gallery-export"
          onClick={onExportFrames}
          disabled={frames.length === 0}
        >
          Export All
        </button>
      </div>

      {frames.length === 0 ? (
        <p className="frame-gallery-empty">No frames captured yet. Connect your Elgato and start capturing!</p>
      ) : (
        <div className="frame-gallery-grid">
          {frames.map((frame) => (
            <div key={frame.id} className="frame-gallery-item">
              <img
                src={frame.dataUrl}
                alt={frame.label}
                className="frame-gallery-image"
              />
              <div className="frame-gallery-info">
                <div className="frame-gallery-label">{frame.label || "Unnamed"}</div>
                <div className="frame-gallery-timestamp">
                  {format(frame.timestamp, "MMM d, yyyy HH:mm:ss")}
                </div>
                <button
                  className="frame-gallery-delete"
                  onClick={() => onDeleteFrame(frame.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
