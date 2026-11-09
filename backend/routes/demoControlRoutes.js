const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const TrafficCamera = require("../models/TrafficCamera");
const {
  verifyToken,
  requireAdmin,
  requireCameraAccess,
} = require("../middleware/authMiddleware");

const router = express.Router();

const SESSION_LIMIT_MINUTES = 40;
const EDGE_HEARTBEAT_STALE_MS = 20_000;
const STREAM_TICKET_MINUTES = 45;
const FRAME_MAX_BYTES = 1_500_000;

// This state intentionally lives only in this Node process. The Edge Agent
// polls the desired state after every reconnect, so a Render restart safely
// returns the system to STOPPED rather than unexpectedly starting cameras.
const session = {
  active: false,
  startedAt: null,
  expiresAt: null,
  edgeLastSeenAt: null,
  runnerRunning: false,
  edgeError: "",
  frameSequence: 0,
  demoLabelUntil: 0,
  frames: new Map(),
  activeCameraIds: [],
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireEdge(req, res, next) {
  const expected = process.env.INTERNAL_AI_KEY;
  const supplied = req.headers["x-internal-ai-key"];

  if (!expected || !safeEqual(expected, supplied)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized Edge Agent request",
    });
  }

  return next();
}

function expireSessionIfNeeded() {
  if (
    session.active &&
    session.expiresAt &&
    Date.now() >= new Date(session.expiresAt).getTime()
  ) {
    session.active = false;
    session.runnerRunning = false;
    session.demoLabelUntil = Date.now() + 10_000;
    session.edgeError = "Demo session reached its 40-minute limit.";
    session.frames.clear();
    session.activeCameraIds = [];
  }
}

function cameraAccessFilter(user) {
  if (user.role === "admin") return { status: "active", aiEnabled: true };

  if (user.role === "government" && user.verificationStatus === "approved") {
    if (user.governmentOfficerType === "main_officer") {
      return {
        status: "active",
        aiEnabled: true,
        district: user.jurisdictionDistrict,
      };
    }

    if (user.governmentOfficerType === "sub_officer") {
      return {
        status: "active",
        aiEnabled: true,
        district: user.jurisdictionDistrict,
        area: user.jurisdictionArea,
      };
    }
  }

  return null;
}

function edgeIsConnected() {
  return Boolean(
    session.edgeLastSeenAt &&
    Date.now() - new Date(session.edgeLastSeenAt).getTime() <= EDGE_HEARTBEAT_STALE_MS
  );
}

function publicStatus() {
  expireSessionIfNeeded();
  return {
    success: true,
    active: session.active,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    edgeConnected: edgeIsConnected(),
    runnerRunning: session.runnerRunning,
    edgeError: session.edgeError,
    cameraCount: session.activeCameraIds.length,
    cameras: session.activeCameraIds,
  };
}

// Admin-only start. The Edge Agent must already be connected and polling.
router.post("/start", verifyToken, requireAdmin, async (req, res) => {
  try {
    expireSessionIfNeeded();

    if (!edgeIsConnected()) {
      return res.status(503).json({
        success: false,
        message:
          "TrafficMind Edge Agent is offline. Start the Edge Agent on your laptop, then try again.",
      });
    }

    const cameras = await TrafficCamera.find({
      status: "active",
      aiEnabled: true,
    })
      .select("cameraId")
      .lean();

    if (!cameras.length) {
      return res.status(400).json({
        success: false,
        message: "No active AI-enabled cameras are registered.",
      });
    }

    const now = Date.now();
    session.active = true;
    session.startedAt = new Date(now).toISOString();
    session.expiresAt = new Date(
      now + SESSION_LIMIT_MINUTES * 60_000
    ).toISOString();
    session.runnerRunning = false;
    session.demoLabelUntil = 0;
    session.edgeError = "";
    session.frames.clear();
    session.activeCameraIds = cameras.map((camera) => camera.cameraId);

    return res.status(202).json({
      ...publicStatus(),
      message: "Demo start command queued for the Edge Agent.",
      durationMinutes: SESSION_LIMIT_MINUTES,
    });
  } catch (error) {
    console.error("Demo start error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not start the demo session.",
    });
  }
});

router.post("/stop", verifyToken, requireAdmin, (req, res) => {
  session.active = false;
  session.runnerRunning = false;
  session.demoLabelUntil = Date.now() + 10_000;
  session.expiresAt = null;
  session.frames.clear();
  session.activeCameraIds = [];
  session.edgeError = "Demo session stopped by an administrator.";

  return res.json({
    ...publicStatus(),
    message: "Stop command sent to the Edge Agent.",
  });
});

router.get("/status", verifyToken, requireCameraAccess, async (req, res) => {
  try {
    const status = publicStatus();

    // Do not reveal camera IDs from other districts/areas to officers.
    if (req.user.role !== "admin") {
      const filter = cameraAccessFilter(req.user);
      if (!filter) {
        return res.status(403).json({
          success: false,
          message: "You do not have camera monitoring access.",
        });
      }

      const authorized = await TrafficCamera.find(filter)
        .select("cameraId")
        .lean();
      const authorizedIds = new Set(authorized.map((camera) => camera.cameraId));
      status.cameras = status.cameras.filter((cameraId) => authorizedIds.has(cameraId));
      status.cameraCount = status.cameras.length;
    }

    return res.json(status);
  } catch (error) {
    console.error("Demo status error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not read demo monitoring status.",
    });
  }
});

