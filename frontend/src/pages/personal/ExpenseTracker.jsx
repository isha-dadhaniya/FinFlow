import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/dashboard/StatCard";
import DataTable from "../../components/common/DataTable";
import SearchInput from "../../components/common/SearchInput";
import FilterDropdown from "../../components/common/FilterDropdown";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from "../../api/services";
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  Download,
  CreditCard,
  X,
  Paperclip,
  Eye,
  TrendingUp,
  ReceiptIndianRupee,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Landmark,
  Banknote,
  AlertCircle,
} from "lucide-react";
import finflowLogo from "../../assets/finflow-logo.png";
import { formatINR } from "../../utils/formatCurrency";

const CATEGORIES = [
  "Food",
  "Shopping",
  "Transport",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Business",
  "Travel",
  "Other",
];

const PAYMENT_METHODS = [
  "Bank Transfer",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Other",
];

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // Notifications & Modals
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, accRes] = await Promise.allSettled([
        fetchExpenses({ module: "personal" }),
        fetch(`${API}/accounts?workspace=personal`, { headers: headers() }),
      ]);

      if (expRes.status === "fulfilled") {
        setExpenses(expRes.value.data || []);
      }

      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accData = await accRes.value.json();
        setAccounts(Array.isArray(accData) ? accData : []);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to fetch expenses.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadExpensesOnly = async () => {
    try {
      const res = await fetchExpenses({ module: "personal" });
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Bank Transfer");
    const defaultAcc = accounts.length > 0 ? (accounts[0].name || accounts[0].nickname || accounts[0].bankName) : "";
    setAccount(defaultAcc);
    setNotes("");
    setReceipt("");
    setReceiptFileName("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setTitle(exp.title || "");
    setAmount(exp.amount || "");
    setCategory(exp.category || "Food");
    setDate(exp.date ? new Date(exp.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setPaymentMethod(exp.paymentMethod || "Bank Transfer");
    const defaultAcc = accounts.length > 0 ? (accounts[0].name || accounts[0].nickname || accounts[0].bankName) : "";
    const matchedAcc = accounts.find(
      (a) => a.name === exp.account || a.nickname === exp.account || a.bankName === exp.account || a._id === exp.account
    );
    setAccount(
      exp.paymentMethod === "Cash"
        ? ""
        : (matchedAcc ? (matchedAcc.name || matchedAcc.nickname || matchedAcc.bankName) : (exp.account || defaultAcc))
    );
    setNotes(exp.notes || "");
    setReceipt(exp.receipt || "");
    setReceiptFileName(exp.receipt ? "Uploaded Receipt" : "");
    setIsModalOpen(true);
  };

  // Handle Payment Method Change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === "Cash") {
      setAccount("");
    } else {
      if (!account && accounts.length > 0) {
        setAccount(accounts[0].name || accounts[0].nickname || accounts[0].bankName);
      }
    }
  };

  // Handle Receipt Upload
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "File size must be under 5MB.", type: "error" });
        return;
      }
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceipt(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setToast({ message: "Please enter an expense title.", type: "error" });
      return;
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setToast({ message: "Amount must be a positive number greater than 0.", type: "error" });
      return;
    }

    // Require bank account if payment method is not cash and accounts exist
    if (paymentMethod !== "Cash" && accounts.length > 0 && !account) {
      setToast({ message: "Please select a bank account to deduct the expense from.", type: "error" });
      return;
    }

    const payload = {
      title: title.trim(),
      amount: numAmount,
      category,
      date: new Date(date),
      paymentMethod,
      account: paymentMethod === "Cash" ? "" : account,
      notes: notes.trim(),
      receipt,
      module: "personal",
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
        setToast({ message: "Expense updated successfully!", type: "success" });
      } else {
        await createExpense(payload);
        setToast({
          message:
            paymentMethod === "Cash"
              ? "Cash expense added (Bank balance unchanged)!"
              : `Expense added & deducted from ${account}!`,
          type: "success",
        });
      }

      setIsModalOpen(false);
      loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      setToast({ message: "Failed to save expense. Please try again.", type: "error" });
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId);
      setToast({ message: "Expense deleted and balance refunded if applicable!", type: "success" });
      setDeleteId(null);
      loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      setToast({ message: "Failed to delete expense.", type: "error" });
    }
  };

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Search Filter
        if (search) {
          const s = search.toLowerCase();
          const matchTitle = exp.title?.toLowerCase().includes(s);
          const matchCat = exp.category?.toLowerCase().includes(s);
          if (!matchTitle && !matchCat) return false;
        }

        // Category Filter
        if (categoryFilter && exp.category !== categoryFilter) return false;

        // Payment Method Filter
        if (paymentFilter && exp.paymentMethod !== paymentFilter) return false;

        // Date Range Filter
        if (startDate && new Date(exp.date) < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(exp.date) > end) return false;
        }

        // Amount Range Filter
        if (minAmount && exp.amount < Number(minAmount)) return false;
        if (maxAmount && exp.amount > Number(maxAmount)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "latest") return new Date(b.date) - new Date(a.date);
        if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
        if (sortBy === "highest") return b.amount - a.amount;
        if (sortBy === "lowest") return a.amount - b.amount;
        return 0;
      });
  }, [expenses, search, categoryFilter, paymentFilter, startDate, endDate, minAmount, maxAmount, sortBy]);

  // Monthly Summary Calculations
  const summaryMetrics = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return { total: 0, count: 0, avg: 0, max: 0, min: 0 };
    }

    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = filteredExpenses.length;
    const avg = total / count;
    const amounts = filteredExpenses.map((e) => e.amount);

    return {
      total,
      count,
      avg: Math.round(avg),
      max: Math.max(...amounts),
      min: Math.min(...amounts),
    };
  }, [filteredExpenses]);

  // Category Distribution for Visual Donut
  const categoryDistribution = useMemo(() => {
    if (filteredExpenses.length === 0) return [];
    const map = {};
    filteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });

    const total = summaryMetrics.total || 1;
    return Object.keys(map)
      .map((cat) => ({
        name: cat,
        amount: map[cat],
        percentage: Math.round((map[cat] / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, summaryMetrics]);

  // Daily Expense Velocity (Bar chart data)
  const dailyExpenseTrend = useMemo(() => {
    if (filteredExpenses.length === 0) return [];
    const dateMap = {};

    filteredExpenses.forEach((exp) => {
      const dStr = new Date(exp.date).toISOString().split("T")[0];
      if (!dateMap[dStr]) {
        dateMap[dStr] = { totalAmount: 0, count: 0, rawDate: new Date(exp.date) };
      }
      dateMap[dStr].totalAmount += exp.amount;
      dateMap[dStr].count += 1;
    });

    return Object.keys(dateMap)
      .map((dStr) => ({
        date: dStr,
        displayDate: new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        totalAmount: dateMap[dStr].totalAmount,
        count: dateMap[dStr].count,
        rawDate: dateMap[dStr].rawDate,
      }))
      .sort((a, b) => a.rawDate - b.rawDate);
  }, [filteredExpenses]);

  // Donut chart CSS gradient generator
  const donutGradient = useMemo(() => {
    if (categoryDistribution.length === 0) return "#E5E7EB";
    const colors = ["#005B4F", "#D4AF37", "#3B82F6", "#8B5CF6", "#EF4444", "#10B981", "#F59E0B", "#EC4899"];
    let accumulated = 0;
    const parts = categoryDistribution.map((c, idx) => {
      const start = accumulated;
      accumulated += c.percentage;
      const end = accumulated;
      return `${colors[idx % colors.length]} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(", ")})`;
  }, [categoryDistribution]);

  // Export Filtered Records to Professional PDF
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setToast({ message: "Please allow popups to export PDF.", type: "error" });
      return;
    }

    const rowsHtml = filteredExpenses
      .map(
        (exp, idx) => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 12px; font-size: 11px; color: #6B7280;">#${idx + 1}</td>
          <td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #111827;">${exp.title}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #005B4F; font-weight: bold;">${exp.category}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #374151;">${exp.paymentMethod}${exp.account && exp.paymentMethod !== "Cash" ? ` (${exp.account})` : ""}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #6B7280;">${new Date(exp.date).toLocaleDateString()}</td>
          <td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #111827; text-align: right;">${formatINR(exp.amount)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FinFlow Personal Expense Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #111827; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #005B4F; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 800; color: #005B4F; }
            .meta { font-size: 11px; color: #6B7280; }
            .summary { display: flex; gap: 20px; margin-bottom: 25px; background: #F9FAFB; padding: 15px; border-radius: 12px; }
            .sum-item { flex: 1; }
            .sum-title { font-size: 10px; text-transform: uppercase; color: #6B7280; font-weight: bold; }
            .sum-val { font-size: 16px; font-weight: bold; color: #111827; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 10px 12px; background: #005B4F; color: #ffffff; font-size: 11px; text-transform: uppercase; }
            .footer { margin-top: 30px; font-size: 10px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FinFlow Expense Statement</div>
              <div class="meta">Personal Finance Module &bull; Comprehensive Spending Audit</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Generated on: <strong>${new Date().toLocaleString()}</strong></div>
              <div class="meta">Records Count: <strong>${filteredExpenses.length}</strong></div>
            </div>
          </div>

          <div class="summary">
            <div class="sum-item">
              <div class="sum-title">Total Spending</div>
              <div class="sum-val">${formatINR(summaryMetrics.total)}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Average Expense</div>
              <div class="sum-val">${formatINR(summaryMetrics.avg)}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Largest Expense</div>
              <div class="sum-val">${formatINR(summaryMetrics.max)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Payment / Account</th>
                <th>Date</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Generated securely by FinFlow Financial Suite &bull; All calculations verified
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Table Columns
  const columns = [
    {
      header: "Expense Title",
      accessor: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.title}</p>
          {row.notes && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: "Category",
      accessor: (row) => (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#005B4F]/10 text-[#005B4F]">
          {row.category}
        </span>
      ),
    },
    {
      header: "Payment & Account",
      accessor: (row) => {
        const isCash = (row.paymentMethod || "").toLowerCase() === "cash";
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-800">{row.paymentMethod}</span>
            </div>
            {isCash ? (
              <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                💵 Physical Cash
              </span>
            ) : row.account ? (
              <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                <Landmark className="w-3 h-3 text-emerald-600" />
                {row.account}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">Direct Payment</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Date",
      accessor: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      header: "Receipt",
      accessor: (row) =>
        row.receipt ? (
          <button
            onClick={() => setViewingReceipt(row.receipt)}
            className="flex items-center gap-1 text-xs font-bold text-[#005B4F] hover:underline cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5" /> View
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      header: "Amount",
      accessor: (row) => (
        <span className="font-extrabold text-[#1F2937]">{formatINR(row.amount)}</span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-gray-500 hover:text-[#005B4F] transition-colors cursor-pointer"
            title="Edit Expense"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row._id)}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete Expense"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Expense Tracker"
        subtitle="Track, categorize, analyze, and manage your personal spending."
        actionButton={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] border border-[#D9DEE3] text-[#1F2937] font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#005B4F]" /> Export PDF
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#005B4F] text-white font-semibold text-xs shadow-md hover:bg-[#004A40] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        }
      />

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Expenses"
          value={formatINR(summaryMetrics.total)}
          icon={ReceiptIndianRupee}
          color="jade"
        />
        <StatCard
          title="Transactions"
          value={summaryMetrics.count}
          icon={CreditCard}
          color="graphite"
        />
      </div>

      {/* Dynamic Analytics Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category-wise Distribution (Donut Chart) */}
        <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <h3 className="text-base font-bold text-[#1F2937]">Category Distribution</h3>
          {categoryDistribution.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No category data available.</p>
          ) : (
            <div className="flex flex-col items-center gap-5">
              {/* Donut Visual */}
              <div
                style={{ background: donutGradient }}
                className="w-36 h-36 rounded-full relative flex items-center justify-center shadow-inner shrink-0"
              >
                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-xs text-center p-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                  <span className="text-xs font-extrabold text-gray-900 leading-tight">
                    {formatINR(summaryMetrics.total)}
                  </span>
                </div>
              </div>

              {/* Legend & Amounts */}
              <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                {categoryDistribution.map((cat, idx) => {
                  const colors = ["#005B4F", "#D4AF37", "#3B82F6", "#8B5CF6", "#EF4444", "#10B981", "#F59E0B", "#EC4899"];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-gray-700">{cat.name}</span>
                      </div>
                      <div className="font-bold text-gray-900">
                        {formatINR(cat.amount)} <span className="text-gray-400 font-normal">({cat.percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Expense Trend Velocity (Aggregated by Date) */}
        <div className="lg:col-span-2 bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1F2937]">Expense Velocity Trend</h3>
            <span className="text-xs font-bold text-[#005B4F] bg-[#005B4F]/10 px-2.5 py-1 rounded-full">
              Daily Aggregated
            </span>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 px-2 border-b border-gray-100">
            {dailyExpenseTrend.length === 0 ? (
              <p className="text-xs text-gray-400 w-full text-center py-10">No daily expense trend recorded.</p>
            ) : (
              dailyExpenseTrend.slice(-12).map((item, idx) => {
                const maxDaily = Math.max(...dailyExpenseTrend.map((d) => d.totalAmount), 1);
                const height = Math.round((item.totalAmount / maxDaily) * 120);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-[#2B3138] text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-xl z-20 whitespace-nowrap">
                      <span>{item.count} Record{item.count > 1 ? "s" : ""}</span>
                      <span>{formatINR(item.totalAmount)}</span>
                    </div>
                    <div
                      style={{ height: `${Math.max(height, 14)}px` }}
                      className="w-full max-w-[28px] bg-[#005B4F] hover:bg-[#D4AF37] rounded-t-lg transition-all duration-300"
                    />
                    <span className="text-[10px] font-bold text-gray-500 mt-2 truncate w-full text-center">
                      {item.displayDate}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Advanced Multi-Filter & Search Bar */}
      <div className="bg-white p-5 rounded-[20px] border border-[#D9DEE3]/60 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title or category..."
          />

          <div className="flex items-center gap-3 flex-wrap">
            <FilterDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              label="All Categories"
              options={CATEGORIES}
            />

            <FilterDropdown
              value={paymentFilter}
              onChange={setPaymentFilter}
              label="All Payment Methods"
              options={PAYMENT_METHODS}
            />

            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-white border border-[#D9DEE3] rounded-[12px] px-3 h-10">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#1F2937] outline-none cursor-pointer"
              >
                <option value="latest">Sort: Latest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="highest">Sort: Highest Amount</option>
                <option value="lowest">Sort: Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date & Amount Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 px-3 border border-[#D9DEE3] rounded-xl text-xs text-gray-800"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-3 border border-[#D9DEE3] rounded-xl text-xs text-gray-800"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">Min Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full h-9 px-3 border border-[#D9DEE3] rounded-xl text-xs text-gray-800"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">Max Amount (₹)</label>
            <input
              type="number"
              placeholder="10000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full h-9 px-3 border border-[#D9DEE3] rounded-xl text-xs text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        loading={loading}
        emptyTitle="No expenses found"
        emptyDescription="Try adjusting your filters or add a new expense."
        actionButton={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#005B4F] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Add Expense
          </button>
        }
      />

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-[#D9DEE3] relative animate-[scaleIn_0.15s_ease-out]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#1F2937] mb-4">
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Expense Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm"
                  placeholder="e.g. Office Grocery Shopping"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-bold"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm === "Cash" ? "💵 Cash" : pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bank Account Selector / Cash Lock Indicator */}
              <div>
                {paymentMethod === "Cash" ? (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="text-lg select-none">💵</span>
                    <div>
                      <p className="text-xs font-bold text-amber-900">Physical Cash (No Bank Account Deducted)</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Cash expenses are tracked in your total spending without deducting from your bank balance.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Deduct From Bank Account <span className="text-red-500">*</span>
                    </label>
                    {accounts.length === 0 ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>No bank accounts found. Please add a bank account first.</span>
                      </div>
                    ) : (
                      <>
                        <select
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                          required
                          className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-medium bg-white"
                        >
                          <option value="" disabled>-- Select Bank Account to Deduct --</option>
                          {accounts.map((acc) => {
                            const accName = acc.name || acc.nickname || acc.bankName;
                            const maskedNum = acc.accountNumber ? `•••• ${acc.accountNumber.slice(-4)}` : "";
                            return (
                              <option key={acc._id} value={accName}>
                                🏦 {accName} {maskedNum ? `(${maskedNum})` : ""}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                          <span>✓</span>
                          <span>
                            ₹{Number(amount || 0).toLocaleString()} will be automatically subtracted from this bank balance.
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm h-16"
                  placeholder="Additional context or remarks..."
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Receipt Attachment (Optional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleReceiptUpload}
                    className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#005B4F]/10 file:text-[#005B4F] hover:file:bg-[#005B4F]/20 cursor-pointer"
                  />
                  {receipt && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceipt("");
                        setReceiptFileName("");
                      }}
                      className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#005B4F] hover:bg-[#004A40] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingExpense ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-[#D9DEE3] relative">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#1F2937] mb-4">Receipt Attachment Preview</h3>
            <div className="flex items-center justify-center max-h-96 overflow-auto">
              {viewingReceipt.startsWith("data:image") ? (
                <img src={viewingReceipt} alt="Receipt" className="max-h-80 object-contain rounded-xl" />
              ) : (
                <a
                  href={viewingReceipt}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#005B4F] font-bold underline"
                >
                  Open PDF Receipt Document
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? If it was paid via a bank account, the balance will be refunded."
      />

      {/* Toast Feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
