const express =
  require("express");

const router =
  express.Router();

const User =
  require("../models/User");

const {
  verifyToken,
} = require(
  "../middleware/authMiddleware"
);

/*
 * =========================================================
 * CURRENT USER PROFILE
 * =========================================================
 *
 * GET:
 * /api/users/me
 *
 * Returns only the authenticated user's own profile.
 *
 * Password is NEVER returned.
 */
router.get(
  "/me",
  verifyToken,
  async (req, res) => {
    try {
      const userId =
        req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error:
            "Authenticated user ID is missing",
        });
      }

      const user =
        await User.findById(
          userId
        )
          .select(
            "-password -governmentProof"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          error:
            "User profile not found",
        });
      }

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "User Profile Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch user profile",
      });
    }
  }
);

module.exports = router;