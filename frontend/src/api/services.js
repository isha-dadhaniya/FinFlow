import client from "./client";

// Dashboard
export const fetchDashboardStats = () => client.get("/dashboard/stats");

// Expenses
export const fetchExpenses = (params) => client.get("/expenses", { params });
export const createExpense = (data) => client.post("/expenses", data);
export const updateExpense = (id, data) => client.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => client.delete(`/expenses/${id}`);

// Budget
export const fetchBudgetStatus = (params) => client.get("/budgets", { params });
export const saveBudget = (data) => client.post("/budgets", data);
export const deleteBudget = (id) => client.delete(`/budgets/${id}`);
export const fetchBudgetHistory = (params) => client.get("/budgets/history", { params });

// Family
export const fetchFamilyMembers = () => client.get("/family/members");
export const createFamilyMember = (data) => client.post("/family/members", data);
export const updateFamilyMember = (id, data) => client.put(`/family/members/${id}`, data);
export const deleteFamilyMember = (id) => client.delete(`/family/members/${id}`);
export const fetchFamilyContributions = () => client.get("/family/contributions");
export const createFamilyContribution = (data) => client.post("/family/contributions", data);

// Business
export const fetchInvoices = (params) => client.get("/business/invoices", { params });
export const createInvoice = (data) => client.post("/business/invoices", data);
export const updateInvoice = (id, data) => client.put(`/business/invoices/${id}`, data);
export const deleteInvoice = (id) => client.delete(`/business/invoices/${id}`);
export const fetchProfitLoss = () => client.get("/business/profit-loss");

// Group / Event
export const fetchGroupSplits = (params) => client.get("/group/splits", { params });
export const createGroupSplit = (data) => client.post("/group/splits", data);
export const updateGroupSplit = (id, data) => client.put(`/group/splits/${id}`, data);
export const toggleSplitSettlement = (id, data) => client.put(`/group/splits/${id}/settle`, data);
export const deleteGroupSplit = (id) => client.delete(`/group/splits/${id}`);
export const fetchGroupContributions = () => client.get("/group/contributions");
export const createGroupContribution = (data) => client.post("/group/contributions", data);

// Transactions
export const fetchTransactions = (params) => client.get("/transactions", { params });
export const createTransaction = (data) => client.post("/transactions", data);
export const deleteTransaction = (id) => client.delete(`/transactions/${id}`);

// Categories
export const fetchCategories = () => client.get("/categories");
export const createCategory = (data) => client.post("/categories", data);
export const deleteCategory = (id) => client.delete(`/categories/${id}`);

// Notifications
export const fetchNotifications = () => client.get("/notifications");
export const fetchLatestNotifications = () => client.get("/notifications/latest");
export const fetchUnreadNotificationCount = () => client.get("/notifications/unread-count");
export const markNotificationRead = (id) => client.patch(`/notifications/${id}/read`);
export const clearNotifications = () => client.delete("/notifications/clear");

// User Profile
export const fetchUserProfile = () => client.get("/user/profile");
export const updateUserProfile = (data) => client.put("/user/profile", data);
export const deleteUserProfile = () => client.delete("/user/profile");
export const changeUserPassword = (data) => client.put("/user/change-password", data);

// ─── NEW WORKSPACE API SERVICES ────────────────────────────────────

// Auth - Selected Modes
export const updateSelectedModes = (data) => client.put("/auth/selected-modes", data);

// Accounts
export const fetchAccounts = (params) => client.get("/accounts", { params });
export const createAccount = (data) => client.post("/accounts", data);
export const updateAccount = (id, data) => client.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => client.delete(`/accounts/${id}`);

// Bills
export const fetchBills = (params) => client.get("/bills", { params });
export const createBill = (data) => client.post("/bills", data);
export const updateBill = (id, data) => client.put(`/bills/${id}`, data);
export const deleteBill = (id) => client.delete(`/bills/${id}`);

// Loans
export const fetchLoans = (params) => client.get("/loans", { params });
export const createLoan = (data) => client.post("/loans", data);
export const updateLoan = (id, data) => client.put(`/loans/${id}`, data);
export const deleteLoan = (id) => client.delete(`/loans/${id}`);
export const markEmiPaid = (loanId, emiIndex, data) => client.put(`/loans/${loanId}/emi/${emiIndex}/pay`, data);

// Savings Goals
export const fetchSavingsGoals = (params) => client.get("/savings-goals", { params });
export const createSavingsGoal = (data) => client.post("/savings-goals", data);
export const updateSavingsGoal = (id, data) => client.put(`/savings-goals/${id}`, data);
export const deleteSavingsGoal = (id) => client.delete(`/savings-goals/${id}`);
export const addGoalContribution = (id, data) => client.post(`/savings-goals/${id}/contribute`, data);

// Income
export const fetchIncomes = (params) => client.get("/incomes", { params });
export const createIncome = (data) => client.post("/incomes", data);
export const updateIncome = (id, data) => client.put(`/incomes/${id}`, data);
export const deleteIncome = (id) => client.delete(`/incomes/${id}`);

// Settlements
export const fetchSettlements = (params) => client.get("/workspace/settlements", { params });
export const createSettlement = (data) => client.post("/workspace/settlements", data);
export const markSettlementSettled = (id) => client.put(`/workspace/settlements/${id}/settle`);
export const deleteSettlement = (id) => client.delete(`/workspace/settlements/${id}`);

// Family Goals
export const fetchFamilyGoals = (params) => client.get("/workspace/family-goals", { params });
export const createFamilyGoal = (data) => client.post("/workspace/family-goals", data);
export const addFamilyGoalContributor = (id, data) => client.post(`/workspace/family-goals/${id}/contribute`, data);
export const deleteFamilyGoal = (id) => client.delete(`/workspace/family-goals/${id}`);

// Employees
export const fetchEmployees = (params) => client.get("/workspace/employees", { params });
export const createEmployee = (data) => client.post("/workspace/employees", data);
export const updateEmployee = (id, data) => client.put(`/workspace/employees/${id}`, data);
export const deleteEmployee = (id) => client.delete(`/workspace/employees/${id}`);

// Departments
export const fetchDepartments = (params) => client.get("/workspace/departments", { params });
export const createDepartment = (data) => client.post("/workspace/departments", data);
export const updateDepartment = (id, data) => client.put(`/workspace/departments/${id}`, data);
export const deleteDepartment = (id) => client.delete(`/workspace/departments/${id}`);

// Projects
export const fetchProjects = (params) => client.get("/workspace/projects", { params });
export const createProject = (data) => client.post("/workspace/projects", data);
export const updateProject = (id, data) => client.put(`/workspace/projects/${id}`, data);
export const deleteProject = (id) => client.delete(`/workspace/projects/${id}`);

// Vendors
export const fetchVendors = (params) => client.get("/workspace/vendors", { params });
export const createVendor = (data) => client.post("/workspace/vendors", data);
export const updateVendor = (id, data) => client.put(`/workspace/vendors/${id}`, data);
export const deleteVendor = (id) => client.delete(`/workspace/vendors/${id}`);

// Reimbursements
export const fetchReimbursements = (params) => client.get("/workspace/reimbursements", { params });
export const createReimbursement = (data) => client.post("/workspace/reimbursements", data);
export const updateReimbursement = (id, data) => client.put(`/workspace/reimbursements/${id}`, data);
export const deleteReimbursement = (id) => client.delete(`/workspace/reimbursements/${id}`);
