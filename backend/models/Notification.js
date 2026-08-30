const mongoose =
  require("mongoose");

const notificationSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        trim: true,
        required: true,
      },

      message: {
        type: String,
        trim: true,
        required: true,
      },

      type: {
        type: String,
        trim: true,
        default: "SYSTEM",
      },

      /*
       * =====================================================
       * ROLE / AUDIENCE TARGETING
       * =====================================================
       *
       * PUBLIC:
       *   Citizens + officers + admins
       *
       * GOVERNMENT:
       *   Government officers + admins
       *
       * MAIN_OFFICER:
       *   Main officers
       *
       * SUB_OFFICER:
       *   Sub officers
       *
       * ADMIN:
       *   Admin only
       *
       * ALL:
       *   System-wide notification
       */
      audience: {
        type: String,
        enum: [
          "PUBLIC",
          "GOVERNMENT",
          "MAIN_OFFICER",
          "SUB_OFFICER",
          "ADMIN",
          "ALL",
        ],
        default: "PUBLIC",
        index: true,
      },

      /*
       * Optional jurisdiction targeting.
       *
       * Used mainly for officer notifications.
       */
      district: {
        type: String,
        trim: true,
        default: "",
        index: true,
      },

      area: {
        type: String,
        trim: true,
        default: "",
        index: true,
      },

      isRead: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

notificationSchema.index({
  audience: 1,
  createdAt: -1,
});

notificationSchema.index({
  district: 1,
  area: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );