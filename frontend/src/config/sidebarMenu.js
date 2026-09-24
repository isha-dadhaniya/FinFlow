import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Target,
  Wallet,
  Users,
  FileText,
  TrendingUp,
  Calculator,
  Calendar,
  FileSpreadsheet,
  Bell,
  Settings,
  User,
  PiggyBank,
  ReceiptIndianRupee,
  Landmark,
  BadgeDollarSign,
  Briefcase,
  Building2,
  ClipboardCheck,
  FolderKanban,
  Store,
  BarChart3,
  HandCoins,
  Scale,
  Heart,
  Home,
} from "lucide-react";

// ─── PERSONAL WORKSPACE MENU ──────────────────────────────────────
export const personalMenu = [
  {
    sectionTitle: "Personal Finance",
    items: [
      { id: "p-dashboard", label: "Dashboard", path: "/app/personal/dashboard", icon: LayoutDashboard },
      { id: "p-transactions", label: "Transactions", path: "/app/personal/transactions", icon: ArrowLeftRight },
      { id: "p-accounts", label: "Accounts", path: "/app/personal/accounts", icon: Landmark },
      { id: "p-income", label: "Income", path: "/app/personal/income", icon: TrendingUp },
      { id: "p-expenses", label: "Expenses", path: "/app/personal/expense-tracker", icon: CreditCard },
      { id: "p-budget", label: "Budget", path: "/app/personal/monthly-budget", icon: Target },
      { id: "p-goals", label: "Savings Goals", path: "/app/personal/savings-goals", icon: PiggyBank },
      { id: "p-loans", label: "Loans & EMI", path: "/app/personal/loans-emi", icon: BadgeDollarSign },
      { id: "p-reports", label: "Reports", path: "/app/personal/reports", icon: FileSpreadsheet },
    ],
  },
  {
    sectionTitle: "Account",
    items: [
      { id: "p-profile", label: "Profile", path: "/app/profile", icon: User },
      { id: "p-settings", label: "Settings", path: "/app/settings", icon: Settings },
    ],
  },
];

// ─── FAMILY WORKSPACE MENU ────────────────────────────────────────
export const familyMenu = [
  {
    sectionTitle: "Family Finance",
    items: [
      { id: "f-dashboard", label: "Dashboard", path: "/app/family/dashboard", icon: LayoutDashboard },
      { id: "f-members", label: "Family Members", path: "/app/family/members", icon: Users },
      { id: "f-accounts", label: "Accounts", path: "/app/family/accounts", icon: Landmark },
      { id: "f-transactions", label: "Transactions", path: "/app/family/transactions", icon: ArrowLeftRight },
      { id: "f-income", label: "Income", path: "/app/family/income", icon: TrendingUp },
      { id: "f-shared", label: "Shared Expenses", path: "/app/family/shared-expenses", icon: HandCoins },
      { id: "f-budget", label: "Family Budget", path: "/app/family/budget", icon: Target },
      { id: "f-settlements", label: "Settlements", path: "/app/family/settlements", icon: Scale },
      { id: "f-goals", label: "Family Goals", path: "/app/family/goals", icon: Heart },
      { id: "f-loans", label: "Loans & EMI", path: "/app/family/loans-emi", icon: BadgeDollarSign },
      { id: "f-reports", label: "Reports", path: "/app/family/reports", icon: FileSpreadsheet },
    ],
  },
  {
    sectionTitle: "Account",
    items: [
      { id: "f-profile", label: "Profile", path: "/app/profile", icon: User },
      { id: "f-settings", label: "Settings", path: "/app/settings", icon: Settings },
    ],
  },
];

// ─── BUSINESS WORKSPACE MENU ──────────────────────────────────────
export const businessMenu = [
  {
    sectionTitle: "Business Finance",
    items: [
      { id: "b-dashboard", label: "Dashboard", path: "/app/business/dashboard", icon: LayoutDashboard },
      { id: "b-employees", label: "Employees", path: "/app/business/employees", icon: Users },
      { id: "b-expenses", label: "Expenses", path: "/app/business/expenses", icon: CreditCard },
      { id: "b-approvals", label: "Approvals", path: "/app/business/approvals", icon: ClipboardCheck },
      { id: "b-departments", label: "Departments", path: "/app/business/departments", icon: Building2 },
      { id: "b-projects", label: "Projects", path: "/app/business/projects", icon: FolderKanban },
      { id: "b-vendors", label: "Vendors", path: "/app/business/vendors", icon: Store },
      { id: "b-invoices", label: "Invoices", path: "/app/business/invoices", icon: FileText },
      { id: "b-budgets", label: "Budgets", path: "/app/business/budgets", icon: Target },
      { id: "b-loans", label: "Loans & EMI", path: "/app/business/loans-emi", icon: BadgeDollarSign },
      { id: "b-accounts", label: "Accounts", path: "/app/business/accounts", icon: Landmark },
      { id: "b-reports", label: "Reports", path: "/app/business/reports", icon: FileSpreadsheet },
    ],
  },
  {
    sectionTitle: "Account",
    items: [
      { id: "b-settings", label: "Settings", path: "/app/settings", icon: Settings },
      { id: "b-profile", label: "Profile", path: "/app/profile", icon: User },
    ],
  },
];

// ─── Menu selector by mode ────────────────────────────────────────
export const getMenuForMode = (mode) => {
  switch (mode) {
    case "family":
      return familyMenu;
    case "business":
      return businessMenu;
    case "personal":
    default:
      return personalMenu;
  }
};

// Keep legacy export for backward compatibility
export const sidebarMenuConfig = personalMenu;
