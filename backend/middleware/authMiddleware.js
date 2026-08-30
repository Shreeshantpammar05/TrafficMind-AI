const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const token =
      authHeader.substring(7).trim();

    if (
      !token ||
      token === "null" ||
      token === "undefined"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    console.log(
      "JWT ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token",
    });
  }
};

const requireAdmin = (
  req,
  res,
  next
) => {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Admin access required",
    });
  }

  next();
};

const requireApprovedGovernment = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required",
    });
  }

  if (
    req.user.role === "admin"
  ) {
    return next();
  }

  if (
    req.user.role !== "government"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Government officer access required",
    });
  }

  if (
    req.user.verificationStatus !==
    "approved"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Government officer application is still pending approval",
      verificationStatus:
        req.user.verificationStatus ||
        "pending",
    });
  }

  next();
};

/*
 * Phase 5:
 * Camera access is restricted by the
 * logged-in officer's jurisdiction.
 *
 * Admin:
 *   → all cameras
 *
 * Main Officer:
 *   → all cameras inside assigned district
 *
 * Sub Officer:
 *   → cameras inside assigned district + assigned area
 *
 * Nearby cameras are NOT added here.
 * That belongs to Phase 7.
 */
const requireCameraAccess = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required",
    });
  }

  if (
    req.user.role === "admin"
  ) {
    return next();
  }

  if (
    req.user.role !== "government"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Government camera access required",
    });
  }

  if (
    req.user.verificationStatus !==
    "approved"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Government officer approval required",
    });
  }

  const officerType =
    req.user.governmentOfficerType;

  if (
    officerType !==
      "main_officer" &&
    officerType !==
      "sub_officer"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Valid government officer type is required",
    });
  }

  if (
    !req.user.jurisdictionDistrict
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Officer jurisdiction is not assigned",
    });
  }

  if (
    officerType ===
      "sub_officer" &&
    !req.user.jurisdictionArea
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Sub Officer area is not assigned",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireApprovedGovernment,
  requireCameraAccess,
};