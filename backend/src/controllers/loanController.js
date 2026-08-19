const Loan = require("../models/Loan");
const Expense = require("../models/Expense");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Notification = require("../models/Notification");

// Auto-Debit Engine: Evaluates all loans and auto-debits any past-due or current-due EMIs
const processAutoDebitForLoans = async (userId, workspace) => {
  try {
    const filter = {
      userId,
      autoDebit: { $in: [true, "true"] },
      status: { $ne: "completed" },
    };
    if (workspace && workspace !== "personal") {
      filter.workspace = workspace;
    }

    const activeLoans = await Loan.find(filter);
    const now = new Date();

    for (const loan of activeLoans) {
      let modified = false;
      if (Array.isArray(loan.emiSchedule)) {
        for (let idx = 0; idx < loan.emiSchedule.length; idx++) {
          const emi = loan.emiSchedule[idx];
          const due = new Date(emi.dueDate);

          // If installment is due today or in the past, and not yet paid
          if (emi.status !== "paid" && due <= now) {
            emi.status = "paid";
            emi.paidDate = emi.dueDate || now;
            emi.paymentMethod = "Auto-Debit";
            emi.markedByUser = false;
            modified = true;

            const targetAccountName = loan.paymentAccount;

            // 1. Deduct from bank account balance
            if (targetAccountName) {
              await Account.findOneAndUpdate(
                { userId: loan.userId, name: targetAccountName },
                { $inc: { balance: -emi.amount } }
              );
            }

            // 2. Log in Transaction Ledger
            await Transaction.create({
              userId: loan.userId,
              title: `EMI Payment - ${loan.name} (#${idx + 1})`,
              type: "expense",
              amount: emi.amount,
              category: "Loan EMI",
              date: emi.dueDate || now,
              paymentMethod: targetAccountName || "Auto-Debit",
              module: loan.workspace || "personal",
              status: "Completed",
              notes: `Auto-Debited Installment #${idx + 1} of ${loan.tenure} for ${loan.name}`,
            });
          }
        }

        if (modified) {
          loan.paidEmis = loan.emiSchedule.filter((e) => e.status === "paid").length;
          loan.remainingEmis = Math.max(loan.tenure - loan.paidEmis, 0);
          loan.outstandingAmount = loan.remainingEmis * loan.emi;
          if (loan.paidEmis >= loan.tenure) {
            loan.status = "completed";
          }
          loan.markModified("emiSchedule");
          await loan.save();
        }
      }
    }
  } catch (err) {
    console.error("processAutoDebitForLoans error:", err);
  }
};

