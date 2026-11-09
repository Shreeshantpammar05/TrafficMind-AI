
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const {
  enqueueImageJob,
  getImageJob,
} = require("../services/imageInferenceQueue");

const UPLOAD_DIR = path.resolve(__dirname, "../uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const MIME_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Create a GPU inference job from an image previously saved by /api/upload/image.
router.get("/analyze", verifyToken, async (req, res) => {
  try {
    const requestedPath = req.query.imagePath;

    if (typeof requestedPath !== "string" || !requestedPath.trim()) {
      return res.status(400).json({
        success: false,
        error: "imagePath is required",
      });
    }

    const imagePath = path.resolve(requestedPath);
    const relativePath = path.relative(UPLOAD_DIR, imagePath);

    // Only accept files within backend/uploads; never read arbitrary server paths.
    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(403).json({
        success: false,
        error: "Image path is outside the upload directory.",
      });
    }

    const extension = path.extname(imagePath).toLowerCase();
    const contentType = MIME_BY_EXTENSION[extension];

    if (!contentType) {
      return res.status(415).json({
        success: false,
        error: "Only JPEG, PNG, and WebP images are supported.",
      });
    }

    const imageBuffer = await fs.promises.readFile(imagePath);

    if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({
        success: false,
        error: "Image is empty or exceeds the 10 MB limit.",
      });
    }

    const job = enqueueImageJob({
      userId: req.user.userId,
      imageBuffer,
      contentType,
      originalName: path.basename(imagePath),
    });

    return res.status(202).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
    });
  } catch (error) {
    console.error("Image inference queue error:", error);

    return res.status(503).json({
      success: false,
      error: error.message || "Could not queue image for GPU analysis.",
    });
  }
});

// Return the status/result only to the user who created the job.
router.get("/analyze/:jobId", verifyToken, (req, res) => {
  try {
    const job = getImageJob(req.params.jobId, req.user.userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Image analysis job not found.",
      });
    }

    if (job.status === "failed") {
      return res.status(500).json({
        success: false,
        status: job.status,
        error: job.error || "Image analysis failed.",
      });
    }

    if (job.status !== "completed") {
      return res.status(202).json({
        success: true,
        jobId: job.jobId,
        status: job.status,
      });
    }

    return res.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      result: job.result,
    });
  } catch (error) {
    console.error("Image inference status error:", error);

    return res.status(500).json({
      success: false,
      error: "Could not retrieve image analysis result.",
    });
  }
});

module.exports = router;
