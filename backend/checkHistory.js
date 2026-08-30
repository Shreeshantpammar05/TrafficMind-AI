require("dotenv").config();

const mongoose = require("mongoose");

const History = require(
  "./models/CameraDetectionHistory"
);

async function checkHistory() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB connected"
    );

    // Remove our test document
    const deleted =
      await History.deleteOne({
        cameraId: "TEST-CAMERA",
      });

    console.log(
      "Test record cleanup:",
      deleted
    );

    // Get history grouped by camera
    const data =
      await History.aggregate([
        {
          $group: {
            _id: "$cameraId",
            count: {
              $sum: 1,
            },
            latest: {
              $max: "$detectedAt",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    console.log(
      "\n📊 Camera History:"
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      "❌ History check error:",
      error
    );
  } finally {
    await mongoose.disconnect();
  }
}

checkHistory();