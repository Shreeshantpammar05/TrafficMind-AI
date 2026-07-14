const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/image", upload.single("image"), (req, res) => {

  console.log("========== FILE UPLOADED ==========");
  console.log(req.file);
  console.log("Exists:", fs.existsSync(req.file.path));
  console.log("Path:", req.file.path);

  res.json({
    success: true,
    file: req.file,
  });

});

module.exports = router;