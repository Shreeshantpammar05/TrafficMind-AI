const express =
  require("express");

const router =
  express.Router();

const {
  calculateLaneOptimization,
} = require(
  "../services/multiLaneService"
);

router.get(
  "/multi-lane",
  async (req, res) => {
    try {
      const result =
        await calculateLaneOptimization();

      res.json(result);
    } catch (error) {
      console.error(
        "Multi-Lane Optimization Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to generate multi-lane optimization",
      });
    }
  }
);

module.exports = router;