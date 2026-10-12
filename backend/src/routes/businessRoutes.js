const express = require("express");
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getProfitLoss,
} = require("../controllers/businessController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/invoices", getInvoices);
router.post("/invoices", createInvoice);
router.put("/invoices/:id", updateInvoice);
router.delete("/invoices/:id", deleteInvoice);

router.get("/profit-loss", getProfitLoss);

module.exports = router;
