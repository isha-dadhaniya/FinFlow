const express = require("express");
const router = express.Router();
const {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getContributions,
  createContribution,
} = require("../controllers/familyController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/members", getMembers);
router.post("/members", createMember);
router.put("/members/:id", updateMember);
router.delete("/members/:id", deleteMember);

router.get("/contributions", getContributions);
router.post("/contributions", createContribution);

module.exports = router;
