import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ReceiptIndianRupee,
  X,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  Wifi,
  Smartphone,
  Flame,
  Droplets,
  Tv,
  Car,
  Home,
  CreditCard,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Calendar,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

// BBPS Categories (Google Pay / Paytm Style)
const BBPS_CATEGORIES = [
  { id: "Electricity", name: "Electricity", icon: Zap, gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500/10 text-amber-600" },
  { id: "Internet", name: "Broadband & Fiber", icon: Wifi, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10 text-blue-600" },
  { id: "Phone", name: "Mobile Postpaid", icon: Smartphone, gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500/10 text-purple-600" },
  { id: "Gas", name: "Piped Gas & LPG", icon: Flame, gradient: "from-orange-500 to-orange-600", bg: "bg-orange-500/10 text-orange-600" },
  { id: "Water", name: "Water Bill", icon: Droplets, gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/10 text-cyan-600" },
  { id: "Subscription", name: "DTH & Streaming", icon: Tv, gradient: "from-indigo-500 to-indigo-600", bg: "bg-indigo-500/10 text-indigo-600" },
  { id: "Rent", name: "Rent & Society", icon: Home, gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10 text-emerald-600" },
  { id: "Credit Card", name: "Credit Card Bill", icon: CreditCard, gradient: "from-rose-500 to-rose-600", bg: "bg-rose-500/10 text-rose-600" },
  { id: "FASTag", name: "FASTag Recharge", icon: Car, gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-500/10 text-yellow-600" },
  { id: "Insurance", name: "Insurance Premium", icon: ShieldCheck, gradient: "from-teal-500 to-teal-600", bg: "bg-teal-500/10 text-teal-600" },
];

const POPULAR_BILLERS = {
  Electricity: [
    { name: "Adani Electricity Mumbai", idLabel: "Consumer Number (9 digits)", sampleAmount: 1850, sampleId: "102938475" },
    { name: "Tata Power - Mumbai / Delhi", idLabel: "Consumer Number (12 digits)", sampleAmount: 2420, sampleId: "900018273645" },
    { name: "BESCOM (Bengaluru)", idLabel: "Account ID / Consumer ID", sampleAmount: 1450, sampleId: "847291039" },
    { name: "BSES Rajdhani Power", idLabel: "CA Number (9 digits)", sampleAmount: 2100, sampleId: "150928374" },
    { name: "Mahavitaran (MSEDCL)", idLabel: "Consumer Number (12 digits)", sampleAmount: 1650, sampleId: "019283746501" },
    { name: "Torrent Power", idLabel: "Service Number", sampleAmount: 2300, sampleId: "7483920" },
  ],
  Internet: [
    { name: "JioFiber / AirFiber", idLabel: "Service ID / Registered Mobile", sampleAmount: 1179, sampleId: "9820098200" },
    { name: "Airtel Xstream Fiber", idLabel: "Landline No. with STD Code", sampleAmount: 999, sampleId: "0222837465" },
    { name: "ACT Fibernet", idLabel: "User ID / Account Number", sampleAmount: 1049, sampleId: "ACT928374" },
    { name: "Tata Play Fiber", idLabel: "Subscriber ID", sampleAmount: 1150, sampleId: "TPF839201" },
  ],
  Phone: [
    { name: "Jio Postpaid Plus", idLabel: "Mobile Number (10 digits)", sampleAmount: 499, sampleId: "9876543210" },
    { name: "Airtel Postpaid", idLabel: "Mobile Number (10 digits)", sampleAmount: 599, sampleId: "9811122233" },
    { name: "Vodafone Idea (Vi) Postpaid", idLabel: "Mobile Number (10 digits)", sampleAmount: 451, sampleId: "9822233344" },
  ],
  Gas: [
    { name: "Indane Gas (LPG Cylinder)", idLabel: "LPG ID / Registered Mobile", sampleAmount: 903, sampleId: "7500123456789012" },
    { name: "Bharat Gas (BPCL)", idLabel: "Consumer Number / LPG ID", sampleAmount: 903, sampleId: "6400123456789012" },
    { name: "HP Gas (HPCL)", idLabel: "Consumer Number / LPG ID", sampleAmount: 903, sampleId: "8300123456789012" },
    { name: "Indraprastha Gas Limited (IGL)", idLabel: "BP Number", sampleAmount: 1250, sampleId: "4000123456" },
  ],
  Water: [
    { name: "Delhi Jal Board (DJB)", idLabel: "K No. (10 digits)", sampleAmount: 620, sampleId: "2938475610" },
    { name: "Bangalore Water Supply (BWSSB)", idLabel: "Consumer RR Number", sampleAmount: 480, sampleId: "W-384920" },
    { name: "Municipal Corp of Greater Mumbai", idLabel: "CCN Number", sampleAmount: 750, sampleId: "MCGM839201" },
  ],
  Subscription: [
    { name: "Tata Play (Tata Sky)", idLabel: "Subscriber ID / Mobile No", sampleAmount: 450, sampleId: "1092837465" },
    { name: "Airtel Digital TV", idLabel: "Customer ID (10 digits)", sampleAmount: 480, sampleId: "3001928374" },
    { name: "Netflix & Prime Subscription", idLabel: "Account Email / ID", sampleAmount: 649, sampleId: "user@netflix.com" },
  ],
  Rent: [
    { name: "House / Flat Rent Payment", idLabel: "Landlord UPI ID / Mobile", sampleAmount: 22000, sampleId: "landlord@upi" },
    { name: "Society Maintenance", idLabel: "Flat No. / Society Name", sampleAmount: 3000, sampleId: "Flat-204 Green Valley" },
  ],
  "Credit Card": [
    { name: "HDFC Bank Credit Card", idLabel: "Last 4 digits of Card", sampleAmount: 8500, sampleId: "4829" },
    { name: "SBI Card", idLabel: "Last 4 digits of Card", sampleAmount: 6400, sampleId: "7392" },
    { name: "ICICI Bank Credit Card", idLabel: "Last 4 digits of Card", sampleAmount: 9200, sampleId: "1049" },
  ],
  FASTag: [
    { name: "Paytm FASTag", idLabel: "Vehicle Number (e.g. MH02AB1234)", sampleAmount: 1000, sampleId: "MH02EZ9081" },
    { name: "ICICI Bank FASTag", idLabel: "Vehicle Number", sampleAmount: 1000, sampleId: "DL01CQ3482" },
  ],
  Insurance: [
    { name: "Life Insurance Corp (LIC)", idLabel: "Policy Number (9 digits)", sampleAmount: 12500, sampleId: "894729103" },
    { name: "HDFC Life Insurance", idLabel: "Policy Number", sampleAmount: 8900, sampleId: "19283746" },
  ],
};

const PAYMENT_METHODS = [
  { id: "gpay", name: "Google Pay UPI", tag: "@okaxis / @okhdfc" },
  { id: "paytm", name: "Paytm UPI & Wallet", tag: "@paytm" },
  { id: "phonepe", name: "PhonePe UPI", tag: "@ybl / @ibl" },
  { id: "netbanking", name: "Net Banking / Auto-Debit", tag: "Primary Bank" },
];

const FREQUENCIES = ["once", "monthly", "quarterly", "yearly"];

const statusConfig = {
  upcoming: { label: "Upcoming", color: "bg-blue-50 text-blue-600", icon: Clock },
  due: { label: "Due", color: "bg-amber-50 text-amber-600", icon: AlertTriangle },
  paid: { label: "Paid", color: "bg-emerald-50 text-emerald-600", icon: Check },
  overdue: { label: "Overdue", color: "bg-rose-50 text-rose-600", icon: AlertTriangle },
};

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filter, setFilter] = useState("all");

  // GPay/Paytm BBPS state
  const [modalMode, setModalMode] = useState("bbps");
  const [bbpsStep, setBbpsStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Electricity");
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [consumerId, setConsumerId] = useState("");
  const [billerSearch, setBillerSearch] = useState("");
  const [isFetchingBill, setIsFetchingBill] = useState(false);
  const [fetchedBillData, setFetchedBillData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("gpay");

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "Other",
    dueDate: "",
    frequency: "monthly",
    reminder: true,
    autopay: false,
    consumerNumber: "",
    paymentMethod: "gpay",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${API}/bills?workspace=personal`, { headers: headers() });
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load error:", err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setModalMode("bbps");
    setBbpsStep(1);
    setSelectedCategory("Electricity");
    setSelectedBiller(null);
    setConsumerId("");
    setBillerSearch("");
    setFetchedBillData(null);
    setSelectedPaymentMethod("gpay");
    setForm({
      name: "",
      amount: "",
      category: "Electricity",
      dueDate: new Date().toISOString().split("T")[0],
      frequency: "monthly",
      reminder: true,
      autopay: false,
      consumerNumber: "",
      paymentMethod: "gpay",
    });
    setShowForm(true);
  };

  const openEditModal = (bill) => {
    setEditItem(bill);
    setModalMode("custom");
    setForm({
      name: bill.name || "",
      amount: bill.amount || "",
      category: bill.category || "Other",
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
      frequency: bill.frequency || "monthly",
      reminder: bill.reminder !== undefined ? bill.reminder : true,
      autopay: bill.autopay || false,
      consumerNumber: bill.account || "",
      paymentMethod: "gpay",
    });
    setShowForm(true);
  };

  const handleSelectBiller = (biller, catId) => {
    setSelectedBiller(biller);
    setSelectedCategory(catId);
    setConsumerId(biller.sampleId || "");
    setBbpsStep(2);
  };

  const handleFetchBill = () => {
    if (!consumerId) return;
    setIsFetchingBill(true);
    setTimeout(() => {
      setIsFetchingBill(false);
      const randomOffset = Math.floor(Math.random() * 100) - 50;
      const calcAmount = Math.max(100, (selectedBiller?.sampleAmount || 1000) + randomOffset);
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 14);

      const billDetails = {
        consumerName: "Primary Account Holder",
        billNumber: `BBPS-${Math.floor(10000000 + Math.random() * 90000000)}`,
        dueDate: dueDateObj.toISOString().split("T")[0],
        amount: calcAmount,
        lateFee: Math.round(calcAmount * 0.05),
      };

      setFetchedBillData(billDetails);
      setForm((prev) => ({
        ...prev,
        name: selectedBiller.name,
        category: selectedCategory,
        amount: calcAmount,
        dueDate: billDetails.dueDate,
        consumerNumber: consumerId,
      }));
      setBbpsStep(3);
    }, 600);
  };

  const handleSubmit = async (e, forcePaid = false) => {
    if (e) e.preventDefault();
    try {
      const isPaid = forcePaid || (modalMode === "bbps" && bbpsStep === 3);
      const url = editItem ? `${API}/bills/${editItem._id}` : `${API}/bills`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          workspace: "personal",
          account: form.consumerNumber || form.paymentMethod || "UPI",
          status: isPaid ? "paid" : form.status || "upcoming",
        }),
      });
      if (!res.ok) {
        console.error("Save error:", await res.text());
        return;
      }
      setShowForm(false);
      setEditItem(null);
      loadData();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const markPaid = async (id) => {
    try {
      await fetch(`${API}/bills/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ status: "paid" }),
      });
      loadData();
    } catch (err) {
      console.error("Mark paid error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await fetch(`${API}/bills/${id}`, { method: "DELETE", headers: headers() });
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredBillers = Object.entries(POPULAR_BILLERS).flatMap(([cat, list]) =>
    list
      .filter((b) => {
        const matchesCat = !billerSearch ? cat === selectedCategory : true;
        const matchesQuery = billerSearch
          ? b.name.toLowerCase().includes(billerSearch.toLowerCase()) || cat.toLowerCase().includes(billerSearch.toLowerCase())
          : true;
        return matchesCat && matchesQuery;
      })
      .map((b) => ({ ...b, category: cat }))
  );

  const filtered = filter === "all" ? bills : bills.filter((b) => b.status === filter);
  const totalDue = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1F2937]">Bills & Recharges</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> Bharat BillPay
            </span>
          </div>
          <p className="text-sm text-[#6B7280] mt-0.5">Track, fetch, and pay electricity, mobile, and broadband bills</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#005B4F] to-[#004A40] text-white text-sm font-semibold rounded-xl hover:from-[#004A40] hover:to-[#003830] transition-all shadow-lg shadow-[#005B4F]/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add / Pay Bill (GPay Style)
        </button>
      </div>

      {/* Total Due Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Total Due</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalDue)}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            {bills.filter((b) => b.status !== "paid").length} pending bill{bills.filter((b) => b.status !== "paid").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "upcoming", "due", "overdue", "paid"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === s ? "bg-[#005B4F] text-white" : "bg-[#F4F6F8] text-[#6B7280] hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptIndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No bills found</p>
            <p className="text-xs text-gray-400 mt-1">Use 'Add / Pay Bill' to fetch and track your utilities</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((bill) => {
              const sc = statusConfig[bill.status] || statusConfig.upcoming;
              const StatusIcon = sc.icon;
              return (
                <div key={bill._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${sc.color} flex items-center justify-center`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{bill.name}</p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {bill.category} · {bill.frequency} · Due {new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-[#1F2937]">{formatCurrency(bill.amount)}</p>
                    {bill.status !== "paid" && (
                      <button
                        onClick={() => markPaid(bill._id)}
                        className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Pay Now / Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bill._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Google Pay & Paytm Style BBPS Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {bbpsStep > 1 && modalMode === "bbps" && !editItem && (
                  <button
                    onClick={() => setBbpsStep((s) => s - 1)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <ReceiptIndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                      {editItem ? "Edit Bill" : "Pay & Add Bills (BBPS)"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      GPay & Paytm Hub
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Official Bharat BillPay utility settlement</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!editItem && (
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("bbps");
                        setBbpsStep(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        modalMode === "bbps" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      ⚡ BBPS Hub
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode("custom")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        modalMode === "custom" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      ✏️ Custom
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalMode === "bbps" && !editItem ? (
                <>
                  {/* Step 1: Categories & Biller Selection */}
                  {bbpsStep === 1 && (
                    <div className="space-y-5">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="Search electricity board, broadband, gas, FASTag..."
                          value={billerSearch}
                          onChange={(e) => setBillerSearch(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                        />
                      </div>

                      {!billerSearch && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Utility & Recharge Categories
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                            {BBPS_CATEGORIES.map((cat) => {
                              const Icon = cat.icon;
                              const isSelected = selectedCategory === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setSelectedCategory(cat.id)}
                                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                                    isSelected
                                      ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/10"
                                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  <div
                                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center mb-1.5 shadow-sm`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[11px] font-semibold text-slate-700 leading-tight">{cat.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {billerSearch ? "Search Results" : `Popular ${selectedCategory} Billers`}
                          </p>
                          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> BBPS Verified
                          </span>
                        </div>

                        <div className="space-y-2">
                          {filteredBillers.map((biller) => (
                            <button
                              key={biller.name}
                              type="button"
                              onClick={() => handleSelectBiller(biller, biller.category)}
                              className="w-full p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-300 flex items-center justify-between transition-all group text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 font-extrabold text-sm flex items-center justify-center transition-colors">
                                  {biller.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 group-hover:text-blue-900 leading-tight">
                                    {biller.name}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5">{biller.idLabel}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">~{formatCurrency(biller.sampleAmount)}</span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Consumer ID & Fetch */}
                  {bbpsStep === 2 && selectedBiller && (
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                            {selectedBiller.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{selectedBiller.name}</p>
                            <p className="text-xs text-slate-500">{selectedCategory} · Bharat BillPay Enabled</p>
                          </div>
                        </div>
                        <button onClick={() => setBbpsStep(1)} className="text-xs text-blue-600 font-bold hover:underline">
                          Change
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">{selectedBiller.idLabel}</label>
                        <input
                          type="text"
                          placeholder={selectedBiller.idLabel}
                          value={consumerId}
                          onChange={(e) => setConsumerId(e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-600/15 transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleFetchBill}
                        disabled={!consumerId || isFetchingBill}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        {isFetchingBill ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Fetching Bill from BBPS Servers...
                          </>
                        ) : (
                          <>
                            Fetch Bill Details <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 3: Bill Fetched & Pay via GPay/Paytm */}
                  {bbpsStep === 3 && fetchedBillData && (
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> BBPS Live Bill Fetched
                          </span>
                          <span className="text-xs text-slate-400">Due: {fetchedBillData.dueDate}</span>
                        </div>

                        <p className="text-xs text-slate-300">{selectedBiller?.name}</p>
                        <p className="text-3xl font-black text-white mt-1">{formatCurrency(form.amount)}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                          {PAYMENT_METHODS.map((pm) => {
                            const isSelected = selectedPaymentMethod === pm.id;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMethod(pm.id);
                                  setForm((p) => ({ ...p, paymentMethod: pm.id }));
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{pm.name}</p>
                                  <p className="text-[10px] text-slate-400">{pm.tag}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBbpsStep(2)}
                          className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Save & Pay via {PAYMENT_METHODS.find((p) => p.id === selectedPaymentMethod)?.name}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Custom Manual Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bill Name</label>
                    <input
                      type="text"
                      placeholder="Bill Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                      min="0"
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="h-11 px-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    >
                      {BBPS_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                      className="h-11 px-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors"
                    >
                      {editItem ? "Update" : "Add"} Bill
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
