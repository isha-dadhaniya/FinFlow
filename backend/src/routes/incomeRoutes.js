const express = require("express");
const router = express.Router();
const { getIncomes, createIncome, updateIncome, deleteIncome } = require("../controllers/incomeController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getIncomes);
router.post("/", authMiddleware, createIncome);
router.put("/:id", authMiddleware, updateIncome);
router.delete("/:id", authMiddleware, deleteIncome);

module.exports = router;
