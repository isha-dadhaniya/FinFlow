import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/dashboard/StatCard";
import DataTable from "../../components/common/DataTable";
import SearchInput from "../../components/common/SearchInput";
import FilterDropdown from "../../components/common/FilterDropdown";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  fetchGroupSplits,
  createGroupSplit,
  updateGroupSplit,
  toggleSplitSettlement,
  deleteGroupSplit,
  fetchFamilyMembers,
} from "../../api/services";
import { formatINR } from "../../utils/formatCurrency";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Users,
  Check,
  X,
  Wallet,
  Clock,
  CheckCircle2,
  DollarSign,
  Calculator,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import finflowLogo from "../../assets/finflow-logo.png";

const CATEGORIES = ["Household", "Groceries", "Utilities", "Rent & Housing", "Travel & Vacation", "Events", "Other"];
const SPLIT_METHODS = ["equal", "percentage", "custom"];

export default function SharedExpenses() {
  const [splits, setSplits] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [settlementFilter, setSettlementFilter] = useState("");

  // Modals & Notifications
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSplit, setEditingSplit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Current logged in user info
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserName = user.fullName || "You";

  // Form State
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [category, setCategory] = useState("Household");
  const [paidBy, setPaidBy] = useState(currentUserName);
  const [splitType, setSplitType] = useState("equal");
  const [participants, setParticipants] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [account, setAccount] = useState("");
  const [accounts, setAccounts] = useState([]);

  // Compute all available members (Logged in user + added family members)
  const allAvailableMembers = useMemo(() => {
    const list = [{ name: currentUserName, relationship: "Self / Account Owner" }];
    if (Array.isArray(familyMembers)) {
      familyMembers.forEach((m) => {
        if (m.name && !list.some((x) => x.name.toLowerCase() === m.name.toLowerCase())) {
          list.push({
            name: m.name,
            relationship: m.relationship || "Family Member",
          });
        }
      });
    }
    return list;
  }, [familyMembers, currentUserName]);

  useEffect(() => {
    loadData();
  }, [search, categoryFilter, settlementFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const API = "http://localhost:5000/api";
      const token = localStorage.getItem("token");
      const h = { Authorization: `Bearer ${token}` };

      const [splitRes, memberRes, accRes] = await Promise.allSettled([
        fetchGroupSplits({
          search,
          category: categoryFilter,
          status: settlementFilter,
        }),
        fetchFamilyMembers(),
        fetch(`${API}/accounts?workspace=family`, { headers: h }),
      ]);

      if (splitRes.status === "fulfilled") {
        setSplits(splitRes.value.data || []);
      }

      if (memberRes.status === "fulfilled") {
        setFamilyMembers(memberRes.value.data || []);
      }

      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accData = await accRes.value.json();
        const accList = Array.isArray(accData) ? accData : [];
        setAccounts(accList);
        if (accList.length > 0) {
          setAccount((prev) => prev || accList[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load shared expenses.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingSplit(null);
    setTitle("");
    setTotalAmount("");
    setCategory("Household");
    setPaidBy(allAvailableMembers[0]?.name || currentUserName);
    setSplitType("equal");
    setPaymentMethod("Bank Transfer");
    setAccount(accounts.length > 0 ? accounts[0]._id : "");

    // Initialize participants with actual family members
    if (allAvailableMembers.length > 1) {
      const defaultParts = allAvailableMembers.map((m, idx) => ({
        name: m.name,
        amount: "",
        percentage: Math.round(100 / allAvailableMembers.length),
        isSettled: idx === 0,
      }));
      setParticipants(defaultParts);
    } else {
      setParticipants([
        { name: allAvailableMembers[0]?.name || currentUserName, amount: "", percentage: 100, isSettled: true },
      ]);
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sp) => {
    setEditingSplit(sp);
    setTitle(sp.title || "");
    setTotalAmount(sp.totalAmount || "");
    setCategory(sp.category || "Household");
    setPaidBy(sp.paidBy || currentUserName);
    setSplitType(sp.splitType || "equal");
    setPaymentMethod(sp.paymentMethod || "Bank Transfer");
    const foundAcc = accounts.find((a) => a.name === sp.account || a.nickname === sp.account || a._id === sp.account);
    setAccount(foundAcc ? foundAcc._id : (accounts.length > 0 ? accounts[0]._id : ""));
    setParticipants(
      sp.participants && sp.participants.length > 0
        ? sp.participants.map((p) => ({ ...p }))
        : [{ name: currentUserName, amount: "", percentage: 100, isSettled: true }]
    );
    setIsModalOpen(true);
  };

  // Add / Remove Participant inputs
  const handleAddParticipant = () => {
    // Pick the first unused family member
    const unused = allAvailableMembers.find(
      (m) => !participants.some((p) => p.name.toLowerCase() === m.name.toLowerCase())
    );
    const nextName = unused ? unused.name : (allAvailableMembers[0]?.name || currentUserName);

    setParticipants((prev) => [
      ...prev,
      { name: nextName, amount: "", percentage: 0, isSettled: false },
    ]);
  };

  const handleRemoveParticipant = (index) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (index, field, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setToast({ message: "Please enter an expense title.", type: "error" });
      return;
    }

    const numAmount = Number(totalAmount);
    if (!totalAmount || isNaN(numAmount) || numAmount <= 0) {
      setToast({ message: "Total amount must be greater than 0.", type: "error" });
      return;
    }

    const validParticipants = participants.filter((p) => p.name && p.name.trim() !== "");
    if (validParticipants.length === 0) {
      setToast({ message: "At least one participant is required.", type: "error" });
      return;
    }

    const isCash = paymentMethod === "Cash";
    const finalAccount = isCash
      ? null
      : (account || (accounts.length > 0 ? accounts[0]._id : null));

    const payload = {
      title: title.trim(),
      totalAmount: numAmount,
      category,
      paidBy: paidBy.trim() || currentUserName,
      splitType,
      participants: validParticipants,
      paymentMethod,
      account: finalAccount,
    };

    try {
      if (editingSplit) {
        await updateGroupSplit(editingSplit._id, payload);
        setToast({ message: "Shared expense updated!", type: "success" });
      } else {
        await createGroupSplit(payload);
        setToast({ message: "Shared expense added!", type: "success" });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setToast({ message: "Failed to save shared expense.", type: "error" });
    }
  };

  // Toggle Participant Settlement
  const handleToggleSettle = async (id, index) => {
    try {
      await toggleSplitSettlement(id, { participantIndex: index });
      setToast({ message: "Settlement status updated!", type: "success" });
      loadData();
    } catch (err) {
      setToast({ message: "Error updating settlement", type: "error" });
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGroupSplit(deleteId);
      setToast({ message: "Shared expense deleted", type: "success" });
      setDeleteId(null);
      loadData();
    } catch (err) {
      setToast({ message: "Error deleting shared expense", type: "error" });
    }
  };

  // Monthly Summaries & Member Balances
  const monthlySummary = useMemo(() => {
    const totalShared = splits.reduce((sum, s) => sum + s.totalAmount, 0);

    let totalPaid = 0;
    let totalPending = 0;
    const memberBalances = {}; // { memberName: { paid: 0, share: 0, pendingOwed: 0 } }

    const getMember = (name) => {
      const trimmed = name?.trim() || "Unknown";
      if (!memberBalances[trimmed]) {
        memberBalances[trimmed] = { paid: 0, share: 0, pendingOwed: 0 };
      }
      return memberBalances[trimmed];
    };

    splits.forEach((sp) => {
      const payerName = sp.paidBy?.trim() || currentUserName;
      const payerObj = getMember(payerName);

      // Payer fronted the full total amount
      payerObj.paid += sp.totalAmount;

      sp.participants.forEach((p) => {
        const participantName = p.name?.trim() || "Unknown";
        const partObj = getMember(participantName);

        partObj.share += p.amount;

        if (p.isSettled) {
          totalPaid += p.amount;
          if (participantName.toLowerCase() !== payerName.toLowerCase()) {
            partObj.paid += p.amount;
          }
        } else {
          totalPending += p.amount;
          partObj.pendingOwed += p.amount;
        }
      });
    });

    return { totalShared, totalPaid, totalPending, memberBalances };
  }, [splits, currentUserName]);

  // PDF Export Report
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setToast({ message: "Please allow popups to export PDF.", type: "error" });
      return;
    }

    const rowsHtml = splits
      .map(
        (sp, idx) => `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px;">${idx + 1}</td>
        <td style="padding: 10px; font-weight: bold;">${sp.title}</td>
        <td style="padding: 10px;">${sp.category}</td>
        <td style="padding: 10px;">${sp.paidBy}</td>
        <td style="padding: 10px;">${sp.splitType.toUpperCase()}</td>
        <td style="padding: 10px;">${sp.participants.map((p) => `${p.name} (${formatINR(p.amount)})`).join(", ")}</td>
        <td style="padding: 10px; font-weight: bold;">${sp.isSettled ? "Settled" : "Pending"}</td>
        <td style="padding: 10px; font-weight: bold; text-align: right;">${formatINR(sp.totalAmount)}</td>
      </tr>
    `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>FinFlow Shared Expenses Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1F2937; margin: 30px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #005B4F; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; color: #005B4F; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .card { background: #F4F6F8; padding: 12px; rounded: 8px; border: 1px solid #D9DEE3; }
            .card-label { font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: bold; }
            .card-value { font-size: 16px; font-weight: bold; color: #1F2937; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #005B4F; color: white; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FinFlow Shared Expenses Report</div>
              <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Generated on: ${new Date().toLocaleString()}</div>
            </div>
            <img src="${finflowLogo}" style="height: 65px; object-fit: contain;" />
          </div>

          <div class="summary">
            <div class="card">
              <div class="card-label">Total Shared Expenses</div>
              <div class="card-value">${formatINR(monthlySummary.totalShared)}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Settled</div>
              <div class="card-value">${formatINR(monthlySummary.totalPaid)}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Outstanding Pending</div>
              <div class="card-value">${formatINR(monthlySummary.totalPending)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Expense</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Split Method</th>
                <th>Participants Share</th>
                <th>Settlement</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Table Columns
  const columns = [
    {
      header: "Shared Expense",
      accessor: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.title}</p>
          <span className="text-xs text-[#005B4F] font-semibold">{row.category}</span>
        </div>
      ),
    },
    {
      header: "Total Cost",
      accessor: (row) => <span className="font-bold text-gray-900">₹{Number(row.totalAmount).toLocaleString()}</span>,
    },
    {
      header: "Paid By",
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-[#1F2937]">
            <span>👤</span> {row.paidBy}
          </span>
          {row.account && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-semibold text-blue-700">
              🏦 {row.account}
            </span>
          )}
          {row.paymentMethod === "Cash" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700">
              💵 Cash
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Split Method",
      accessor: (row) => (
        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-100 uppercase text-gray-700">
          {row.splitType}
        </span>
      ),
    },
    {
      header: "Participant Shares & Status",
      accessor: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {row.participants?.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleToggleSettle(row._id, idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                p.isSettled ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
              title="Click to toggle settlement"
            >
              <span>
                {p.name}: ₹{p.amount}
              </span>
              {p.isSettled && <Check className="w-3 h-3 text-emerald-700 shrink-0" />}
            </button>
          ))}
        </div>
      ),
    },
    {
      header: "Settlement",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
            row.isSettled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.isSettled ? "Completed" : "Pending"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-gray-500 hover:text-[#005B4F] cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row._id)}
            className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Shared Expenses"
        subtitle="Manage shared household expenses, calculate exact member split shares, and track payment settlements."
        badge="Family Module"
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
              <Plus className="w-4 h-4" /> Add Shared Expense
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Shared Expenses"
          value={formatINR(monthlySummary.totalShared)}
          icon={Wallet}
          color="jade"
        />
        <StatCard
          title="Settled Amount"
          value={formatINR(monthlySummary.totalPaid)}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Settlement"
          value={formatINR(monthlySummary.totalPending)}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-[20px] border border-[#D9DEE3]/60 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search expense, payer, or member..."
          />

          <div className="flex items-center gap-3 flex-wrap">
            <FilterDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              label="All Categories"
              options={CATEGORIES}
            />
            <FilterDropdown
              value={settlementFilter}
              onChange={setSettlementFilter}
              label="All Settlement Statuses"
              options={[
                { label: "Completed Settled", value: "Settled" },
                { label: "Pending Owed", value: "Pending" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={splits} loading={loading} />

      {/* Add / Edit Shared Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-[#D9DEE3] relative max-h-[90vh] overflow-y-auto animate-[scaleIn_0.15s_ease-out]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#1F2937] mb-4">
              {editingSplit ? "Edit Shared Expense" : "Add Shared Expense"}
            </h3>

            {/* Banner if user has not added any family members */}
            {familyMembers.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Only you are currently in the family.</p>
                  <p className="mt-0.5 text-amber-700">
                    To split expenses with family members, add them in the{" "}
                    <Link to="/app/family/members" className="font-bold text-[#005B4F] underline">
                      Family Members
                    </Link>{" "}
                    page.
                  </p>
                </div>
              </div>
            )}

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
                  placeholder="e.g. Monthly Rent & Utilities"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Total Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-bold text-gray-900"
                    placeholder="1200.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Paid By (Family Member)</label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    required
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white cursor-pointer"
                  >
                    {allAvailableMembers.map((m) => (
                      <option key={m.name} value={m.name}>
                        👤 {m.name} {m.relationship ? `(${m.relationship})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Split Method</label>
                  <select
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white cursor-pointer"
                  >
                    <option value="equal">Equal Split</option>
                    <option value="percentage">Percentage Split (%)</option>
                    <option value="custom">Custom Amount Split (₹)</option>
                  </select>
                </div>
              </div>

              {/* Payment Method & Bank Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      if (e.target.value === "Cash") setAccount("");
                      else if (!account && accounts.length > 0) setAccount(accounts[0].name || accounts[0].nickname || accounts[0].bankName);
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Deduct From Bank Account</label>
                  {paymentMethod === "Cash" ? (
                    <div className="w-full h-11 px-3 border border-gray-200 rounded-xl text-xs font-semibold bg-gray-50 text-gray-500 flex items-center gap-2">
                      💵 Cash — No Bank Deduction
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="w-full h-11 px-3 border border-amber-200 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 flex items-center">
                      No bank accounts added yet
                    </div>
                  ) : (
                    <select
                      value={account || (accounts[0]?._id || "")}
                      onChange={(e) => setAccount(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white cursor-pointer"
                    >
                      {accounts.map((acc) => {
                        const label = acc.nickname || acc.name || acc.bankName;
                        return (
                          <option key={acc._id} value={acc._id}>
                            🏦 {label} — ₹{Number(acc.balance || 0).toLocaleString()}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* Participants Section */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Participants Share Breakdown ({participants.length})
                  </label>
                  {participants.length < allAvailableMembers.length && (
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      className="text-xs font-bold text-[#005B4F] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Participant
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      {/* Select from added family members */}
                      <select
                        value={p.name}
                        onChange={(e) => handleParticipantChange(idx, "name", e.target.value)}
                        required
                        className="flex-1 h-9 px-2.5 border border-gray-300 rounded-lg text-xs font-bold bg-white cursor-pointer"
                      >
                        <option value="" disabled>-- Select Family Member --</option>
                        {allAvailableMembers.map((m) => (
                          <option key={m.name} value={m.name}>
                            👤 {m.name} {m.relationship ? `(${m.relationship})` : ""}
                          </option>
                        ))}
                      </select>

                      {splitType === "percentage" ? (
                        <input
                          type="number"
                          placeholder="%"
                          value={p.percentage}
                          onChange={(e) => handleParticipantChange(idx, "percentage", e.target.value)}
                          className="w-20 h-9 px-2 border border-gray-300 rounded-lg text-xs font-bold"
                        />
                      ) : splitType === "custom" ? (
                        <input
                          type="number"
                          placeholder="₹ Amount"
                          value={p.amount}
                          onChange={(e) => handleParticipantChange(idx, "amount", e.target.value)}
                          className="w-24 h-9 px-2 border border-gray-300 rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-500 px-2">Equal Share</span>
                      )}

                      <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isSettled}
                          onChange={(e) => handleParticipantChange(idx, "isSettled", e.target.checked)}
                          className="w-3.5 h-3.5 accent-[#005B4F]"
                        />
                        Settled
                      </label>

                      {participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(idx)}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
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
                  {editingSplit ? "Update Shared Expense" : "Save Shared Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Shared Expense"
        message="Are you sure you want to remove this shared family expense?"
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
