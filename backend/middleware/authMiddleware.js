
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================
// VERIFY TOKEN + CURRENT DATABASE PERMISSIONS
// ============================================

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.substring(7).trim();

  if (
    !token ||
    token === "null" ||
    token === "undefined"
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  let decoded;

  // Step 1: Verify JWT and enforce maximum session age.
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
        maxAge: "8h",
      }
    );

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token. Please log in again.",
    });
  }

  // Step 2: Fetch the latest user account from MongoDB.
  let currentUser;

  try {
    currentUser = await User.findById(decoded.userId)
      .select(
        "_id email role governmentOfficerType jurisdictionDistrict jurisdictionArea verificationStatus"
      )
      .lean();
  } catch (error) {
    console.error("AUTH DATABASE ERROR:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to verify your account right now. Please try again.",
    });
  }

  if (!currentUser) {
    return res.status(401).json({
      success: false,
      message: "Account not found. Please log in again.",
    });
  }

  // Step 3: Block officers whose approval is no longer valid.
  if (
    currentUser.role === "government" &&
    currentUser.verificationStatus !== "approved"
  ) {
    return res.status(403).json({
      success: false,
      message:
        currentUser.verificationStatus === "rejected"
          ? "Your government officer application has been rejected."
          : "Your government officer application is awaiting approval.",
      verificationStatus:
        currentUser.verificationStatus || "pending",
    });
  }

  // Step 4: Always use current database permissions.
  // Preserve properties expected by existing backend routes.
  req.user = {
    ...decoded,

    userId: currentUser._id.toString(),
    email: currentUser.email,
    role: currentUser.role,

    governmentOfficerType:
      currentUser.governmentOfficerType || "",

    jurisdictionDistrict:
      currentUser.jurisdictionDistrict || "",

    jurisdictionArea:
      currentUser.jurisdictionArea || "",

    verificationStatus:
      currentUser.verificationStatus || "pending",
  };

  return next();
};


// ============================================
// ADMIN ACCESS
// ============================================

const requireAdmin = (req, res, next) => {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  return next();
};


// ============================================
// APPROVED GOVERNMENT ACCESS
// ============================================

const requireApprovedGovernment = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role !== "government") {
    return res.status(403).json({
      success: false,
      message: "Government officer access required",
    });
  }

  if (req.user.verificationStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: "Government officer approval required",
      verificationStatus:
        req.user.verificationStatus || "pending",
    });
  }

  return next();
};


// ============================================
// CAMERA ACCESS BY JURISDICTION
//
// Admin:
//   All cameras
//
// Main Officer:
//   Assigned district
//
// Sub Officer:
//   Assigned district + assigned area
// ============================================

const requireCameraAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role !== "government") {
    return res.status(403).json({
      success: false,
      message: "Government camera access required",
    });
  }

  if (req.user.verificationStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: "Government officer approval required",
    });
  }

  const officerType =
    req.user.governmentOfficerType;

  if (
    officerType !== "main_officer" &&
    officerType !== "sub_officer"
  ) {
    return res.status(403).json({
      success: false,
      message: "Valid government officer type is required",
    });
  }

  if (!req.user.jurisdictionDistrict) {
    return res.status(403).json({
      success: false,
      message: "Officer jurisdiction is not assigned",
    });
  }

  if (
    officerType === "sub_officer" &&
    !req.user.jurisdictionArea
  ) {
    return res.status(403).json({
      success: false,
      message: "Sub Officer area is not assigned",
    });
  }

  return next();
};


module.exports = {
  verifyToken,
  requireAdmin,
  requireApprovedGovernment,
  requireCameraAccess,
};
