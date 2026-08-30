const EmergencyAuditLog =
  require(
    "../models/EmergencyAuditLog"
  );

/*
 * =========================================================
 * PHASE 25 — EMERGENCY AUDIT SERVICE
 * =========================================================
 *
 * Central writer for all emergency lifecycle decisions.
 *
 * Important:
 * - Audit logging must never stop an emergency workflow.
 * - Successful writes are explicitly logged so runtime
 *   integration can be verified.
 */

const normalizeOptionalNumber = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numeric =
    Number(value);

  return Number.isFinite(
    numeric
  )
    ? numeric
    : null;
};

const normalizeString = (
  value
) =>
  String(
    value ?? ""
  ).trim();

const safeMetadata = (
  metadata
) => {
  if (
    !metadata ||
    typeof metadata !==
      "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }

  return metadata;
};

const normalizeEventDate = (
  value
) => {
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return value;
  }

  const date =
    value
      ? new Date(value)
      : new Date();

  return Number.isNaN(
    date.getTime()
  )
    ? new Date()
    : date;
};

async function recordEmergencyAudit({
  emergencyId,
  action,
  source = "SYSTEM",
  cameraId = "",
  previousCameraId = "",
  nextCameraId = "",
  status = "",
  priority = "",
  priorityScore = null,
  confidence = null,
  decision = "",
  reason = "",
  etaSeconds = null,
  metadata = {},
  actorUserId = null,
  actorRole = "",
  eventAt = new Date(),
}) {
  const normalizedEmergencyId =
    normalizeString(
      emergencyId
    );

  const normalizedAction =
    normalizeString(
      action
    );

  if (
    !normalizedEmergencyId ||
    !normalizedAction
  ) {
    console.warn(
      "Emergency Audit skipped: emergencyId/action missing",
      {
        emergencyId,
        action,
      }
    );

    return null;
  }

  const document = {
    emergencyId:
      normalizedEmergencyId,

    action:
      normalizedAction,

    source:
      normalizeString(
        source
      ) || "SYSTEM",

    cameraId:
      normalizeString(
        cameraId
      ),

    previousCameraId:
      normalizeString(
        previousCameraId
      ),

    nextCameraId:
      normalizeString(
        nextCameraId
      ),

    status:
      normalizeString(
        status
      ),

    priority:
      normalizeString(
        priority
      ),

    priorityScore:
      normalizeOptionalNumber(
        priorityScore
      ),

    confidence:
      normalizeOptionalNumber(
        confidence
      ),

    decision:
      normalizeString(
        decision
      ),

    reason:
      normalizeString(
        reason
      ),

    etaSeconds:
      normalizeOptionalNumber(
        etaSeconds
      ),

    metadata:
      safeMetadata(
        metadata
      ),

    actorUserId:
      actorUserId || null,

    actorRole:
      normalizeString(
        actorRole
      ),

    eventAt:
      normalizeEventDate(
        eventAt
      ),
  };

  try {
    const created =
      await EmergencyAuditLog.create(
        document
      );

    console.log(
      "✅ Emergency audit saved",
      {
        emergencyId:
          created.emergencyId,
        action:
          created.action,
        source:
          created.source,
        auditId:
          String(
            created._id
          ),
      }
    );

    return created;
  } catch (error) {
    /*
     * Keep emergency workflows alive even when audit storage
     * has a transient problem.
     */
    console.error(
      "❌ Emergency Audit Log Error:",
      error?.message ||
        error
    );

    if (
      error?.errors
    ) {
      console.error(
        "Emergency Audit Validation Errors:",
        Object.keys(
          error.errors
        ).reduce(
          (result, key) => {
            result[key] =
              error.errors[
                key
              ]?.message;

            return result;
          },
          {}
        )
      );
    }

    return null;
  }
}

async function getEmergencyAuditTimeline(
  emergencyId,
  limit = 100
) {
  const normalizedEmergencyId =
    normalizeString(
      emergencyId
    );

  if (
    !normalizedEmergencyId
  ) {
    return [];
  }

  const safeLimit = Math.max(
    1,
    Math.min(
      250,
      Number(limit) || 100
    )
  );

  return EmergencyAuditLog.find({
    emergencyId:
      normalizedEmergencyId,
  })
    .sort({
      eventAt: 1,
      createdAt: 1,
    })
    .limit(
      safeLimit
    )
    .lean();
}

module.exports = {
  recordEmergencyAudit,
  getEmergencyAuditTimeline,
};
