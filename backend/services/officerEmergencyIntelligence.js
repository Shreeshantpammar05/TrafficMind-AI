const EmergencyEvent =
  require("../models/EmergencyEvent");

const TrafficCamera =
  require("../models/TrafficCamera");

const CameraConnection =
  require("../models/CameraConnection");

const User =
  require("../models/User");

const OfficerEmergencyAlert =
  require("../models/OfficerEmergencyAlert");

const {
  getEmergencyPriorityConfig,
} = require("./emergencyPriorityEngine");

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const escapeRegex = (value) =>
  String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

async function estimateEtaSeconds({
  distanceMeters,
  vehicleType,
}) {
  const distance =
    Number(distanceMeters);

  if (
    !Number.isFinite(distance) ||
    distance <= 0
  ) {
    return null;
  }

  const config =
    await getEmergencyPriorityConfig();

  const type =
    String(vehicleType || "")
      .trim()
      .toLowerCase();

  const speedKmh =
    Math.max(
      1,
      Number(
        config.vehicleSpeedsKmh?.[type] ??
          config.vehicleSpeedsKmh?.default ??
          40
      )
    );

  const speedMps =
    (speedKmh * 1000) /
    3600;

  return Math.max(
    1,
    Math.round(
      distance / speedMps
    )
  );
}

async function resolveResponsibleOfficers({
  district,
  area,
}) {
  const normalizedDistrict =
    normalize(district);

  const normalizedArea =
    normalize(area);

  if (!normalizedDistrict) {
    return [];
  }

  const districtRegex =
    new RegExp(
      `^${escapeRegex(district)}$`,
      "i"
    );

  const users =
    await User.find({
      role: "government",
      verificationStatus: "approved",
      governmentOfficerType: {
        $in: [
          "main_officer",
          "sub_officer",
        ],
      },
      jurisdictionDistrict:
        districtRegex,
    }).lean();

  return users.filter((user) => {
    const officerType =
      normalize(
        user.governmentOfficerType
      );

    if (
      officerType ===
      "main_officer"
    ) {
      return true;
    }

    if (
      officerType ===
      "sub_officer"
    ) {
      return (
        !!normalizedArea &&
        normalize(
          user.jurisdictionArea
        ) === normalizedArea
      );
    }

    return false;
  });
}

async function getEmergencyContext(
  emergencyId
) {
  const event =
    await EmergencyEvent.findOne({
      emergencyId,
      status: {
        $in: ACTIVE_STATUSES,
      },
    }).lean();

  if (!event) {
    return null;
  }

  if (!event.currentCameraId) {
    return {
      event,
      camera: null,
      nextConnection: null,
      nextCamera: null,
      etaSeconds: null,
    };
  }

  const camera =
    await TrafficCamera.findOne({
      cameraId:
        event.currentCameraId,
      status: "active",
    }).lean();

  if (!camera) {
    return {
      event,
      camera: null,
      nextConnection: null,
      nextCamera: null,
      etaSeconds: null,
    };
  }

  const nextConnection =
    await CameraConnection.findOne({
      fromCameraId:
        event.currentCameraId,
      active: true,
    })
      .sort({
        priority: -1,
        distanceMeters: 1,
      })
      .lean();

  const nextCamera =
    nextConnection
      ? await TrafficCamera.findOne({
          cameraId:
            nextConnection.toCameraId,
          status: "active",
        }).lean()
      : null;

  const etaSeconds =
    nextConnection
      ? await estimateEtaSeconds({
          distanceMeters:
            nextConnection.distanceMeters,
          vehicleType:
            event.vehicleType,
        })
      : null;

  return {
    event,
    camera,
    nextConnection,
    nextCamera,
    etaSeconds,
  };
}

/*
 * =========================================================
 * PHASE 21
 * DYNAMIC OFFICER INTELLIGENCE
 * =========================================================
 *
 * Responsibilities:
 *
 * 1. Determine current camera jurisdiction.
 * 2. Resolve responsible main/sub officers.
 * 3. Create alerts for responsible officers.
 * 4. Update current camera.
 * 5. Update predicted next camera.
 * 6. Update ETA.
 * 7. Resolve officers who are no longer responsible.
 */

