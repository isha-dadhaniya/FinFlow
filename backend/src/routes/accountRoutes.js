const express = require("express");
const router = express.Router();
const { getAccounts, createAccount, updateAccount, deleteAccount } = require("../controllers/accountController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getAccounts);
router.post("/", authMiddleware, createAccount);
router.put("/:id", authMiddleware, updateAccount);
router.delete("/:id", authMiddleware, deleteAccount);

module.exports = router;
