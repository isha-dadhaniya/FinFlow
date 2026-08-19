const express = require("express");
const router = express.Router();
const { getBills, createBill, updateBill, deleteBill } = require("../controllers/billController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getBills);
router.post("/", authMiddleware, createBill);
router.put("/:id", authMiddleware, updateBill);
router.delete("/:id", authMiddleware, deleteBill);

module.exports = router;
