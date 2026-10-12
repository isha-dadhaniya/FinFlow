const express = require("express");
const router = express.Router();
const { getLoans, createLoan, updateLoan, deleteLoan, markEmiPaid } = require("../controllers/loanController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getLoans);
router.post("/", authMiddleware, createLoan);
router.put("/:id", authMiddleware, updateLoan);
router.delete("/:id", authMiddleware, deleteLoan);
router.put("/:loanId/emi/:emiIndex/pay", authMiddleware, markEmiPaid);

module.exports = router;
