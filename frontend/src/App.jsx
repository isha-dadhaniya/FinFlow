import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceProvider } from "./context/WorkspaceContext";

import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import AccountTypeSelection from "./pages/AccountTypeSelection";

// Layout & Protection
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Dynamic Router / Common Hubs
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Members from "./pages/Members";
import Categories from "./pages/Categories";
import ExportPage from "./pages/ExportPage";
import NotificationsPage from "./pages/NotificationsPage";
import Settings from "./pages/Settings";
import ProfilePage from "./pages/ProfilePage";

// Personal Workspace Pages
import PersonalDashboard from "./pages/personal/PersonalDashboard";
import PersonalTransactions from "./pages/personal/Transactions";
import Income from "./pages/personal/Income";
import ExpenseTracker from "./pages/personal/ExpenseTracker";
import MonthlyBudget from "./pages/personal/MonthlyBudget";
import Accounts from "./pages/personal/Accounts";
import Bills from "./pages/personal/Bills";
import LoansEMI from "./pages/personal/LoansEMI";
import SavingsGoals from "./pages/personal/SavingsGoals";
import PersonalReports from "./pages/personal/PersonalReports";

// Family Workspace Pages
import FamilyDashboard from "./pages/family/FamilyDashboard";
import FamilyMembers from "./pages/family/FamilyMembers";
import FamilyTransactions from "./pages/family/FamilyTransactions";
import SharedExpenses from "./pages/family/SharedExpenses";
import FamilyBills from "./pages/family/FamilyBills";
import FamilyBudget from "./pages/family/FamilyBudget";
import Settlements from "./pages/family/Settlements";
import FamilyGoals from "./pages/family/FamilyGoals";
import FamilyLoansEMI from "./pages/family/FamilyLoansEMI";
import FamilyAccounts from "./pages/family/FamilyAccounts";
import FamilyReports from "./pages/family/FamilyReports";
import MemberContributions from "./pages/family/MemberContributions";
import FamilyIncome from "./pages/family/FamilyIncome";

// Business Workspace Pages
import BusinessDashboard from "./pages/business/BusinessDashboard";
import Employees from "./pages/business/Employees";
import BusinessExpenses from "./pages/business/BusinessExpenses";
import Approvals from "./pages/business/Approvals";
import Departments from "./pages/business/Departments";
import Projects from "./pages/business/Projects";
import Vendors from "./pages/business/Vendors";
import InvoiceManagement from "./pages/business/InvoiceManagement";
import ProfitLoss from "./pages/business/ProfitLoss";
import BusinessBudgets from "./pages/business/BusinessBudgets";
import BusinessLoansEMI from "./pages/business/BusinessLoansEMI";
import BusinessAccounts from "./pages/business/BusinessAccounts";
import BusinessReports from "./pages/business/BusinessReports";

// Group (Legacy)
import ExpenseSplit from "./pages/group/ExpenseSplit";
import GroupContributions from "./pages/group/Contributions";

function App() {
  return (
    <WorkspaceProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<Login />} />
          <Route path="/account-type" element={<AccountTypeSelection />} />

          {/* Legacy redirect */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />

          {/* Protected Unified Workspace Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="transactions" element={<PersonalTransactions />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="reports" element={<Reports />} />
              <Route path="analytics" element={<Analytics />} />

              {/* ────── Personal Workspace Routes ────── */}
              <Route path="personal/dashboard" element={<PersonalDashboard />} />
              <Route path="personal/transactions" element={<PersonalTransactions />} />
              <Route path="personal/income" element={<Income />} />
              <Route path="personal/expense-tracker" element={<ExpenseTracker />} />
              <Route path="personal/monthly-budget" element={<MonthlyBudget />} />
              <Route path="personal/accounts" element={<Accounts />} />
              <Route path="personal/bills" element={<Bills />} />
              <Route path="personal/loans-emi" element={<LoansEMI />} />
              <Route path="personal/savings-goals" element={<SavingsGoals />} />
              <Route path="personal/reports" element={<PersonalReports />} />

              {/* ────── Family Workspace Routes ────── */}
              <Route path="family/dashboard" element={<FamilyDashboard />} />
              <Route path="family/members" element={<FamilyMembers />} />
              <Route path="family/transactions" element={<FamilyTransactions />} />
              <Route path="family/income" element={<FamilyIncome />} />
              <Route path="family/shared-expenses" element={<SharedExpenses />} />
              <Route path="family/bills" element={<FamilyBills />} />
              <Route path="family/budget" element={<FamilyBudget />} />
              <Route path="family/settlements" element={<Settlements />} />
              <Route path="family/goals" element={<FamilyGoals />} />
              <Route path="family/loans-emi" element={<FamilyLoansEMI />} />
              <Route path="family/accounts" element={<FamilyAccounts />} />
              <Route path="family/reports" element={<FamilyReports />} />
              <Route path="family/member-contributions" element={<MemberContributions />} />

              {/* ────── Business Workspace Routes ────── */}
              <Route path="business/dashboard" element={<BusinessDashboard />} />
              <Route path="business/employees" element={<Employees />} />
              <Route path="business/expenses" element={<BusinessExpenses />} />
              <Route path="business/approvals" element={<Approvals />} />
              <Route path="business/reimbursements" element={<Navigate to="/app/business/dashboard" replace />} />
              <Route path="business/departments" element={<Departments />} />
              <Route path="business/projects" element={<Projects />} />
              <Route path="business/vendors" element={<Vendors />} />
              <Route path="business/invoices" element={<InvoiceManagement />} />
              <Route path="business/invoice-management" element={<InvoiceManagement />} />
              <Route path="business/profit-loss" element={<ProfitLoss />} />
              <Route path="business/budgets" element={<BusinessBudgets />} />
              <Route path="business/loans-emi" element={<BusinessLoansEMI />} />
              <Route path="business/accounts" element={<BusinessAccounts />} />
              <Route path="business/reports" element={<BusinessReports />} />

              {/* ────── Group (Legacy) ────── */}
              <Route path="group/expense-split" element={<ExpenseSplit />} />
              <Route path="group/contributions" element={<GroupContributions />} />

              {/* ────── Shared / Management ────── */}
              <Route path="members" element={<Members />} />
              <Route path="categories" element={<Categories />} />
              <Route path="export" element={<ExportPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </WorkspaceProvider>
  );
}

export default App;