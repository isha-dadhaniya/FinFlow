const express = require("express");
const router = express.Router();
const {
  getSplits,
  createSplit,
  updateSplit,
  toggleSettlement,
  deleteSplit,
  getGroupContributions,
  createGroupContribution,
} = require("../controllers/groupController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/splits", getSplits);
router.post("/splits", createSplit);
router.put("/splits/:id", updateSplit);
router.put("/splits/:id/settle", toggleSettlement);
router.delete("/splits/:id", deleteSplit);

router.get("/contributions", getGroupContributions);
router.post("/contributions", createGroupContribution);

module.exports = router;
