import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/api.js";

const SESSION_MINUTES = 40;

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const formatRemaining = (expiresAt, now) => {
  if (!expiresAt) return "40:00";
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function DemoModePanel({ cameras = [], onSessionChange }) {
  const role = (localStorage.getItem("role") || "citizen").toLowerCase();
  const isAdmin = role === "admin";
  const enabledCameras = cameras.filter(
    (camera) => camera && camera.aiEnabled !== false && camera.id
  );

  const [status, setStatus] = useState({
    active: false,
    edgeConnected: false,
    runnerRunning: false,
    expiresAt: null,
    cameraCount: 0,
    cameras: [],
    edgeError: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const ticketRef = useRef("");
  const callbackRef = useRef(onSessionChange);

  useEffect(() => {
    callbackRef.current = onSessionChange;
  }, [onSessionChange]);

  const clearTicket = () => {
    ticketRef.current = "";
  };

  const loadStreamTicket = async () => {
    const response = await axios.get(
      `${API_BASE}/api/demo-control/stream-ticket`,
      authConfig()
    );
    const nextTicket = response.data?.ticket || "";
    if (!nextTicket) throw new Error("The server did not return a camera stream ticket.");
    ticketRef.current = nextTicket;
    return nextTicket;
  };

  const refreshStatus = async (mounted = () => true) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/demo-control/status`,
        authConfig()
      );
      if (!mounted()) return;

      const nextStatus = response.data || {};
      setStatus(nextStatus);
      setError("");

      if (nextStatus.active && !ticketRef.current) {
        try {
          await loadStreamTicket();
        } catch (ticketError) {
          if (mounted()) {
            setError(
              ticketError.response?.data?.message ||
                ticketError.message ||
                "Could not authorize the live camera stream."
            );
          }
        }
      }

      if (!nextStatus.active) clearTicket();
      callbackRef.current?.(Boolean(nextStatus.active), ticketRef.current);
    } catch (statusError) {
      if (!mounted()) return;
      setStatus((current) => ({
        ...current,
        edgeConnected: false,
      }));
      setError(
        statusError.response?.data?.message ||
          "Could not read demo status from the backend."
      );
      callbackRef.current?.(false, "");
    }
  };

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    refreshStatus(isMounted);
    const statusTimer = setInterval(() => refreshStatus(isMounted), 3000);
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      mounted = false;
      clearInterval(statusTimer);
      clearInterval(clockTimer);
    };
    // The polling lifecycle is intentionally mounted once per panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivate = async () => {
    if (!isAdmin || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE}/api/demo-control/start`,
        { durationMinutes: SESSION_MINUTES },
        authConfig()
      );
      setStatus(response.data || {});
      clearTicket();
      await loadStreamTicket();
      await refreshStatus();
    } catch (startError) {
      setError(
        startError.response?.data?.message ||
          startError.message ||
          "Could not activate camera monitoring."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!isAdmin || busy) return;
    setBusy(true);
    setError("");
    try {
      await axios.post(
        `${API_BASE}/api/demo-control/stop`,
        {},
        authConfig()
      );
      clearTicket();
      await refreshStatus();
    } catch (stopError) {
      setError(
        stopError.response?.data?.message ||
          stopError.message ||
          "Could not stop camera monitoring."
      );
    } finally {
      setBusy(false);
    }
  };

  const active = Boolean(status.active);
  const runnerReady = Boolean(status.runnerRunning);
  const remaining = active ? formatRemaining(status.expiresAt, now) : "40:00";
  // TRAFFICMIND_COMPACT_CONTROL
  // Only controls the Edge Agent session. Camera streams stay in the original
  // AI Vision Center cards and the selected camera's View Analysis panel.
  return (
    <div
      role="group"
      aria-label="AI camera monitoring controls"
      title={error || status.edgeError || "40-minute AI monitoring session"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: "8px",
        padding: "7px 9px",
        borderRadius: "13px",
        border: active ? "1px solid rgba(34,197,94,.45)" : "1px solid var(--border)",
        background: active ? "rgba(34,197,94,.08)" : "rgba(0,0,0,.10)",
        minHeight: "42px",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: active ? "#16A34A" : "var(--text-muted)",
          fontSize: "11px",
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: active ? (runnerReady ? "#16A34A" : "#F59E0B") : "#64748B",
            boxShadow: active && runnerReady ? "0 0 0 4px rgba(34,197,94,.12)" : "none",
          }}
        />
        {active ? (runnerReady ? "MONITORING LIVE" : "STARTING AI") : "MONITORING OFFLINE"}
      </span>

      <span
        aria-label="Session countdown"
        style={{
          color: active ? "#16A34A" : "var(--text-primary)",
          fontSize: "14px",
          fontWeight: 900,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: ".04em",
          whiteSpace: "nowrap",
          padding: "0 4px",
        }}
      >
        {remaining}
      </span>

      <span
        style={{
          color: status.edgeConnected ? "#16A34A" : "#DC2626",
          fontSize: "9px",
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        {status.edgeConnected ? "EDGE CONNECTED" : "EDGE OFFLINE"}
      </span>

      {isAdmin && (
        active ? (
          <button
            type="button"
            onClick={handleStop}
            disabled={busy}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "9px 12px",
              background: "#DC2626",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 900,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "STOPPING..." : "■ STOP"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={busy || !status.edgeConnected || enabledCameras.length === 0}
            title={
              !status.edgeConnected
                ? "Start the TrafficMind Edge Agent on the AI laptop first."
                : enabledCameras.length === 0
                ? "Add at least one active AI-enabled camera."
                : "Start a 40-minute AI monitoring session."
            }
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "9px 13px",
              background: "#16A34A",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 900,
              cursor: busy || !status.edgeConnected || enabledCameras.length === 0 ? "not-allowed" : "pointer",
              opacity: busy || !status.edgeConnected || enabledCameras.length === 0 ? 0.55 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "ACTIVATING..." : "▶ ACTIVATE"}
          </button>
        )
      )}

      {(error || status.edgeError) && (
        <span
          role="alert"
          style={{ color: "#EF4444", fontSize: "10px", maxWidth: "220px" }}
        >
          {error || status.edgeError}
        </span>
      )}
    </div>
  );
}
