import { useEffect, useRef, useState, type ChangeEvent } from "react";

const DEVICE_ID_STORAGE_KEY = "2kot-capture-device-id";

function loadDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveDeviceId(deviceId: string): void {
  try {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch {
    // localStorage may be unavailable (private browsing, quota) - choice just won't persist.
  }
}

export interface ElgatoCaptureFeedProps {
  onFrameReady?: (videoElement: HTMLVideoElement) => void;
}

export function ElgatoCaptureFeed({ onFrameReady }: ElgatoCaptureFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(loadDeviceId);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshDevices() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "videoinput"));
    } catch {
      // enumerateDevices can fail before any permission has ever been granted; ignore.
    }
  }

  useEffect(() => {
    refreshDevices();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function connect(preferredDeviceId: string | null) {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Notify parent when video is ready for frame capture
        videoRef.current.onloadedmetadata = () => {
          if (onFrameReady && videoRef.current) {
            onFrameReady(videoRef.current);
          }
        };
      }
      setConnected(true);
      await refreshDevices(); // device labels only populate once permission has been granted

      const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId ?? null;
      if (activeId) {
        setDeviceId(activeId);
        saveDeviceId(activeId);
      }
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : "Could not open capture device.");
    }
  }

  function handleDeviceChange(e: ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setDeviceId(id);
    saveDeviceId(id);
    connect(id);
  }

  function popOut() {
    videoRef.current?.requestPictureInPicture().catch((err) => {
      setError(err instanceof Error ? err.message : "Picture-in-Picture isn't available.");
    });
  }

  return (
    <div className="elgato-capture-feed">
      <video
        ref={videoRef}
        className="elgato-capture-video"
        autoPlay
        playsInline
        muted
      />

      {!connected && (
        <div className="elgato-capture-placeholder">
          <button className="elgato-capture-connect" onClick={() => connect(deviceId)}>
            Connect Elgato Capture Feed
          </button>
          {error && <p className="elgato-capture-error">{error}</p>}
        </div>
      )}

      <div className="elgato-capture-controls">
        <select
          className="elgato-capture-device-select"
          value={deviceId ?? ""}
          onChange={handleDeviceChange}
          title="Capture device"
        >
          <option value="" disabled>
            {devices.length ? "Select capture device" : "No devices found"}
          </option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || "Capture device"}
            </option>
          ))}
        </select>
        <button
          className="elgato-capture-popout"
          onClick={popOut}
          disabled={!connected}
          title="Pop out (Picture-in-Picture)"
        >
          PiP
        </button>
      </div>
    </div>
  );
}
