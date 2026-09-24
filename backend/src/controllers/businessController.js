const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

// Invoices CRUD
const getInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { userId: req.user.id };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query).sort({ issueDate: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      issueDate,
      dueDate,
      items,
      taxRate,
      tax,
      discount,
      status,
      notes,
    } = req.body;

    const lastInvoice = await Invoice.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    let nextNum = 1001;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/\d+/);
      if (match) nextNum = Math.max(1001, parseInt(match[0], 10) + 1);
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(4, "0")}`;

    const parsedItems = (items || []).map((item) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
    }));

    const subtotal = parsedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRateVal = taxRate !== undefined && taxRate !== "" ? Number(taxRate) : 0;
    const taxVal = taxRateVal > 0
      ? Math.round(((subtotal * taxRateVal) / 100) * 100) / 100
      : (Number(tax) || 0);
    const discountVal = Number(discount) || 0;
    const totalAmount = Math.max(0, subtotal + taxVal - discountVal);

    const invoice = await Invoice.create({
      userId: req.user.id,
      invoiceNumber,
      clientName,
      clientEmail: clientEmail || "",
      issueDate: issueDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: parsedItems,
      subtotal,
      taxRate: taxRateVal,
      tax: taxVal,
      discount: discountVal,
      totalAmount,
      status: status || "Draft",
      notes: notes || "",
    });

    if (invoice.status === "Paid") {
      const corpAccount = await Account.findOne({ userId: req.user.id, workspace: "business" });
      if (corpAccount) {
        await Account.findByIdAndUpdate(corpAccount._id, { $inc: { balance: Number(invoice.totalAmount) || 0 } });
      }

      await Transaction.create({
        userId: req.user.id,
        title: `Invoice Payment (${invoice.invoiceNumber})`,
        type: "income",
        amount: invoice.totalAmount,
        category: "Business Revenue",
        date: invoice.issueDate,
        paymentMethod: corpAccount ? (corpAccount.nickname || corpAccount.name) : "Bank Transfer",
        module: "business",
        status: "Completed",
      });
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const oldInvoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
    if (!oldInvoice) return res.status(404).json({ message: "Invoice not found" });

    let updateData = { ...req.body };
    if (updateData.items) {
      updateData.items = updateData.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
      }));
      updateData.subtotal = updateData.items.reduce((sum, item) => sum + item.amount, 0);

      const taxRateVal = updateData.taxRate !== undefined && updateData.taxRate !== "" ? Number(updateData.taxRate) : 0;
      updateData.tax = taxRateVal > 0
        ? Math.round(((updateData.subtotal * taxRateVal) / 100) * 100) / 100
        : (Number(updateData.tax) || 0);
      updateData.taxRate = taxRateVal;

      const discountVal = Number(updateData.discount) || 0;
      updateData.totalAmount = Math.max(0, updateData.subtotal + updateData.tax - discountVal);
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );

    // Sync bank account balance if status changed or amount changed on Paid invoice
    const corpAccount = await Account.findOne({ userId: req.user.id, workspace: "business" });
    if (corpAccount) {
      if (oldInvoice.status !== "Paid" && invoice.status === "Paid") {
        await Account.findByIdAndUpdate(corpAccount._id, { $inc: { balance: Number(invoice.totalAmount) || 0 } });
      } else if (oldInvoice.status === "Paid" && invoice.status !== "Paid") {
        await Account.findByIdAndUpdate(corpAccount._id, { $inc: { balance: -Number(oldInvoice.totalAmount) || 0 } });
      } else if (oldInvoice.status === "Paid" && invoice.status === "Paid" && oldInvoice.totalAmount !== invoice.totalAmount) {
        const diff = (Number(invoice.totalAmount) || 0) - (Number(oldInvoice.totalAmount) || 0);
        await Account.findByIdAndUpdate(corpAccount._id, { $inc: { balance: diff } });
      }
    }

    // Sync status change with business revenue transactions
    if (invoice.status === "Paid") {
      const existingTx = await Transaction.findOne({
        userId: req.user.id,
        title: `Invoice Payment (${invoice.invoiceNumber})`,
      });
      if (!existingTx) {
        await Transaction.create({
          userId: req.user.id,
          title: `Invoice Payment (${invoice.invoiceNumber})`,
          type: "income",
          amount: invoice.totalAmount,
          category: "Business Revenue",
          date: invoice.issueDate || new Date(),
          paymentMethod: corpAccount ? (corpAccount.nickname || corpAccount.name) : "Bank Transfer",
          module: "business",
          status: "Completed",
        });
      } else {
        await Transaction.updateOne(
          { _id: existingTx._id },
          { amount: invoice.totalAmount }
        );
      }
    } else {
      await Transaction.deleteMany({
        userId: req.user.id,
        title: `Invoice Payment (${invoice.invoiceNumber})`,
      });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (invoice.status === "Paid") {
      const corpAccount = await Account.findOne({ userId: req.user.id, workspace: "business" });
      if (corpAccount) {
        await Account.findByIdAndUpdate(corpAccount._id, { $inc: { balance: -Number(invoice.totalAmount) || 0 } });
      }
    }

    await Transaction.deleteMany({
      userId: req.user.id,
      title: `Invoice Payment (${invoice.invoiceNumber})`,
    });

    res.status(200).json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Profit & Loss Summary Aggregation
const getProfitLoss = async (req, res) => {
  try {
    const userId = req.user.id;

    // Paid Invoices = Revenue
    const invoices = await Invoice.find({ userId, status: "Paid" });
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Business Expenses
    const businessExpenses = await Expense.find({ userId, module: "business" });
    const totalExpenses = businessExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    res.status(200).json({
      revenue: totalRevenue || 0,
      expenses: totalExpenses || 0,
      netProfit: netProfit || 0,
      profitMargin: Number(profitMargin) || 0,
      recentInvoicesCount: invoices.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getProfitLoss,
};