async function syncOfficerIntelligence({
  emergencyId,
  source = "HANDOFF",
  forceNotify = false,
}) {
  const context =
    await getEmergencyContext(
      emergencyId
    );

  if (!context) {
    return {
      success: false,
      reason:
        "Active emergency event not found",
      created: 0,
      updated: 0,
      resolved: 0,
      officers: [],
    };
  }

  const {
    event,
    camera,
    nextConnection,
    etaSeconds,
  } = context;

  if (!camera) {
    return {
      success: false,
      reason:
        "Emergency has no active current camera",
      created: 0,
      updated: 0,
      resolved: 0,
      officers: [],
    };
  }

  const district =
    String(
      camera.district || ""
    ).trim();

  const area =
    String(
      camera.area || ""
    ).trim();

  const responsibleOfficers =
    await resolveResponsibleOfficers({
      district,
      area,
    });

  const existingAlerts =
    await OfficerEmergencyAlert.find({
      emergencyId,
    });

  const responsibleIds =
    new Set(
      responsibleOfficers.map(
        (officer) =>
          String(
            officer._id
          )
      )
    );

  let created = 0;
  let updated = 0;
  let resolved = 0;

  /*
   * -------------------------------------------------------
   * Release officers who no longer own the jurisdiction.
   * -------------------------------------------------------
   */

  for (
    const alert of existingAlerts
  ) {
    const officerId =
      String(
        alert.recipientUserId
      );

    if (
      !responsibleIds.has(
        officerId
      ) &&
      alert.status !==
        "RESOLVED"
    ) {
      alert.status =
        "RESOLVED";

      alert.isRead = true;

      alert.resolvedAt =
        new Date();

      alert.notes =
        "Jurisdiction responsibility transferred to another area.";

      await alert.save();

      resolved += 1;
    }
  }

  const officerResults = [];

  /*
   * -------------------------------------------------------
   * Create/update responsible officers.
   * -------------------------------------------------------
   */

  for (
    const officer of
    responsibleOfficers
  ) {
    let alert =
      await OfficerEmergencyAlert.findOne({
        emergencyId,
        recipientUserId:
          officer._id,
      });

    const isNew =
      !alert;

    const cameraChanged =
      !!alert &&
      alert.currentCameraId !==
        event.currentCameraId;

    const needsFreshNotification =
      isNew ||
      forceNotify ||
      cameraChanged;

    if (!alert) {
      alert =
        new OfficerEmergencyAlert({
          emergencyId,
          recipientUserId:
            officer._id,
          recipientName:
            officer.name,
          officerType:
            officer.governmentOfficerType,
        });

      created += 1;
    } else {
      updated += 1;
    }

    alert.recipientName =
      officer.name;

    alert.officerType =
      officer.governmentOfficerType;

    alert.jurisdictionDistrict =
      district;

    alert.jurisdictionArea =
      officer.governmentOfficerType ===
      "sub_officer"
        ? officer.jurisdictionArea ||
          ""
        : "";

    alert.emergencyType =
      event.vehicleType;

    alert.priority =
      event.priority ||
      "CRITICAL";

    alert.currentCameraId =
      event.currentCameraId;

    alert.nextCameraId =
      nextConnection?.toCameraId ||
      "";

    alert.etaSeconds =
      etaSeconds;

    alert.etaAt =
      etaSeconds != null
        ? new Date(
            Date.now() +
              etaSeconds *
                1000
          )
        : null;

    alert.locationName =
      camera.location || "";

    alert.latitude =
      camera.latitude ??
      null;

    alert.longitude =
      camera.longitude ??
      null;

    alert.distanceMeters =
      nextConnection?.distanceMeters ??
      null;

    alert.source =
      source;

    /*
     * Send a fresh notification when:
     *
     * - new officer
     * - emergency moved camera
     * - explicit force notification
     */

    if (
      needsFreshNotification
    ) {
      alert.status =
        "SENT";

      alert.isRead = false;

      alert.acknowledgedAt =
        null;

      alert.resolvedAt =
        null;

      alert.sentAt =
        new Date();

      if (
        officer.governmentOfficerType ===
        "sub_officer"
      ) {
        alert.notes =
          cameraChanged
            ? "Emergency responsibility transferred to this area officer."
            : "Area-specific emergency alert.";
      } else {
        alert.notes =
          cameraChanged
            ? "Emergency position updated for district supervisory officer."
            : "District-level supervisory emergency alert.";
      }
    }

    await alert.save();

    officerResults.push({
      alertId:
        alert._id,

      name:
        alert.recipientName,

      officerType:
        alert.officerType,

      district,

      area:
        alert.jurisdictionArea,

      currentCameraId:
        alert.currentCameraId,

      nextCameraId:
        alert.nextCameraId,

      etaSeconds:
        alert.etaSeconds,

      status:
        alert.status,
    });
  }

  return {
    success: true,

    emergencyId,

    created,

    updated,

    resolved,

    jurisdiction: {
      district,
      area,
    },

    currentCameraId:
      event.currentCameraId,

    nextCameraId:
      nextConnection?.toCameraId ||
      "",

    etaSeconds,

    officers:
      officerResults,
  };
}

/*
 * =========================================================
 * RELEASE ALL OFFICER RESPONSIBILITY
 * =========================================================
 */

async function resolveCompletedEmergencyAlerts(
  emergencyId
) {
  const result =
    await OfficerEmergencyAlert.updateMany(
      {
        emergencyId,
        status: {
          $ne: "RESOLVED",
        },
      },
      {
        $set: {
          status:
            "RESOLVED",

          isRead:
            true,

          resolvedAt:
            new Date(),

          notes:
            "Emergency event completed; officer responsibility released.",
        },
      }
    );

  return result;
}

module.exports = {
  resolveResponsibleOfficers,
  syncOfficerIntelligence,
  resolveCompletedEmergencyAlerts,
};