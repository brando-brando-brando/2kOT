import { useState } from "react";
import { ElgatoCaptureFeed } from "./components/ElgatoCaptureFeed";
import { ContinuousCapture, type CapturedFrame } from "./components/ContinuousCapture";
import { FrameTagger } from "./components/FrameTagger";
import { FrameGallery } from "./components/FrameGallery";

type ViewState = "capture" | "tagging" | "gallery";

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [viewState, setViewState] = useState<ViewState>("capture");
  const [recordedFrames, setRecordedFrames] = useState<CapturedFrame[]>([]);
  const [exportedFrames, setExportedFrames] = useState<CapturedFrame[]>([]);

  function handleFrameReady(element: HTMLVideoElement) {
    setVideoElement(element);
  }

  function handleRecordingComplete(frames: CapturedFrame[]) {
    setRecordedFrames(frames);
    setViewState("tagging");
  }

  function handleFramesUpdated(frames: CapturedFrame[]) {
    setRecordedFrames(frames);
  }

  function handleExport(frames: CapturedFrame[]) {
    // Export as JSON
    const exportData = frames.map((frame) => ({
      id: frame.id,
      timestamp: frame.timestamp.toISOString(),
      relativeTimeMs: frame.relativeTimeMs,
      label: frame.label,
      dataUrl: frame.dataUrl,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `2kot-frames-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also add to gallery
    setExportedFrames(prev => [...frames, ...prev]);
    setRecordedFrames([]);
    setViewState("gallery");
  }

  function handleCancelTagging() {
    setRecordedFrames([]);
    setViewState("capture");
  }

  function handleDeleteExportedFrame(id: string) {
    setExportedFrames(prev => prev.filter(f => f.id !== id));
  }

  function handleExportAll() {
    const exportData = exportedFrames.map((frame) => ({
      id: frame.id,
      timestamp: frame.timestamp.toISOString(),
      relativeTimeMs: frame.relativeTimeMs,
      label: frame.label,
      dataUrl: frame.dataUrl,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `2kot-all-frames-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>2KOT Frame Capture Tool</h1>
        <p>Capture sample frames from NBA 2K26 for OCR training</p>
      </header>

      <main className="app-main">
        <div className="app-capture-section">
          <div className="capture-feed-container">
            <ElgatoCaptureFeed onFrameReady={handleFrameReady} />
          </div>

          {videoElement && viewState === "capture" && (
            <div className="continuous-capture-container">
              <ContinuousCapture
                videoElement={videoElement}
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
          )}

          {viewState === "tagging" && (
            <div className="frame-tagger-container">
              <FrameTagger
                frames={recordedFrames}
                onFramesUpdated={handleFramesUpdated}
                onExport={handleExport}
                onCancel={handleCancelTagging}
              />
            </div>
          )}
        </div>

        <div className="app-gallery-section">
          <FrameGallery
            frames={exportedFrames}
            onDeleteFrame={handleDeleteExportedFrame}
            onExportFrames={handleExportAll}
          />
        </div>
      </main>

      <footer className="app-footer">
        {viewState === "capture" && (
          <p>Tip: Start recording during NBA 2K26 gameplay. Use 2 fps for game state detection.</p>
        )}
        {viewState === "tagging" && (
          <p>Tip: Bulk label frames by index range (e.g., frames 10-20 show opponent name).</p>
        )}
        {viewState === "gallery" && (
          <p>Tip: Export all frames as JSON for OCR model training.</p>
        )}
      </footer>
    </div>
  );
}

export default App;
