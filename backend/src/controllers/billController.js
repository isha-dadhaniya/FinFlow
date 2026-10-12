const Bill = require("../models/Bill");
const Transaction = require("../models/Transaction");

const getBills = async (req, res) => {
  try {
    const { workspace, status } = req.query;
    const filter = { userId: req.user.id };
    if (workspace) filter.workspace = workspace;
    if (status) filter.status = status;
    const bills = await Bill.find(filter).sort({ dueDate: 1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBill = async (req, res) => {
  try {
    const bill = await Bill.create({ ...req.body, userId: req.user.id });

    // If bill is created directly as paid, record transaction
    if (bill.status === "paid") {
      try {
        await Transaction.create({
          userId: req.user.id,
          title: `Bill Payment - ${bill.name}`,
          type: "expense",
          amount: Number(bill.amount) || 0,
          category: bill.category || "Bills & Utilities",
          date: new Date(),
          paymentMethod: bill.account || "UPI / Bharat BillPay",
          module: bill.workspace || "personal",
          status: "Completed",
          notes: `BBPS Utility Payment for ${bill.name} (${bill.frequency || "monthly"})`,
        });
      } catch (err) {
        console.error("Auto transaction create error for bill:", err);
      }
    }

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBill = async (req, res) => {
  try {
    const prevBill = await Bill.findOne({ _id: req.params.id, userId: req.user.id });
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    // If status changed to paid, create a transaction record
    if (bill.status === "paid" && prevBill?.status !== "paid") {
      try {
        await Transaction.create({
          userId: req.user.id,
          title: `Bill Payment - ${bill.name}`,
          type: "expense",
          amount: Number(bill.amount) || 0,
          category: bill.category || "Bills & Utilities",
          date: new Date(),
          paymentMethod: bill.account || "UPI / Bharat BillPay",
          module: bill.workspace || "personal",
          status: "Completed",
          notes: `BBPS Utility Payment for ${bill.name} (${bill.frequency || "monthly"})`,
        });
      } catch (err) {
        console.error("Auto transaction create error for updated bill:", err);
      }
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ message: "Bill deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBills, createBill, updateBill, deleteBill };
