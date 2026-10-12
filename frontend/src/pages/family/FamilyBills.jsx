import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ReceiptIndianRupee,
  X,
  Check,
  Clock,
  AlertTriangle,
  Users,
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
  Wallet,
  Building2,
  QrCode,
  Layers,
  ChevronRight,
} from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

// BBPS Categories (Google Pay / Paytm Style)
const BBPS_CATEGORIES = [
  { id: "Electricity", name: "Electricity", icon: Zap, gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500/10 text-amber-600", border: "border-amber-200" },
  { id: "Internet & Wifi", name: "Broadband & Fiber", icon: Wifi, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10 text-blue-600", border: "border-blue-200" },
  { id: "Mobile Postpaid", name: "Mobile Postpaid", icon: Smartphone, gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500/10 text-purple-600", border: "border-purple-200" },
  { id: "Gas", name: "Piped Gas & LPG", icon: Flame, gradient: "from-orange-500 to-orange-600", bg: "bg-orange-500/10 text-orange-600", border: "border-orange-200" },
  { id: "Water", name: "Water Bill", icon: Droplets, gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/10 text-cyan-600", border: "border-cyan-200" },
  { id: "DTH & Cable", name: "DTH & Cable TV", icon: Tv, gradient: "from-indigo-500 to-indigo-600", bg: "bg-indigo-500/10 text-indigo-600", border: "border-indigo-200" },
  { id: "Rent & Maintenance", name: "Rent & Society", icon: Home, gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10 text-emerald-600", border: "border-emerald-200" },
  { id: "Credit Card", name: "Credit Card Bill", icon: CreditCard, gradient: "from-rose-500 to-rose-600", bg: "bg-rose-500/10 text-rose-600", border: "border-rose-200" },
  { id: "FASTag", name: "FASTag Recharge", icon: Car, gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-500/10 text-yellow-600", border: "border-yellow-200" },
  { id: "Insurance", name: "Insurance Premium", icon: ShieldCheck, gradient: "from-teal-500 to-teal-600", bg: "bg-teal-500/10 text-teal-600", border: "border-teal-200" },
  { id: "School Fees", name: "Education & Fees", icon: GraduationCap, gradient: "from-sky-500 to-sky-600", bg: "bg-sky-500/10 text-sky-600", border: "border-sky-200" },
  { id: "House Help", name: "House Help & Cook", icon: Users, gradient: "from-pink-500 to-pink-600", bg: "bg-pink-500/10 text-pink-600", border: "border-pink-200" },
];

const POPULAR_BILLERS = {
  Electricity: [
    { name: "Adani Electricity Mumbai", idLabel: "Consumer Number (9 digits)", sampleAmount: 1850, sampleId: "102938475" },
    { name: "Tata Power - Mumbai / Delhi", idLabel: "Consumer Number (12 digits)", sampleAmount: 2420, sampleId: "900018273645" },
    { name: "BESCOM (Bengaluru)", idLabel: "Account ID / Consumer ID", sampleAmount: 1450, sampleId: "847291039" },
    { name: "BSES Rajdhani Power Limited", idLabel: "CA Number (9 digits)", sampleAmount: 2100, sampleId: "150928374" },
    { name: "BSES Yamuna Power Limited", idLabel: "CA Number (9 digits)", sampleAmount: 1980, sampleId: "140827163" },
    { name: "Mahavitaran (MSEDCL)", idLabel: "Consumer Number (12 digits)", sampleAmount: 1650, sampleId: "019283746501" },
    { name: "Torrent Power (Ahmedabad/Surat)", idLabel: "Service Number", sampleAmount: 2300, sampleId: "7483920" },
    { name: "UPPCL (Urban / Rural)", idLabel: "Account Number (10 digits)", sampleAmount: 1750, sampleId: "5948372615" },
  ],
  "Internet & Wifi": [
    { name: "JioFiber / AirFiber", idLabel: "Service ID / Registered Mobile", sampleAmount: 1179, sampleId: "9820098200" },
    { name: "Airtel Xstream Fiber", idLabel: "Landline No. with STD Code", sampleAmount: 999, sampleId: "0222837465" },
    { name: "ACT Fibernet", idLabel: "User ID / Account Number", sampleAmount: 1049, sampleId: "ACT928374" },
    { name: "Tata Play Fiber", idLabel: "Subscriber ID", sampleAmount: 1150, sampleId: "TPF839201" },
    { name: "Hathway Broadband", idLabel: "Account Number", sampleAmount: 849, sampleId: "HW748392" },
    { name: "BSNL FTTH", idLabel: "Customer ID / Telephone No", sampleAmount: 799, sampleId: "0802345678" },
  ],
  "Mobile Postpaid": [
    { name: "Jio Postpaid Plus", idLabel: "Mobile Number (10 digits)", sampleAmount: 499, sampleId: "9876543210" },
    { name: "Airtel Postpaid", idLabel: "Mobile Number (10 digits)", sampleAmount: 599, sampleId: "9811122233" },
    { name: "Vodafone Idea (Vi) Postpaid", idLabel: "Mobile Number (10 digits)", sampleAmount: 451, sampleId: "9822233344" },
    { name: "BSNL Mobile Postpaid", idLabel: "Mobile Number", sampleAmount: 399, sampleId: "9412345678" },
  ],
  Gas: [
    { name: "Indane Gas (LPG Cylinder)", idLabel: "LPG ID / Registered Mobile", sampleAmount: 903, sampleId: "7500123456789012" },
    { name: "Bharat Gas (BPCL)", idLabel: "Consumer Number / LPG ID", sampleAmount: 903, sampleId: "6400123456789012" },
    { name: "HP Gas (HPCL)", idLabel: "Consumer Number / LPG ID", sampleAmount: 903, sampleId: "8300123456789012" },
    { name: "Indraprastha Gas Limited (IGL)", idLabel: "BP Number (10 digits)", sampleAmount: 1250, sampleId: "4000123456" },
    { name: "Mahanagar Gas Limited (MGL)", idLabel: "CA Number", sampleAmount: 1180, sampleId: "3000987654" },
    { name: "Gujarat Gas Limited", idLabel: "Customer ID", sampleAmount: 1320, sampleId: "GG789012" },
  ],
  Water: [
    { name: "Delhi Jal Board (DJB)", idLabel: "K No. (10 digits)", sampleAmount: 620, sampleId: "2938475610" },
    { name: "Bangalore Water Supply (BWSSB)", idLabel: "Consumer RR Number", sampleAmount: 480, sampleId: "W-384920" },
    { name: "Municipal Corp of Greater Mumbai", idLabel: "CCN Number", sampleAmount: 750, sampleId: "MCGM839201" },
    { name: "Hyderabad Metro Water (HMWSSB)", idLabel: "CAN Number", sampleAmount: 530, sampleId: "CAN584930" },
  ],
  "DTH & Cable": [
    { name: "Tata Play (Tata Sky)", idLabel: "Subscriber ID / Mobile No", sampleAmount: 450, sampleId: "1092837465" },
    { name: "Airtel Digital TV", idLabel: "Customer ID (10 digits)", sampleAmount: 480, sampleId: "3001928374" },
    { name: "Dish TV", idLabel: "Viewing Card (VC) Number", sampleAmount: 390, sampleId: "01526374859" },
    { name: "Sun Direct", idLabel: "Smart Card Number", sampleAmount: 350, sampleId: "7483920192" },
  ],
  "Rent & Maintenance": [
    { name: "House / Flat Rent Payment", idLabel: "Landlord UPI ID / Mobile", sampleAmount: 25000, sampleId: "landlord@upi" },
    { name: "Apartment Society Maintenance", idLabel: "Flat No. / Society Name", sampleAmount: 3500, sampleId: "Flat-402 Palm Heights" },
  ],
  "Credit Card": [
    { name: "HDFC Bank Credit Card", idLabel: "Last 4 digits of Card", sampleAmount: 8500, sampleId: "4829" },
    { name: "SBI Card", idLabel: "Last 4 digits of Card", sampleAmount: 6400, sampleId: "7392" },
    { name: "ICICI Bank Credit Card", idLabel: "Last 4 digits of Card", sampleAmount: 9200, sampleId: "1049" },
    { name: "Axis Bank Credit Card", idLabel: "Last 4 digits of Card", sampleAmount: 7100, sampleId: "8492" },
  ],
  FASTag: [
    { name: "Paytm Payments Bank FASTag", idLabel: "Vehicle Number (e.g. MH02AB1234)", sampleAmount: 1000, sampleId: "MH02EZ9081" },
    { name: "ICICI Bank FASTag", idLabel: "Vehicle Number (e.g. DL01AB1234)", sampleAmount: 1000, sampleId: "DL01CQ3482" },
    { name: "SBI FASTag", idLabel: "Vehicle Number", sampleAmount: 1000, sampleId: "KA05MK9921" },
    { name: "HDFC Bank FASTag", idLabel: "Vehicle Number", sampleAmount: 1000, sampleId: "GJ01AB7733" },
  ],
  Insurance: [
    { name: "Life Insurance Corp (LIC)", idLabel: "Policy Number (9 digits)", sampleAmount: 12500, sampleId: "894729103" },
    { name: "HDFC Life Insurance", idLabel: "Policy Number", sampleAmount: 8900, sampleId: "19283746" },
    { name: "ICICI Prudential Life", idLabel: "Policy Number", sampleAmount: 9500, sampleId: "28374659" },
    { name: "Star Health Insurance", idLabel: "Policy Number", sampleAmount: 14200, sampleId: "SH9283746" },
  ],
  "School Fees": [
    { name: "School / College Tuition Fee", idLabel: "Student Admission / Roll No", sampleAmount: 15000, sampleId: "STU-2026-89" },
    { name: "Coaching / Daycare Fee", idLabel: "Student ID", sampleAmount: 6000, sampleId: "COACH-482" },
  ],
  "House Help": [
    { name: "House Maid / Cook Salary", idLabel: "Name / UPI ID", sampleAmount: 6500, sampleId: "maid@upi" },
    { name: "Driver / Security Staff", idLabel: "Name / UPI ID", sampleAmount: 12000, sampleId: "driver@upi" },
  ],
};

const PAYMENT_METHODS = [
  { id: "gpay", name: "Google Pay UPI", tag: "@okaxis / @okhdfc", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "paytm", name: "Paytm UPI & Wallet", tag: "@paytm", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "phonepe", name: "PhonePe UPI", tag: "@ybl / @ibl", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "family_pool", name: "Family Shared Pool", tag: "Joint HDFC Pool", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "autodebit", name: "Bank Auto-Debit (e-NACH)", tag: "Mandate Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const FREQUENCIES = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
  { id: "once", label: "One-Time" },
];

const statusConfig = {
  upcoming: { label: "Upcoming", color: "bg-blue-50 text-blue-600", icon: Clock },
  due: { label: "Due Soon", color: "bg-amber-50 text-amber-600", icon: AlertTriangle },
  paid: { label: "Paid", color: "bg-emerald-50 text-emerald-600", icon: Check },
  overdue: { label: "Overdue", color: "bg-rose-50 text-rose-600", icon: AlertTriangle },
};

export default function FamilyBills() {
  const [bills, setBills] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteBillId, setDeleteBillId] = useState(null);
  const [filter, setFilter] = useState("all");

  // Modal Mode: "bbps" (GPay/Paytm style) or "custom" (Manual bill)
  const [modalMode, setModalMode] = useState("bbps");
  
  // GPay/Paytm flow steps: 1 = Biller Selection, 2 = Consumer ID & Fetch, 3 = Confirm & Pay
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
    category: "Electricity",
    dueDate: "",
    frequency: "monthly",
    assignedTo: "All",
    reminder: true,
    autopay: false,
    consumerNumber: "",
    paymentMethod: "gpay",
  });

  useEffect(() => {
    loadBills();
    loadFamilyMembers();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/bills?workspace=family`, { headers: headers() });
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Family bills load error:", err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const res = await fetch(`${API}/family/members`, { headers: headers() });
      const data = await res.json();
      setFamilyMembers(Array.isArray(data) ? data : []);
    } catch {
      setFamilyMembers([]);
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
      assignedTo: "All",
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
      category: bill.category || "Electricity",
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
      frequency: bill.frequency || "monthly",
      assignedTo: bill.assignedTo || "All",
      reminder: bill.reminder !== undefined ? bill.reminder : true,
      autopay: bill.autopay || false,
      consumerNumber: bill.account || "",
      paymentMethod: "gpay",
    });
    setShowForm(true);
  };

  // Step 1: Select Biller
  const handleSelectBiller = (biller, catId) => {
    setSelectedBiller(biller);
    setSelectedCategory(catId);
    setConsumerId(biller.sampleId || "");
    setBbpsStep(2);
  };

  // Step 2: Simulate Fetching Bill from BBPS Server (GPay/Paytm Flow)
  const handleFetchBill = () => {
    if (!consumerId) return;
    setIsFetchingBill(true);
    setTimeout(() => {
      setIsFetchingBill(false);
      const randomOffset = Math.floor(Math.random() * 150) - 75;
      const calcAmount = Math.max(100, (selectedBiller?.sampleAmount || 1200) + randomOffset);
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 14);

      const billDetails = {
        consumerName: "Family Household Account",
        billNumber: `BBPS-${Math.floor(10000000 + Math.random() * 90000000)}`,
        billDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
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
    }, 650);
  };

  const handleDateShortcut = (type) => {
    const now = new Date();
    let target = new Date();
    if (type === "today") {
      target = now;
    } else if (type === "7days") {
      target.setDate(now.getDate() + 7);
    } else if (type === "monthend") {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === "nextmonth1st") {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    setForm((prev) => ({ ...prev, dueDate: target.toISOString().split("T")[0] }));
  };

  const handleSubmit = async (e, forcePaid = false) => {
    if (e) e.preventDefault();
    try {
      const isPaid = forcePaid || (modalMode === "bbps" && bbpsStep === 3);
      const url = editItem ? `${API}/bills/${editItem._id}` : `${API}/bills`;
      await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          workspace: "family",
          account: form.consumerNumber || form.paymentMethod || "UPI",
          status: isPaid ? "paid" : form.status || "upcoming",
        }),
      });
      setShowForm(false);
      setEditItem(null);
      loadBills();
    } catch (err) {
      console.error("Save family bill error:", err);
    }
  };

  const markPaid = async (id) => {
    try {
      await fetch(`${API}/bills/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ status: "paid" }),
      });
      loadBills();
    } catch (err) {
      console.error("Mark bill paid error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteBillId) return;
    try {
      await fetch(`${API}/bills/${deleteBillId}`, { method: "DELETE", headers: headers() });
      setDeleteBillId(null);
      loadBills();
    } catch (err) {
      console.error("Delete bill error:", err);
    }
  };

  // Filter billers based on category and search query
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
  const totalUnpaid = bills.filter((b) => b.status !== "paid").reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1F2937]">Family Bills & Recharges</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> Bharat BillPay (BBPS)
            </span>
          </div>
          <p className="text-sm text-[#6B7280] mt-0.5">Pay electricity, broadband, gas, rent, and household utilities seamlessly</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-lg shadow-[#005B4F]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add / Pay Bill (GPay Style)
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Pending Bills</p>
          <p className="text-2xl font-bold text-amber-600 mt-0.5">{formatCurrency(totalUnpaid)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "upcoming", "due", "paid", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === status ? "bg-[#005B4F] text-white shadow-sm" : "bg-[#F4F6F8] text-[#6B7280] hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-44 bg-white rounded-2xl animate-pulse border border-gray-100" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <ReceiptIndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No family bills found</p>
            <p className="text-xs text-gray-400 mt-1">Tap 'Add / Pay Bill' to fetch electricity, fiber, gas, or recharge bills</p>
          </div>
        ) : (
          filtered.map((bill) => {
            const sc = statusConfig[bill.status] || statusConfig.upcoming;
            const StatusIcon = sc.icon;
            const catObj = BBPS_CATEGORIES.find((c) => c.id === bill.category) || BBPS_CATEGORIES[0];
            const CategoryIcon = catObj.icon;

            return (
              <div
                key={bill._id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(bill)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] transition-colors cursor-pointer"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteBillId(bill._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-2xl ${catObj.bg} flex items-center justify-center shrink-0 shadow-xs`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1F2937] leading-tight">{bill.name}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {bill.category} · {bill.frequency ? bill.frequency.charAt(0).toUpperCase() + bill.frequency.slice(1) : "Monthly"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xl font-extrabold text-[#1F2937] my-2">{formatCurrency(bill.amount)}</p>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      Due: {new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {bill.assignedTo && bill.assignedTo !== "All" && (
                      <span className="flex items-center gap-1 text-[#005B4F] font-medium">
                        <Users className="w-3 h-3" /> {bill.assignedTo}
                      </span>
                    )}
                  </div>
                </div>

                {bill.status !== "paid" && (
                  <button
                    onClick={() => markPaid(bill._id)}
                    className="mt-4 w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Pay Now via UPI / Mark Paid
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Redesigned Google Pay & Paytm Style BBPS Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with BBPS & GPay/Paytm Branding */}
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
                      {editItem ? "Edit Family Bill" : "Pay & Add Bills (BBPS)"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      GPay & Paytm BBPS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {modalMode === "bbps" ? "Official Bharat BillPay utility settlement hub" : "Custom manual bill entry"}
                  </p>
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
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalMode === "bbps" && !editItem ? (
                <>
                  {/* STEP 1: GPay / Paytm Category Hub & Search */}
                  {bbpsStep === 1 && (
                    <div className="space-y-5">
                      {/* Search Bar */}
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

                      {/* GPay/Paytm Category Squircles */}
                      {!billerSearch && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Utility & Recharge Categories
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
                                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center mb-1.5 shadow-sm`}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-700 leading-tight">{cat.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Popular Billers List */}
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
                          {filteredBillers.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="text-sm font-medium">No biller found matching "{billerSearch}"</p>
                              <button
                                onClick={() => setModalMode("custom")}
                                className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                              >
                                Or add as a custom bill &rarr;
                              </button>
                            </div>
                          ) : (
                            filteredBillers.map((biller) => (
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
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Enter Consumer / Account Number */}
                  {bbpsStep === 2 && selectedBiller && (
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
                      {/* Biller Info Card */}
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
                        <button
                          onClick={() => setBbpsStep(1)}
                          className="text-xs text-blue-600 font-bold hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      {/* Consumer ID Input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>{selectedBiller.idLabel}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Check your previous bill / SMS</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={selectedBiller.idLabel}
                            value={consumerId}
                            onChange={(e) => setConsumerId(e.target.value)}
                            className="w-full h-12 px-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-600/15 transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-500" /> FinFlow securely links with BBPS to fetch the official due bill.
                        </p>
                      </div>

                      {/* Fetch Bill Action */}
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

                  {/* STEP 3: Bill Fetched & GPay/Paytm Payment Option */}
                  {bbpsStep === 3 && fetchedBillData && (
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
                      {/* Fetched Bill Overview Hero */}
                      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> BBPS Live Bill Fetched
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium">#{fetchedBillData.billNumber}</span>
                          </div>
                          <span className="text-xs text-slate-400">Due: {fetchedBillData.dueDate}</span>
                        </div>

                        <p className="text-xs text-slate-300">{selectedBiller?.name}</p>
                        <div className="flex items-baseline justify-between mt-1 mb-3">
                          <p className="text-3xl font-black text-white">{formatCurrency(form.amount)}</p>
                          <span className="text-xs text-amber-400 font-semibold">+₹{fetchedBillData.lateFee} if paid after due date</span>
                        </div>

                        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
                          <span>Consumer: {fetchedBillData.consumerName}</span>
                          <span>ID: {form.consumerNumber}</span>
                        </div>
                      </div>

                      {/* Payment Method Selector (GPay / Paytm / PhonePe / Family Pool) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>Choose Payment Method / Auto-Debit Source</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Zero Convenience Fee</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {PAYMENT_METHODS.map((pm) => {
                            const isSelected = selectedPaymentMethod === pm.id;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMethod(pm.id);
                                  setForm((prev) => ({ ...prev, paymentMethod: pm.id }));
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{pm.name}</p>
                                  <p className="text-[11px] text-slate-400">{pm.tag}</p>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recurrence & Family Assignment */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Cycle</label>
                          <select
                            value={form.frequency}
                            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-slate-50"
                          >
                            {FREQUENCIES.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Family Member</label>
                          <select
                            value={form.assignedTo}
                            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-slate-50"
                          >
                            <option value="All">All Family (Shared)</option>
                            {familyMembers.map((m) => (
                              <option key={m._id || m.name} value={m.name}>
                                {m.name} ({m.relationship || "Member"})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Auto-Debit Mandate Toggle */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">UPI Auto-Pay / Auto-Debit</p>
                              <p className="text-[11px] text-slate-500">Automatically pay on due date via {selectedPaymentMethod.toUpperCase()}</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={form.autopay}
                            onChange={(e) => setForm({ ...form, autopay: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Final Confirm Buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBbpsStep(2)}
                          className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Save & Pay via {PAYMENT_METHODS.find((p) => p.id === selectedPaymentMethod)?.name}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* CUSTOM MANUAL BILL FORM */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Bill Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bill Name / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. WiFi & Fiber, Adani Power, House Maid"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    />
                  </div>

                  {/* Amount (₹) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                      min="1"
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#005B4F]"
                    />
                  </div>

                  {/* Category & Frequency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                      >
                        {BBPS_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cycle</label>
                      <select
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      required
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    />
                    <div className="flex gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => handleDateShortcut("today")}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-600 cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateShortcut("7days")}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-600 cursor-pointer"
                      >
                        In 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateShortcut("monthend")}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-600 cursor-pointer"
                      >
                        Month End
                      </button>
                    </div>
                  </div>

                  {/* Family Assignee */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign To</label>
                    <select
                      value={form.assignedTo}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                    >
                      <option value="All">All Family (Shared)</option>
                      {familyMembers.map((m) => (
                        <option key={m._id || m.name} value={m.name}>
                          {m.name} ({m.relationship || "Member"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-6 bg-[#005B4F] hover:bg-[#004A40] text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      {editItem ? "Update Bill" : "Add Bill"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteBillId)}
        onClose={() => setDeleteBillId(null)}
        onConfirm={confirmDelete}
        title="Delete Family Bill"
        message="Are you sure you want to delete this shared family bill record?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
