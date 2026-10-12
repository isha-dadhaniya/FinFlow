import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  FolderKanban,
  Trash2,
  Edit2,
  X,
  Calendar,
  IndianRupee,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Building2,
  ChevronDown,
  ChevronUp,
  Search,
  PieChart,
  Layers,
  ArrowRight,
} from "lucide-react";
import ConfirmModal, { AlertModal } from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (a) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);

const statusBadges = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  completed: "bg-blue-50 text-blue-700 border-blue-200/80",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-200/80",
};

const EXPENSE_CATEGORIES = [
  { name: "General", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Labour", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Materials", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "Travel", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { name: "Software", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { name: "Equipment", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Consulting", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { name: "Miscellaneous", color: "bg-gray-50 text-gray-700 border-gray-200" },
];

const getCategoryBadgeClass = (categoryName) => {
  const found = EXPENSE_CATEGORIES.find((c) => c.name.toLowerCase() === (categoryName || "").toLowerCase());
  return found ? found.color : "bg-gray-50 text-gray-700 border-gray-200";
};

const formatDateInput = (d) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const formatDateDisplay = (d) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Expanded inline expenses map: { [projectId]: boolean }
  const [expandedCards, setExpandedCards] = useState({});

  // Project Modal State (Create / Edit)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: "",
    client: "",
    budget: "",
    startDate: "",
    endDate: "",
    status: "active",
    hasInitialExpense: false,
    initialExpenseTitle: "",
    initialExpenseAmount: "",
    initialExpenseCategory: "General",
  });

  // Expense Modal State (Add expense to project)
  const [expenseModalProject, setExpenseModalProject] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "General",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Full Details Drawer / Modal
  const [detailProject, setDetailProject] = useState(null);

  // Dialog State
  const [deleteProjectModal, setDeleteProjectModal] = useState(null);
  const [deleteExpenseModal, setDeleteExpenseModal] = useState(null);
  const [alertModalMessage, setAlertModalMessage] = useState("");

  useEffect(() => {
    document.title = "Projects & Expenses | FinFlow";
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/workspace/projects?workspace=business`, { headers: headers() });
      const d = await r.json();
      const list = Array.isArray(d) ? d : [];
      setProjects(list);

      // Keep detailProject in sync if currently open
      if (detailProject) {
        const fresh = list.find((p) => p._id === detailProject._id);
        if (fresh) setDetailProject(fresh);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (projectId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // Open Project Modal for Create or Edit
  const openProjectModal = (p = null) => {
    if (p) {
      setEditingProject(p);
      setProjectForm({
        name: p.name || "",
        client: p.client || "",
        budget: p.budget || "",
        startDate: formatDateInput(p.startDate),
        endDate: formatDateInput(p.endDate),
        status: p.status || "active",
        hasInitialExpense: false,
        initialExpenseTitle: "",
        initialExpenseAmount: "",
        initialExpenseCategory: "General",
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        name: "",
        client: "",
        budget: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        status: "active",
        hasInitialExpense: false,
        initialExpenseTitle: "",
        initialExpenseAmount: "",
        initialExpenseCategory: "General",
      });
    }
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProject;
      const url = isEdit ? `${API}/workspace/projects/${editingProject._id}` : `${API}/workspace/projects`;

      const payload = {
        name: projectForm.name.trim(),
        client: projectForm.client.trim(),
        budget: Number(projectForm.budget) || 0,
        startDate: projectForm.startDate ? projectForm.startDate : null,
        endDate: projectForm.endDate ? projectForm.endDate : null,
        status: projectForm.status,
        workspace: "business",
      };

      // If user enabled initial expense during project creation
      if (!isEdit && projectForm.hasInitialExpense && Number(projectForm.initialExpenseAmount) > 0) {
        payload.expenseItems = [
          {
            title: projectForm.initialExpenseTitle.trim() || "Initial Project Expense",
            amount: Number(projectForm.initialExpenseAmount),
            category: projectForm.initialExpenseCategory || "General",
            date: projectForm.startDate ? new Date(projectForm.startDate) : new Date(),
            notes: "Initial expense logged at project creation",
          },
        ];
        payload.expenses = Number(projectForm.initialExpenseAmount);
      }

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowProjectModal(false);
        setEditingProject(null);
        await loadProjects();
      }
    } catch (err) {
      console.error("Save project error:", err);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectModal) return;
    try {
      await fetch(`${API}/workspace/projects/${deleteProjectModal.id}`, { method: "DELETE", headers: headers() });
      if (detailProject && detailProject._id === deleteProjectModal.id) setDetailProject(null);
      await loadProjects();
    } catch (err) {
      console.error("Delete project error:", err);
    } finally {
      setDeleteProjectModal(null);
    }
  };

  // Open Add Expense Modal
  const openAddExpenseModal = (project) => {
    setExpenseModalProject(project);
    setExpenseForm({
      title: "",
      amount: "",
      category: "General",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseModalProject) return;
    const amountVal = Number(expenseForm.amount) || 0;
    if (amountVal <= 0) {
      setAlertModalMessage("Please enter a valid expense amount greater than 0");
      return;
    }

    try {
      setIsSubmittingExpense(true);
      const res = await fetch(`${API}/workspace/projects/${expenseModalProject._id}/expenses`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          title: (expenseForm.title || "").trim() || "Project Expense",
          amount: amountVal,
          category: expenseForm.category || "General",
          date: expenseForm.date ? expenseForm.date : new Date(),
          notes: (expenseForm.notes || "").trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update local state smoothly
        setProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        if (detailProject && detailProject._id === updated._id) setDetailProject(updated);

        // Auto-expand this project's expenses so user sees it right away!
        setExpandedCards((prev) => ({ ...prev, [updated._id]: true }));
        setExpenseModalProject(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAlertModalMessage(errData.message || "Failed to save project expense. Please check input.");
      }
    } catch (err) {
      console.error("Add expense error:", err);
      setAlertModalMessage("Network error: unable to save expense. Please check your connection.");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseModal) return;
    try {
      const { projectId, expenseId } = deleteExpenseModal;
      const res = await fetch(`${API}/workspace/projects/${projectId}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: headers(),
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        if (detailProject && detailProject._id === updated._id) setDetailProject(updated);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAlertModalMessage(errData.message || "Failed to delete expense");
      }
    } catch (err) {
      console.error("Delete expense error:", err);
      setAlertModalMessage("Network error while deleting expense");
    } finally {
      setDeleteExpenseModal(null);
    }
  };

  // Filtered project list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.client || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCount = projects.length;
    const activeCount = projects.filter((p) => p.status === "active").length;
    const totalBudget = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
    const totalExpenses = projects.reduce((s, p) => s + (Number(p.expenses) || 0), 0);
    const totalRemaining = Math.max(0, totalBudget - totalExpenses);
    const overallUsage = totalBudget > 0 ? Math.min(100, Math.round((totalExpenses / totalBudget) * 100)) : 0;
    return { totalCount, activeCount, totalBudget, totalExpenses, totalRemaining, overallUsage };
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Projects & Budgets</h1>
              <p className="text-xs text-[#6B7280]">
                Allocate budgets, record project costs, and track real-time remaining balances
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => openProjectModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* ── Executive Summary KPI Banner ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Projects */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4.5 shadow-xs hover:border-[#005B4F]/30 transition-colors">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Projects</span>
            <div className="w-8 h-8 rounded-lg bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1F2937] mt-2">{stats.totalCount}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6B7280]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {stats.activeCount} Active
            </span>
            <span>·</span>
            <span>{stats.totalCount - stats.activeCount} Inactive/Closed</span>
          </div>
        </div>

        {/* KPI 2: Total Budget */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4.5 shadow-xs hover:border-[#005B4F]/30 transition-colors">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Allocated Budget</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#005B4F] flex items-center justify-center">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1F2937] mt-2">{formatCurrency(stats.totalBudget)}</p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Across all client assignments</p>
        </div>

        {/* KPI 3: Incurred Expenses */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4.5 shadow-xs hover:border-[#005B4F]/30 transition-colors">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Total Spent</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{formatCurrency(stats.totalExpenses)}</p>
          <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#6B7280]">
            <span>{stats.overallUsage}% of total budget</span>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${stats.overallUsage > 90 ? "bg-rose-500" : "bg-[#005B4F]"}`}
                style={{ width: `${stats.overallUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4: Remaining Balance */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4.5 shadow-xs hover:border-[#005B4F]/30 transition-colors">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Remaining Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{formatCurrency(stats.totalRemaining)}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1.5 font-medium">Safe operating margin</p>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "active", "completed", "on-hold"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#005B4F] text-white shadow-xs"
                  : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50"
              }`}
            >
              {st === "all" ? `All Projects (${projects.length})` : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#005B4F] transition-all"
          />
        </div>
      </div>

      {/* ── Projects Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 h-56 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-[#1F2937]">No projects found</p>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "No projects match your filter criteria. Try clearing search filters."
              : "Create your first project to track client budgets and log expenditures."}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => openProjectModal()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#005B4F] text-white text-xs font-semibold rounded-xl hover:bg-[#004A40] transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProjects.map((p) => {
            const budgetVal = Number(p.budget) || 0;
            const expensesVal = Number(p.expenses) || 0;
            const remainingVal = budgetVal - expensesVal;
            const isOverBudget = remainingVal < 0;
            const usagePercent = budgetVal > 0 ? Math.min(100, Math.round((expensesVal / budgetVal) * 100)) : 0;
            const expenseItems = Array.isArray(p.expenseItems) ? p.expenseItems : [];
            const isExpanded = !!expandedCards[p._id];

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Main Container */}
                <div className="p-5 space-y-4">
                  {/* Top Bar: Name, Client, Status, Action Icons */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2
                          onClick={() => setDetailProject(p)}
                          className="text-base font-bold text-[#1F2937] hover:text-[#005B4F] cursor-pointer truncate transition-colors"
                          title="Click to view detailed analytics"
                        >
                          {p.name}
                        </h2>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border capitalize ${
                            statusBadges[p.status] || statusBadges.active
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{p.client || "Direct / Internal Project"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openProjectModal(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#005B4F] hover:bg-gray-100 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteProjectModal({ id: p._id, name: p.name })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── Financial Highlights Strip ── */}
                  <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl p-3.5 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-200/60">
                      {/* Budget */}
                      <div>
                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Budget</p>
                        <p className="text-sm font-extrabold text-[#1F2937] mt-0.5">{formatCurrency(budgetVal)}</p>
                      </div>

                      {/* Incurred Expenses */}
                      <div className="pl-2">
                        <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-center gap-1">
                          Spent
                          {expenseItems.length > 0 && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded-full font-bold">
                              {expenseItems.length}
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-extrabold text-rose-600 mt-0.5">{formatCurrency(expensesVal)}</p>
                      </div>

                      {/* Remaining Balance */}
                      <div className="pl-2">
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-wider ${
                            isOverBudget ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          Remaining
                        </p>
                        <p
                          className={`text-sm font-extrabold mt-0.5 ${
                            isOverBudget ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(remainingVal)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Subtext */}
                    <div>
                      <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget
                              ? "bg-rose-500"
                              : usagePercent > 80
                              ? "bg-amber-500"
                              : "bg-[#005B4F]"
                          }`}
                          style={{ width: `${Math.min(100, usagePercent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-1 font-medium">
                        <span>{usagePercent}% utilized</span>
                        <span>{isOverBudget ? "⚠️ Over budget limit" : `${formatCurrency(remainingVal)} left`}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Timeline & Date Row ── */}
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#005B4F]" />
                      <span>{formatDateDisplay(p.startDate)}</span>
                      <span className="text-gray-300">→</span>
                      <span>{formatDateDisplay(p.endDate)}</span>
                    </div>

                    <button
                      onClick={() => setDetailProject(p)}
                      className="text-[#005B4F] hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      Full Details <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* ── Card Action Bar (Always Visible at bottom) ── */}
                <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#F3F4F6] flex items-center justify-between gap-3">
                  {/* Toggle inline expense items */}
                  <button
                    onClick={() => toggleExpand(p._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] hover:text-[#005B4F] transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#005B4F]" />
                    <span>Expenses ({expenseItems.length})</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  {/* Quick Add Expense Button */}
                  <button
                    onClick={() => openAddExpenseModal(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005B4F] text-white text-xs font-semibold rounded-xl hover:bg-[#004A40] shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Expense
                  </button>
                </div>

                {/* ── Inline Expandable Expense Panel ── */}
                {isExpanded && (
                  <div className="bg-[#F8FAFC] border-t border-[#E5E7EB] p-4.5 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1F2937]">Recorded Expenses</span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                          - {formatCurrency(expensesVal)}
                        </span>
                      </div>
                      <button
                        onClick={() => openAddExpenseModal(p)}
                        className="text-[11px] font-semibold text-[#005B4F] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add item
                      </button>
                    </div>

                    {expenseItems.length === 0 ? (
                      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                        <Receipt className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-[#4B5563]">No expenses recorded yet</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Track project materials, labour, or vendor spend to deduct from remaining balance.
                        </p>
                        <button
                          onClick={() => openAddExpenseModal(p)}
                          className="mt-3 px-3 py-1.5 bg-[#005B4F]/10 text-[#005B4F] hover:bg-[#005B4F]/20 text-xs font-semibold rounded-lg transition-all"
                        >
                          + Record First Expense
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {expenseItems.map((item) => (
                          <div
                            key={item._id}
                            className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 flex items-center justify-between gap-3 hover:border-gray-300 transition-colors shadow-2xs"
                          >
                            <div className="min-w-0 flex items-center gap-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getCategoryBadgeClass(
                                  item.category
                                )}`}
                              >
                                {item.category || "General"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1F2937] truncate">{item.title}</p>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <span>{formatDateDisplay(item.date)}</span>
                                  {item.notes && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate max-w-[140px] text-gray-500">{item.notes}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-rose-600">
                                - {formatCurrency(item.amount)}
                              </span>
                              <button
                                onClick={() => setDeleteExpenseModal({ projectId: p._id, expenseId: item._id, title: item.title, amount: item.amount })}
                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ADD PROJECT EXPENSE (Live Balance Deduction Feedback)
         ───────────────────────────────────────────────────────────── */}
      {expenseModalProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={() => setExpenseModalProject(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Add Project Expense</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Project: <strong className="text-[#005B4F]">{expenseModalProject.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setExpenseModalProject(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Financial Feedback Card */}
            {(() => {
              const currentBudget = Number(expenseModalProject.budget) || 0;
              const currentSpent = Number(expenseModalProject.expenses) || 0;
              const currentRemaining = currentBudget - currentSpent;
              const enteredAmount = Number(expenseForm.amount) || 0;
              const newRemaining = currentRemaining - enteredAmount;
              const isExceeded = newRemaining < 0;

              return (
                <div className="px-6 pt-4 pb-1">
                  <div
                    className={`rounded-xl p-3.5 border transition-all ${
                      isExceeded
                        ? "bg-rose-50/70 border-rose-200"
                        : enteredAmount > 0
                        ? "bg-emerald-50/70 border-emerald-200"
                        : "bg-[#F9FAFB] border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280]">Current Remaining:</span>
                      <span className="font-bold text-[#1F2937]">{formatCurrency(currentRemaining)}</span>
                    </div>

                    {enteredAmount > 0 && (
                      <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-gray-200/60">
                        <span className={`font-semibold ${isExceeded ? "text-rose-700" : "text-emerald-700"}`}>
                          {isExceeded ? "Over Budget Deficit:" : "Projected Remaining:"}
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            isExceeded ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(newRemaining)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Expense Form */}
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Expense Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS Servers, UI Freelancer, Cement bags"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  required
                  autoFocus
                  className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="1"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs font-semibold outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 font-semibold mr-1">Quick:</span>
                {[500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        amount: String((Number(prev.amount) || 0) + amt),
                      }))
                    }
                    className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 hover:bg-[#005B4F]/10 hover:text-[#005B4F] rounded-md transition-colors"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Notes / Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="Invoice # or remark"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpenseModalProject(null)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-5 py-2 bg-[#005B4F] text-white text-xs font-semibold rounded-xl hover:bg-[#004A40] shadow-sm shadow-[#005B4F]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmittingExpense ? "Saving..." : "Save & Deduct"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: CREATE / EDIT PROJECT (Includes Initial Expense Option)
         ───────────────────────────────────────────────────────────── */}
      {showProjectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={() => setShowProjectModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-[#F3F4F6] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-[#1F2937]">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Website Redesign, Q4 Corporate Audit"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                  className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Client / Beneficiary</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp or Internal"
                    value={projectForm.client}
                    onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                    className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Allocated Budget (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs font-semibold outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">End Date</label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F] transition-all"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On-Hold</option>
                </select>
              </div>

              {/* ── Optional Initial Expense on Project Creation ── */}
              {!editingProject && (
                <div className="border border-dashed border-gray-300 rounded-xl p-3.5 bg-gray-50/60 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={projectForm.hasInitialExpense}
                      onChange={(e) => setProjectForm({ ...projectForm, hasInitialExpense: e.target.checked })}
                      className="w-4 h-4 text-[#005B4F] rounded border-gray-300 focus:ring-[#005B4F]"
                    />
                    <span className="text-xs font-bold text-[#1F2937]">
                      Record initial expense right now?
                    </span>
                  </label>

                  {projectForm.hasInitialExpense && (
                    <div className="space-y-2.5 pt-1 pl-6">
                      <p className="text-[11px] text-[#6B7280]">
                        This amount will be subtracted from the project's allocated budget immediately upon creation.
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Expense title (e.g. Advance fee)"
                          value={projectForm.initialExpenseTitle}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, initialExpenseTitle: e.target.value })
                          }
                          className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#005B4F]"
                        />
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          min="1"
                          value={projectForm.initialExpenseAmount}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, initialExpenseAmount: e.target.value })
                          }
                          className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#005B4F]"
                        />
                      </div>
                      <select
                        value={projectForm.initialExpenseCategory}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, initialExpenseCategory: e.target.value })
                        }
                        className="w-full h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#005B4F]"
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005B4F] text-white text-xs font-semibold rounded-xl hover:bg-[#004A40] shadow-sm shadow-[#005B4F]/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: FULL PROJECT ANALYTICS & EXPENSE LEDGER MODAL
         ───────────────────────────────────────────────────────────── */}
      {detailProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={() => setDetailProject(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[#F3F4F6] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">{detailProject.name}</h3>
                  <p className="text-xs text-[#6B7280]">
                    Client: {detailProject.client || "Internal"} · Status:{" "}
                    <span className="capitalize font-semibold text-[#005B4F]">{detailProject.status}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddExpenseModal(detailProject)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005B4F] text-white text-xs font-semibold rounded-xl hover:bg-[#004A40] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Expense
                </button>
                <button
                  onClick={() => setDetailProject(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Financial Status Summary */}
              {(() => {
                const b = Number(detailProject.budget) || 0;
                const exp = Number(detailProject.expenses) || 0;
                const rem = b - exp;
                const pct = b > 0 ? Math.min(100, Math.round((exp / b) * 100)) : 0;
                const items = Array.isArray(detailProject.expenseItems) ? detailProject.expenseItems : [];

                // Category Breakdown
                const categoryBreakdown = items.reduce((acc, it) => {
                  const cat = it.category || "General";
                  acc[cat] = (acc[cat] || 0) + (Number(it.amount) || 0);
                  return acc;
                }, {});

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl p-4 text-center">
                      <div>
                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Total Budget</p>
                        <p className="text-lg font-extrabold text-[#1F2937] mt-1">{formatCurrency(b)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Total Spent</p>
                        <p className="text-lg font-extrabold text-rose-600 mt-1">{formatCurrency(exp)}</p>
                      </div>
                      <div>
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-wider ${
                            rem < 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          Remaining
                        </p>
                        <p
                          className={`text-lg font-extrabold mt-1 ${
                            rem < 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(rem)}
                        </p>
                      </div>
                    </div>

                    {/* Category Breakdown Chips */}
                    {Object.keys(categoryBreakdown).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-[#1F2937] mb-2 flex items-center gap-1.5">
                          <PieChart className="w-3.5 h-3.5 text-[#005B4F]" /> Spending by Category
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(categoryBreakdown).map(([cat, amt]) => (
                            <div
                              key={cat}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-2 ${getCategoryBadgeClass(
                                cat
                              )}`}
                            >
                              <span>{cat}</span>
                              <span className="font-extrabold">{formatCurrency(amt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expense Ledger */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#005B4F]" /> Complete Expense Ledger ({items.length})
                        </h4>
                      </div>

                      {items.length === 0 ? (
                        <div className="bg-[#F9FAFB] rounded-xl border border-dashed border-gray-300 p-8 text-center">
                          <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-[#4B5563]">No expenses recorded yet</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Click "+ Add Expense" above to deduct from this project's budget.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
                          {items.map((it) => (
                            <div key={it._id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/70">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                                      it.category
                                    )}`}
                                  >
                                    {it.category || "General"}
                                  </span>
                                  <p className="text-xs font-bold text-[#1F2937] truncate">{it.title}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                                  <span>{formatDateDisplay(it.date)}</span>
                                  {it.notes && (
                                    <>
                                      <span>·</span>
                                      <span className="text-gray-500 truncate max-w-xs">{it.notes}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-extrabold text-rose-600">
                                  - {formatCurrency(it.amount)}
                                </span>
                                <button
                                  onClick={() =>
                                    setDeleteExpenseModal({ projectId: detailProject._id, expenseId: it._id, title: it.title, amount: it.amount })
                                  }
                                  className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Project Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteProjectModal)}
        onClose={() => setDeleteProjectModal(null)}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={
          deleteProjectModal
            ? `Are you sure you want to delete project "${deleteProjectModal.name}" and all of its recorded expenses?`
            : "Are you sure you want to delete this project?"
        }
        confirmText="Delete Project"
        isDanger={true}
      />

      {/* Confirm Expense Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteExpenseModal)}
        onClose={() => setDeleteExpenseModal(null)}
        onConfirm={confirmDeleteExpense}
        title="Delete Project Expense"
        message={
          deleteExpenseModal
            ? `Delete expense "${deleteExpenseModal.title}" (- ${formatCurrency(deleteExpenseModal.amount)})? This amount will be returned to the project's remaining balance.`
            : "Are you sure you want to delete this expense?"
        }
        confirmText="Delete Expense"
        isDanger={true}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={Boolean(alertModalMessage)}
        onClose={() => setAlertModalMessage("")}
        title="Project Alert"
        message={alertModalMessage}
        type="warning"
      />
    </div>
  );
}
