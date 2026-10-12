import { useState, useMemo } from "react";
import { type CapturedFrame } from "./ContinuousCapture";
import { format } from "date-fns";

export interface FrameTaggerProps {
  frames: CapturedFrame[];
  onFramesUpdated: (frames: CapturedFrame[]) => void;
  onExport: (frames: CapturedFrame[]) => void;
  onCancel: () => void;
}

export function FrameTagger({ frames, onFramesUpdated, onExport, onCancel }: FrameTaggerProps) {
  const [selectedLabel, setSelectedLabel] = useState("");
  const [startRange, setStartRange] = useState("");
  const [endRange, setEndRange] = useState("");
  const [expandedFrameId, setExpandedFrameId] = useState<string | null>(null);

  const selectedCount = frames.filter(f => f.selected).length;
  const labeledCount = frames.filter(f => f.label).length;

  const handleToggleFrame = (id: string) => {
    const updated = frames.map(f =>
      f.id === id ? { ...f, selected: !f.selected } : f
    );
    onFramesUpdated(updated);
  };

  const handleToggleAll = () => {
    const allSelected = frames.every(f => f.selected);
    const updated = frames.map(f => ({ ...f, selected: !allSelected }));
    onFramesUpdated(updated);
  };

  const handleLabelFrame = (id: string, label: string) => {
    const updated = frames.map(f =>
      f.id === id ? { ...f, label } : f
    );
    onFramesUpdated(updated);
  };

  const handleBulkLabel = () => {
    if (!selectedLabel.trim()) return;

    const start = startRange ? parseInt(startRange) : 0;
    const end = endRange ? parseInt(endRange) : frames.length - 1;

    const updated = frames.map((f, index) => {
      if (index >= start && index <= end && f.selected) {
        return { ...f, label: selectedLabel };
      }
      return f;
    });

    onFramesUpdated(updated);
    setSelectedLabel("");
    setStartRange("");
    setEndRange("");
  };

  const handleDeleteUnselected = () => {
    const updated = frames.filter(f => f.selected);
    onFramesUpdated(updated);
  };

  const handleExport = () => {
    const selectedFrames = frames.filter(f => f.selected);
    onExport(selectedFrames);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="frame-tagger">
      <div className="frame-tagger-header">
        <h2>Tag & Select Frames</h2>
        <div className="frame-tagger-stats">
          <span>Total: {frames.length}</span>
          <span>Selected: {selectedCount}</span>
          <span>Labeled: {labeledCount}</span>
        </div>
      </div>

      <div className="frame-tagger-bulk-actions">
        <div className="bulk-label-section">
          <input
            type="text"
            className="bulk-label-input"
            placeholder="Label (e.g., 'Opponent Name')"
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
          />
          <input
            type="number"
            className="bulk-range-input"
            placeholder="Start idx"
            value={startRange}
            onChange={(e) => setStartRange(e.target.value)}
            min="0"
            max={frames.length - 1}
          />
          <span className="bulk-range-separator">-</span>
          <input
            type="number"
            className="bulk-range-input"
            placeholder="End idx"
            value={endRange}
            onChange={(e) => setEndRange(e.target.value)}
            min="0"
            max={frames.length - 1}
          />
          <button
            className="bulk-label-button"
            onClick={handleBulkLabel}
            disabled={!selectedLabel.trim()}
          >
            Apply Label
          </button>
        </div>

        <div className="bulk-select-section">
          <button className="bulk-select-button" onClick={handleToggleAll}>
            Toggle All
          </button>
          <button
            className="bulk-delete-button"
            onClick={handleDeleteUnselected}
            disabled={selectedCount === frames.length}
          >
            Delete Unselected
          </button>
        </div>
      </div>

      <div className="frame-tagger-grid">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            className={`frame-tagger-item ${!frame.selected ? 'frame-tagger-item-unselected' : ''} ${expandedFrameId === frame.id ? 'frame-tagger-item-expanded' : ''}`}
          >
            <div className="frame-tagger-item-header">
              <input
                type="checkbox"
                checked={frame.selected}
                onChange={() => handleToggleFrame(frame.id)}
                className="frame-tagger-checkbox"
              />
              <span className="frame-tagger-index">#{index}</span>
              <span className="frame-tagger-time">{formatTime(frame.relativeTimeMs)}</span>
              <button
                className="frame-tagger-expand"
                onClick={() => setExpandedFrameId(expandedFrameId === frame.id ? null : frame.id)}
              >
                {expandedFrameId === frame.id ? '▼' : '▶'}
              </button>
            </div>

            {expandedFrameId === frame.id && (
              <div className="frame-tagger-item-details">
                <img
                  src={frame.dataUrl}
                  alt={`Frame ${index}`}
                  className="frame-tagger-preview"
                />
                <input
                  type="text"
                  className="frame-tagger-label-input"
                  placeholder="Add label..."
                  value={frame.label}
                  onChange={(e) => handleLabelFrame(frame.id, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="frame-tagger-footer">
        <button className="frame-tagger-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="frame-tagger-export"
          onClick={handleExport}
          disabled={selectedCount === 0}
        >
          Export Selected ({selectedCount})
        </button>
      </div>
    </div>
  );
}
