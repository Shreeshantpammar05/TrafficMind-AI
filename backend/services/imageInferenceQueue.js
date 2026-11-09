
const { randomUUID } = require("crypto");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_ACTIVE_JOBS = 5;
const JOB_TIMEOUT_MS = 120000;
const RESULT_TTL_MS = 5 * 60 * 1000;

const jobs = new Map();
const waitingQueue = [];

function cleanupJobs() {
  const now = Date.now();

  for (const [id, job] of jobs) {
    if (job.status === "completed" || job.status === "failed") {
      if (job.expiresAt <= now) {
        jobs.delete(id);
      }
      continue;
    }

    if (now - job.createdAt > JOB_TIMEOUT_MS) {
      job.status = "failed";
      job.error = "Image analysis job timed out.";
      job.imageBuffer = null;
      job.claimedAt = null;
      job.expiresAt = now + RESULT_TTL_MS;
      continue;
    }

    if (
      job.status === "processing" &&
      job.claimedAt &&
      now - job.claimedAt > 60000
    ) {
      job.status = "queued";
      job.claimedAt = null;
      waitingQueue.push(id);
    }
  }
}

function enqueueImageJob({
  userId,
  imageBuffer,
  contentType,
  originalName,
}) {
  cleanupJobs();

  if (!userId || !String(userId).trim()) {
    throw new Error("Authenticated user ID is required.");
  }

  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error("A valid image buffer is required.");
  }

  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds the 10 MB limit.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(contentType)) {
    throw new Error("Unsupported image format.");
  }

  const activeJobs = [...jobs.values()].filter(
    (job) => job.status === "queued" || job.status === "processing"
  ).length;

  if (activeJobs >= MAX_ACTIVE_JOBS) {
    throw new Error("Image analysis queue is full. Try again shortly.");
  }

  const jobId = randomUUID();
  const now = Date.now();

  jobs.set(jobId, {
    id: jobId,
    userId: String(userId),
    status: "queued",
    imageBuffer,
    contentType,
    originalName: originalName || "traffic-image",
    createdAt: now,
    claimedAt: null,
    expiresAt: now + JOB_TIMEOUT_MS,
    result: null,
    annotatedImage: null,
    error: "",
  });

  waitingQueue.push(jobId);

  return {
    jobId,
    status: "queued",
  };
}

function claimNextImageJob() {
  cleanupJobs();

  while (waitingQueue.length > 0) {
    const jobId = waitingQueue.shift();
    const job = jobs.get(jobId);

    if (!job || job.status !== "queued") {
      continue;
    }

    job.status = "processing";
    job.claimedAt = Date.now();

    return {
      jobId: job.id,
      contentType: job.contentType,
      originalName: job.originalName,
      imageBuffer: job.imageBuffer,
    };
  }

  return null;
}

function finishIfReady(job) {
  if (job.result && job.annotatedImage) {
    job.status = "completed";
    job.imageBuffer = null;
    job.claimedAt = null;
    job.expiresAt = Date.now() + RESULT_TTL_MS;
  }
}

function completeImageJobResult(jobId, result) {
  const job = jobs.get(jobId);

  if (!job || job.status !== "processing") {
    return false;
  }

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Invalid image analysis result.");
  }

  // The annotated image is transferred separately as binary data.
  const {
    jpg: _jpg,
    annotatedImage: _annotatedImage,
    ...safeResult
  } = result;

  job.result = safeResult;
  finishIfReady(job);

  return true;
}

function completeImageJobImage(jobId, imageBuffer) {
  const job = jobs.get(jobId);

  if (!job || job.status !== "processing") {
    return false;
  }

  if (
    !Buffer.isBuffer(imageBuffer) ||
    imageBuffer.length === 0 ||
    imageBuffer.length > MAX_IMAGE_BYTES
  ) {
    throw new Error("Invalid annotated image.");
  }

  job.annotatedImage = imageBuffer;
  finishIfReady(job);

  return true;
}

function failImageJob(jobId, message) {
  const job = jobs.get(jobId);

  if (!job) {
    return false;
  }

  job.status = "failed";
  job.error = String(message || "Image analysis failed.").slice(0, 300);
  job.imageBuffer = null;
  job.annotatedImage = null;
  job.result = null;
  job.claimedAt = null;
  job.expiresAt = Date.now() + RESULT_TTL_MS;

  return true;
}

function getImageJob(jobId, userId) {
  cleanupJobs();

  const job = jobs.get(jobId);

  if (!job) {
    return null;
  }

  // A user may retrieve only jobs created under their own account.
  if (!userId || String(job.userId) !== String(userId)) {
    return null;
  }

  const response = {
    jobId: job.id,
    status: job.status,
  };

  if (job.status === "failed") {
    response.error = job.error;
  }

  if (job.status === "completed") {
    const imageDataUrl =
      `data:image/jpeg;base64,${job.annotatedImage.toString("base64")}`;

    response.result = {
      ...job.result,
      jpg: imageDataUrl,
      annotatedImage: imageDataUrl,
      annotatedImageMimeType: "image/jpeg",
    };
  }

  return response;
}

module.exports = {
  enqueueImageJob,
  claimNextImageJob,
  completeImageJobResult,
  completeImageJobImage,
  failImageJob,
  getImageJob,
};