const getLoans = async (req, res) => {
  try {
    const { workspace } = req.query;

    // Run auto-debit evaluation routine on fetch
    await processAutoDebitForLoans(req.user.id, workspace);

    const filter = { userId: req.user.id };
    if (workspace) {
      if (workspace === "personal") {
        filter.workspace = { $in: ["personal", null, undefined, ""] };
      } else {
        filter.workspace = workspace;
      }
    }
    const loans = await Loan.find(filter).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLoan = async (req, res) => {
  try {
    const {
      name,
      loanType,
      lender,
      principal,
      interestRate,
      tenure,
      emi,
      startDate,
      autoDebit,
      paymentAccount,
      workspace,
    } = req.body;

    const numPrincipal = Number(principal) || 0;
    const numInterestRate = Number(interestRate) || 0;
    const numTenure = Number(tenure) || 12;
    const numEmi = Number(emi) || Math.round(numPrincipal / numTenure);

    const totalPayable = numEmi * numTenure;
    const totalInterest = Math.max(totalPayable - numPrincipal, 0);

    // Parse start date cleanly
    const start = startDate ? new Date(startDate) : new Date();
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const startDay = start.getDate();
    const now = new Date();
    const isAutoDebitEnabled = Boolean(autoDebit);

    // Generate EMI schedule
    const schedule = [];
    let initialPaidCount = 0;
    let initialDeductionTotal = 0;

    for (let i = 0; i < numTenure; i++) {
      const dueDate = new Date(startYear, startMonth + i, startDay);
      const isPastOrDue = dueDate <= now;

      if (isAutoDebitEnabled && isPastOrDue) {
        // Pre-mark past installments as paid right upon creation
        schedule.push({
          dueDate,
          paidDate: dueDate,
          amount: numEmi,
          status: "paid",
          paymentMethod: "Auto-Debit",
          markedByUser: false,
        });
        initialPaidCount++;
        initialDeductionTotal += numEmi;

        // Log single Transaction Ledger entry for past auto-debited installments
        await Transaction.create({
          userId: req.user.id,
          title: `EMI Payment - ${name || "Loan"} (#${i + 1})`,
          type: "expense",
          amount: numEmi,
          category: "Loan EMI",
          date: dueDate,
          paymentMethod: paymentAccount || "Auto-Debit",
          module: workspace || "personal",
          status: "Completed",
          notes: `Auto-Debited Installment #${i + 1} of ${numTenure} for ${name || "Loan"}`,
        });
      } else {
        schedule.push({
          dueDate,
          paidDate: null,
          amount: numEmi,
          status: "upcoming",
          markedByUser: false,
        });
      }
    }

    // Deduct initial past auto-debit sum from bank account balance if any
    if (initialDeductionTotal > 0 && paymentAccount) {
      await Account.findOneAndUpdate(
        { userId: req.user.id, name: paymentAccount },
        { $inc: { balance: -initialDeductionTotal } }
      );
    }

    const remainingEmis = numTenure - initialPaidCount;
    const outstandingAmount = remainingEmis * numEmi;

    const loan = await Loan.create({
      userId: req.user.id,
      name: name ? name.trim() : "Loan",
      loanType: loanType || "Personal Loan",
      lender: lender ? lender.trim() : "",
      principal: numPrincipal,
      interestRate: numInterestRate,
      tenure: numTenure,
      emi: numEmi,
      totalPayable,
      totalInterest,
      paidEmis: initialPaidCount,
      remainingEmis,
      outstandingAmount,
      startDate: start,
      emiDay: startDay,
      paymentAccount: paymentAccount || "",
      autoDebit: isAutoDebitEnabled,
      emiSchedule: schedule,
      status: initialPaidCount >= numTenure ? "completed" : "active",
      workspace: workspace || "personal",
    });

    // If autoDebit is NOT enabled, create an in-app notification reminder for the first upcoming EMI
    if (!isAutoDebitEnabled) {
      try {
        const nextEmi = schedule.find((e) => e.status !== "paid") || schedule[0];
        const nextDueDateStr = nextEmi?.dueDate?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        await Notification.create({
          userId: req.user.id,
          title: `🔔 EMI Payment Due Reminder`,
          message: `${loan.name} EMI installment of ₹${numEmi.toLocaleString("en-IN")} is due on ${nextDueDateStr}. Please approve payment from your bank account (${paymentAccount || "Bank"}).`,
          type: "payment_reminder",
          link: `/app/${loan.workspace}/loans-emi`,
          date: new Date(),
        });
      } catch (notifErr) {
        console.error("Failed to create loan notification reminder:", notifErr);
      }
    }

    res.status(201).json(loan);
  } catch (error) {
    console.error("createLoan error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const escapeRegex = (string) => {
  return string ? string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&") : "";
};

const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // 1. Calculate all paid deductions made for this loan
    let totalPaidDeductions = 0;
    if (Array.isArray(loan.emiSchedule)) {
      loan.emiSchedule.forEach((emi) => {
        if (emi.status === "paid") {
          totalPaidDeductions += Number(emi.amount) || 0;
        }
      });
    }

    // 2. Restore the deducted money back to the linked bank account balance
    if (totalPaidDeductions > 0 && loan.paymentAccount) {
      await Account.findOneAndUpdate(
        {
          userId: req.user.id,
          $or: [
            { name: loan.paymentAccount },
            { nickname: loan.paymentAccount },
            { bankName: loan.paymentAccount },
          ],
        },
        { $inc: { balance: totalPaidDeductions } }
      );
    }

    const escapedName = escapeRegex(loan.name);
    const loanNameRegex = new RegExp(`EMI (Auto-Debit|Payment) - ${escapedName}`, "i");
    const loanRefRegex = new RegExp(escapedName, "i");

    // 3. Delete all Transaction Ledger entries associated with this loan
    await Transaction.deleteMany({
      userId: req.user.id,
      $or: [
        { title: { $regex: loanNameRegex } },
        { category: "Loan EMI", title: { $regex: loanRefRegex } },
        { category: "Loan EMI", notes: { $regex: loanRefRegex } },
      ],
    });

    // 4. Delete all Expense Tracker entries associated with this loan
    await Expense.deleteMany({
      userId: req.user.id,
      $or: [
        { title: { $regex: loanNameRegex } },
        { category: "Loan EMI", title: { $regex: loanRefRegex } },
        { category: "Loan EMI", notes: { $regex: loanRefRegex } },
      ],
    });

    // 5. Delete all Notification reminders associated with this loan
    await Notification.deleteMany({
      userId: req.user.id,
      message: { $regex: loanRefRegex },
    });

    // 6. Delete the loan document
    await Loan.deleteOne({ _id: loan._id });

    res.json({
      message: "Loan and all associated EMI transaction records deleted, bank balance restored.",
      restoredBalance: totalPaidDeductions,
    });
  } catch (error) {
    console.error("deleteLoan error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark an EMI as paid & deduct from bank balance manually
const markEmiPaid = async (req, res) => {
  try {
    const { loanId, emiIndex } = req.params;
    const { paymentMethod, paymentProof } = req.body;

    const loan = await Loan.findOne({ _id: loanId, userId: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    const emiItem = loan.emiSchedule[parseInt(emiIndex)];
    if (!emiItem) return res.status(404).json({ message: "EMI not found" });

    emiItem.status = "paid";
    emiItem.paidDate = new Date();
    emiItem.markedByUser = true;
    if (paymentMethod) emiItem.paymentMethod = paymentMethod;
    if (paymentProof) emiItem.paymentProof = paymentProof;

    loan.paidEmis = loan.emiSchedule.filter((e) => e.status === "paid").length;
    loan.remainingEmis = Math.max(loan.tenure - loan.paidEmis, 0);
    loan.outstandingAmount = loan.remainingEmis * loan.emi;

    if (loan.paidEmis >= loan.tenure) {
      loan.status = "completed";
    }

    loan.markModified("emiSchedule");
    await loan.save();

    // 1. Deduct EMI from linked Bank Account
    const targetAccountName = loan.paymentAccount || paymentMethod;
    if (targetAccountName) {
      await Account.findOneAndUpdate(
        { userId: req.user.id, name: targetAccountName },
        { $inc: { balance: -emiItem.amount } }
      );
    }

    // 2. Record Transaction
    await Transaction.create({
      userId: req.user.id,
      title: `EMI Payment - ${loan.name} (#${parseInt(emiIndex) + 1})`,
      type: "expense",
      amount: emiItem.amount,
      category: "Loan EMI",
      date: emiItem.paidDate,
      paymentMethod: targetAccountName || "Bank Transfer",
      module: loan.workspace || "personal",
      status: "Completed",
      notes: `EMI Installment #${parseInt(emiIndex) + 1} of ${loan.tenure} for ${loan.name}`,
    });

    res.json({ message: "EMI payment processed and deducted from bank balance", loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLoans, createLoan, updateLoan, deleteLoan, markEmiPaid };
