const EmergencyEvent =
  require("../models/EmergencyEvent");

const CameraConnection =
  require("../models/CameraConnection");

const HANDOFF_MAX_GAP_MS =
  30000;

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

/*
 * =========================================================
 * NEXT CAMERA GRAPH
 * =========================================================
 */

async function getNextCameras(
  currentCameraId
) {
  return CameraConnection.find({
    fromCameraId:
      currentCameraId,
    active: true,
  })
    .sort({
      priority: -1,
      distanceMeters: 1,
    })
    .lean();
}

/*
 * =========================================================
 * PHASE 21
 * DYNAMIC OFFICER INTELLIGENCE SYNC
 * =========================================================
 */

async function syncOfficerIntelligence(
  emergencyId,
  source = "HANDOFF",
  forceNotify = true
) {
  if (!emergencyId) {
    return null;
  }

  const backendRoot =
    process.env.INTERNAL_BACKEND_ROOT ||
    "http://localhost:5000";

  const url =
    `${backendRoot}/api/officer-alerts/internal/sync/${encodeURIComponent(
      emergencyId
    )}`;

  const key =
    process.env.INTERNAL_AI_KEY || "";

  if (!key) {
    console.warn(
      "⚠️ Phase 21 officer sync skipped: INTERNAL_AI_KEY is not configured"
    );

    return null;
  }

  try {
    const response =
      await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-internal-ai-key":
            key,
        },

        body: JSON.stringify({
          source,
          forceNotify,
        }),
      });

    if (!response.ok) {
      const text =
        await response.text();

      console.warn(
        "⚠️ Phase 21 officer sync failed:",
        response.status,
        text
      );

      return null;
    }

    const data =
      await response.json();

    console.log(
      "👮 Phase 21 Officer Intelligence |",
      emergencyId,
      "| current=",
      data.currentCameraId ||
        "N/A",
      "| next=",
      data.nextCameraId ||
        "N/A",
      "| officers=",
      data.officers?.length ||
        0
    );

    return data;
  } catch (error) {
    console.warn(
      "⚠️ Phase 21 officer sync error:",
      error.message
    );

    return null;
  }
}

/*
 * =========================================================
 * EMERGENCY CAMERA HANDOFF
 * =========================================================
 */

async function handoffEmergency({
  emergencyId,
  nextCameraId,
  confidence = 0,
}) {
  const nextId =
    String(
      nextCameraId
    ).trim();

  const event =
    await EmergencyEvent.findOne({
      emergencyId,
      status: {
        $in:
          ACTIVE_STATUSES,
      },
    });

  if (!event) {
    throw new Error(
      "Active emergency event not found"
    );
  }

  const now =
    Date.now();

  /*
   * If the vehicle has been unseen for too
   * long, mark it SEARCHING first.
   */

  if (
    event.lastSeenAt &&
    now -
        new Date(
          event.lastSeenAt
        ).getTime() >
      HANDOFF_MAX_GAP_MS
  ) {
    event.status =
      "SEARCHING";
  }

  const previousCameraId =
    String(
      event.currentCameraId ||
        ""
    ).trim();

  /*
   * =======================================================
   * SAME CAMERA CONFIRMATION
   * =======================================================
   */

  if (
    previousCameraId ===
    nextId
  ) {
    event.lastSeenAt =
      new Date();

    if (
      Number.isFinite(
        Number(confidence)
      )
    ) {
      event.confidence =
        Math.max(
          0,
          Math.min(
            1,
            Number(confidence)
          )
        );
    }

    if (
      event.status ===
      "SEARCHING"
    ) {
      event.status =
        "TRACKING";
    }

    await event.save();

    /*
     * Phase 21:
     * Refresh officer information.
     */

    await syncOfficerIntelligence(
      emergencyId,
      "HANDOFF",
      true
    );

    return {
      moved: false,
      event,
      connection: null,
    };
  }

  /*
   * =======================================================
   * GRAPH-CONSTRAINED HANDOFF
   * =======================================================
   */

  if (previousCameraId) {
    const connection =
      await CameraConnection.findOne({
        fromCameraId:
          previousCameraId,

        toCameraId:
          nextId,

        active: true,
      }).lean();

    if (!connection) {
      throw new Error(
        `No active camera connection from ${previousCameraId} to ${nextId}`
      );
    }

    event.previousCameraId =
      previousCameraId;

    event.currentCameraId =
      nextId;

    if (
      Number.isFinite(
        Number(confidence)
      )
    ) {
      event.confidence =
        Math.max(
          0,
          Math.min(
            1,
            Number(confidence)
          )
        );
    }

    event.lastSeenAt =
      new Date();

    event.status =
      "TRACKING";

    /*
     * Maintain emergency route history.
     */

    const routeCameraIds =
      Array.isArray(
        event.routeCameraIds
      )
        ? event.routeCameraIds
        : [];

    if (
      previousCameraId &&
      routeCameraIds.length ===
        0
    ) {
      routeCameraIds.push(
        previousCameraId
      );
    }

    if (
      !routeCameraIds.includes(
        nextId
      )
    ) {
      routeCameraIds.push(
        nextId
      );
    }

    event.routeCameraIds =
      routeCameraIds;

    await event.save();

    /*
     * PHASE 21:
     * Jurisdiction may have changed.
     */

    await syncOfficerIntelligence(
      emergencyId,
      "HANDOFF",
      true
    );

    return {
      moved: true,
      event,
      connection,
    };
  }

  /*
   * =======================================================
   * FIRST CAMERA ASSIGNMENT
   * =======================================================
   */

  event.currentCameraId =
    nextId;

  event.lastSeenAt =
    new Date();

  event.status =
    "TRACKING";

  if (
    Number.isFinite(
      Number(confidence)
    )
  ) {
    event.confidence =
      Math.max(
        0,
        Math.min(
          1,
          Number(confidence)
        )
      );
  }

  event.routeCameraIds = [
    nextId,
  ];

  await event.save();

  /*
   * First camera:
   * establish officer responsibility.
   */

  await syncOfficerIntelligence(
    emergencyId,
    "AI_EMERGENCY",
    true
  );

  return {
    moved: true,
    event,
    connection: null,
  };
}

module.exports = {
  getNextCameras,
  handoffEmergency,
  syncOfficerIntelligence,
};