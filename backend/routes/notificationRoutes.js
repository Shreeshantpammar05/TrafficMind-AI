const express =
  require("express");

const router =
  express.Router();

const Notification =
  require("../models/Notification");

const {
  verifyToken,
} = require(
  "../middleware/authMiddleware"
);

/*
 * =========================================================
 * ROLE-AWARE NOTIFICATIONS
 * =========================================================
 *
 * PUBLIC:
 *   Citizen + Government + Admin
 *
 * GOVERNMENT:
 *   Government Officer + Admin
 *
 * MAIN_OFFICER:
 *   Main Officer only
 *
 * SUB_OFFICER:
 *   Sub Officer only
 *
 * ADMIN:
 *   Admin only
 *
 * ALL:
 *   Everyone
 */

/*
 * Build the notification query for
 * the currently authenticated user.
 */
function buildNotificationAudienceQuery(
  user
) {
  const role =
    user?.role || "citizen";

  /*
   * Existing notifications created before
   * audience targeting was added do not have
   * an audience field.
   *
   * Treat those as PUBLIC so nothing breaks.
   */
  const publicAudience = [
    {
      audience: "PUBLIC",
    },
    {
      audience: "ALL",
    },
    {
      audience: {
        $exists: false,
      },
    },
    {
      audience: null,
    },
  ];

  /*
   * Citizen
   *
   * Only public notifications.
   */
  if (role === "citizen") {
    return {
      $or: publicAudience,
    };
  }

  /*
   * Admin
   *
   * Admin sees all general system notifications.
   */
  if (role === "admin") {
    return {};
  }

  /*
   * Government officer
   */
  if (role === "government") {
    const officerType =
      user.governmentOfficerType;

    const district =
      String(
        user.jurisdictionDistrict ||
          ""
      ).trim();

    const area =
      String(
        user.jurisdictionArea ||
          ""
      ).trim();

    const audienceMatches = [
      ...publicAudience,
      {
        audience: "GOVERNMENT",
      },
    ];

    if (
      officerType ===
      "main_officer"
    ) {
      audienceMatches.push({
        audience: "MAIN_OFFICER",
      });
    }

    if (
      officerType ===
      "sub_officer"
    ) {
      audienceMatches.push({
        audience: "SUB_OFFICER",
      });
    }

    /*
     * No jurisdiction means only
     * general/public notifications.
     */
    if (!district) {
      return {
        $or: audienceMatches,
      };
    }

    /*
     * Officer-specific audience:
     *
     * - No district/area targeting
     *   → available to the officer
     *
     * - Matching district
     *   → available
     *
     * - For Sub Officer, matching area
     *   → available
     */
    return {
      $and: [
        {
          $or: audienceMatches,
        },
        {
          $or: [
            {
              district: {
                $in: [
                  "",
                  null,
                ],
              },
            },

            {
              district,
            },
          ],
        },

        {
          $or: [
            {
              area: {
                $in: [
                  "",
                  null,
                ],
              },
            },

            /*
             * Main Officer is district-wide.
             */
            ...(officerType ===
            "main_officer"
              ? []
              : [
                  {
                    area,
                  },
                ]),
          ],
        },
      ],
    };
  }

  /*
   * Unknown role:
   * safest behavior = public only.
   */
  return {
    $or: publicAudience,
  };
}

/*
 * =========================================================
 * GET LATEST NOTIFICATIONS
 * =========================================================
 *
 * GET:
 * /api/notifications
 */
router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      const query =
        buildNotificationAudienceQuery(
          req.user
        );

      const notifications =
        await Notification.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .limit(50)
          .lean();

      return res.json({
        success: true,
        count:
          notifications.length,
        notifications,
      });
    } catch (error) {
      console.error(
        "Notification Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch notifications",
      });
    }
  }
);

/*
 * =========================================================
 * CREATE NOTIFICATION
 * =========================================================
 *
 * POST:
 * /api/notifications
 *
 * Only Admin can create general notifications.
 *
 * The creator may specify:
 *   audience
 *   district
 *   area
 *
 * This prevents ordinary citizens from
 * creating system notifications.
 */
router.post(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user?.role !==
        "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only administrators can create system notifications",
        });
      }

      const {
        title,
        message,
        type,
        audience,
        district,
        area,
      } = req.body || {};

      if (
        !String(
          title || ""
        ).trim() ||
        !String(
          message || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "title and message are required",
        });
      }

      const allowedAudiences = [
        "PUBLIC",
        "GOVERNMENT",
        "MAIN_OFFICER",
        "SUB_OFFICER",
        "ADMIN",
        "ALL",
      ];

      const normalizedAudience =
        allowedAudiences.includes(
          String(
            audience || ""
          )
            .trim()
            .toUpperCase()
        )
          ? String(
              audience
            )
              .trim()
              .toUpperCase()
          : "PUBLIC";

      const notification =
        await Notification.create({
          title:
            String(
              title
            ).trim(),

          message:
            String(
              message
            ).trim(),

          type:
            String(
              type || "SYSTEM"
            ).trim(),

          audience:
            normalizedAudience,

          district:
            String(
              district || ""
            ).trim(),

          area:
            String(
              area || ""
            ).trim(),
        });

      return res.status(201).json({
        success: true,
        notification,
      });
    } catch (error) {
      console.error(
        "Notification Create Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create notification",
      });
    }
  }
);

module.exports = router;