// Short-lived, camera-scoped ticket for the browser's native <img> MJPEG URL.
// The ticket contains camera IDs only; it never contains RTSP URLs or passwords.
router.get(
  "/stream-ticket",
  verifyToken,
  requireCameraAccess,
  async (req, res) => {
    try {
      const filter = cameraAccessFilter(req.user);
      if (!filter) {
        return res.status(403).json({
          success: false,
          message: "You do not have camera streaming access.",
        });
      }

      const cameras = await TrafficCamera.find(filter)
        .select("cameraId")
        .lean();

      const cameraIds = cameras.map((camera) => camera.cameraId);
      const ticket = jwt.sign(
        {
          purpose: "trafficmind-camera-stream",
          userId: String(req.user.userId || req.user._id || ""),
          cameraIds,
        },
        process.env.JWT_SECRET,
        { expiresIn: `${STREAM_TICKET_MINUTES}m`, algorithm: "HS256" }
      );

      return res.json({
        success: true,
        ticket,
        expiresInSeconds: STREAM_TICKET_MINUTES * 60,
        cameraIds,
      });
    } catch (error) {
      console.error("Stream ticket error:", error);
      return res.status(500).json({
        success: false,
        message: "Could not authorize camera streams.",
      });
    }
  }
);

// The Edge Agent is the only caller allowed to retrieve control commands.
router.get("/edge/command", requireEdge, async (req, res) => {
  try {
    expireSessionIfNeeded();

    let cameras = [];
    if (session.active) {
      cameras = await TrafficCamera.find({
        status: "active",
        aiEnabled: true,
      })
        .select("cameraId")
        .lean();
      session.activeCameraIds = cameras.map((camera) => camera.cameraId);
    }

    return res.json({
      desiredState: session.active ? "RUN" : "STOP",
      expiresAt: session.expiresAt,
      cameras: cameras.map((camera) => camera.cameraId),
    });
  } catch (error) {
    console.error("Edge command error:", error);
    return res.status(500).json({ desiredState: "STOP", cameras: [] });
  }
});

router.post("/edge/heartbeat", requireEdge, (req, res) => {
  session.edgeLastSeenAt = new Date().toISOString();
  session.runnerRunning = Boolean(req.body?.runnerRunning);
  session.edgeError =
    typeof req.body?.error === "string" ? req.body.error.slice(0, 300) : "";

  return res.json({ success: true, ...publicStatus() });
});

router.post(
  "/edge/frame/:cameraId",
  requireEdge,
  express.raw({ type: "image/jpeg", limit: FRAME_MAX_BYTES }),
  (req, res) => {
    expireSessionIfNeeded();

    const cameraId = String(req.params.cameraId || "").trim();
    const frame = req.body;

    if (!session.active) {
      return res.status(409).json({ success: false, message: "Demo session is not active." });
    }

    if (!session.activeCameraIds.includes(cameraId)) {
      return res.status(403).json({ success: false, message: "Camera is not part of this session." });
    }

    if (
      !Buffer.isBuffer(frame) ||
      frame.length < 4 ||
      frame.length > FRAME_MAX_BYTES ||
      frame[0] !== 0xff ||
      frame[1] !== 0xd8
    ) {
      return res.status(400).json({ success: false, message: "A valid JPEG frame is required." });
    }

    session.frameSequence += 1;
    session.frames.set(cameraId, {
      sequence: session.frameSequence,
      jpeg: frame,
      receivedAt: Date.now(),
    });

    return res.status(202).json({ success: true });
  }
);

// Native browser MJPEG endpoint. A signed ticket is used because an <img>
// request cannot attach the application's Bearer Authorization header.
router.get("/stream/:cameraId", async (req, res) => {
  const cameraId = String(req.params.cameraId || "").trim();
  const ticket = req.query.ticket;

  try {
    const decoded = jwt.verify(ticket, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      decoded.purpose !== "trafficmind-camera-stream" ||
      !Array.isArray(decoded.cameraIds) ||
      !decoded.cameraIds.includes(cameraId)
    ) {
      return res.status(403).end("Camera stream access denied");
    }
  } catch (_error) {
    return res.status(401).end("Invalid or expired stream ticket");
  }

  res.status(200);
  res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.flushHeaders?.();

  let lastSequence = 0;
  const streamStartedAt = Date.now();
  const clientDeadline = Date.now() + STREAM_TICKET_MINUTES * 60_000;

  try {
    while (!res.destroyed && !res.writableEnded && Date.now() < clientDeadline) {
      expireSessionIfNeeded();

      if (!session.active) break;

      const record = session.frames.get(cameraId);
      if (record && record.sequence !== lastSequence) {
        lastSequence = record.sequence;
        const header = Buffer.from(
          `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${record.jpeg.length}\r\n\r\n`
        );
        res.write(header);
        res.write(record.jpeg);
        res.write(Buffer.from("\r\n"));
      } else if (
        (record && Date.now() - record.receivedAt > 10_000) ||
        (!record && Date.now() - streamStartedAt > 120_000)
      ) {
        // No first frame or no new frame: do not let a blank/stale stream
        // hang forever or appear to be live.
        break;
      }

      await delay(80);
    }
  } catch (_error) {
    // Browser disconnects are expected when a camera tile is unmounted.
  } finally {
    if (!res.destroyed && !res.writableEnded) res.end();
  }
});

router.isDemoSessionActive = () => {
  expireSessionIfNeeded();
  // Allow a short grace period for in-flight AI updates that were queued
  // just before the Edge Agent received the stop command.
  return session.active || Date.now() < session.demoLabelUntil;
};

module.exports = router;
