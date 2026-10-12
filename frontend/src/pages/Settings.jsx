import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Lock,
  CheckCircle2,
  Users,
  Briefcase,
  User,
  Plus,
  X,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Pencil,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { updateSelectedModes as apiUpdateSelectedModes, changeUserPassword, createFamilyMember, createEmployee } from "../api/services";
import { AlertModal } from "../components/common/ConfirmModal";

const BUSINESS_TYPES = [
  "Private Limited (Pvt Ltd)",
  "Sole Proprietorship",
  "Partnership Firm",
  "Limited Liability Partnership (LLP)",
  "Public Limited Company",
  "Freelancer / Agency",
  "Retail / Wholesale Enterprise",
  "Startup / Tech Company",
  "Other",
];

const FINANCIAL_YEARS = [
  "FY 2025 - 2026 (Apr - Mar)",
  "FY 2026 - 2027 (Apr - Mar)",
  "FY 2024 - 2025 (Apr - Mar)",
  "CY 2026 (Jan - Dec)",
  "CY 2025 (Jan - Dec)",
];

const WORKSPACE_DEFINITIONS = {
  personal: {
    id: "personal",
    title: "Personal Finance",
    type: "Personal Workspace",
    description: "Manage your personal money, bills & expenses",
    emoji: "🧑",
    icon: User,
    color: "#005B4F",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  family: {
    id: "family",
    title: "Family Workspace",
    type: "Family Workspace",
    description: "Household pool, joint loans & goals",
    modalDescription: "Manage shared expenses, contributions, loans and family goals",
    emoji: "👨‍👩‍👧",
    icon: Users,
    color: "#7C3AED",
    bgLight: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  business: {
    id: "business",
    title: "Business Workspace",
    type: "Business Workspace",
    description: "Corporate loans, invoices & approvals",
    modalDescription: "Manage business finances, invoices, expenses and team access",
    emoji: "🏢",
    icon: Briefcase,
    color: "#2563EB",
    bgLight: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export default function Settings() {
  const { activeMode, selectedModes, updateSelectedModes, switchMode } = useWorkspace();

  // Feedback states
  const [savedToast, setSavedToast] = useState("");

  // Password / Security states (Matches Image 2 exactly)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ text: "", isError: false });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Add Workspace Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Select Type, 2: Setup Details
  const [selectedType, setSelectedType] = useState("family");
  const [customName, setCustomName] = useState("");
  const [customCurrency, setCustomCurrency] = useState("₹ INR");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [enableContributions, setEnableContributions] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Business Workspace Specific Fields (Add Modal)
  const [businessName, setBusinessName] = useState("My Business");
  const [businessLogo, setBusinessLogo] = useState(null);
  const [businessType, setBusinessType] = useState("Private Limited (Pvt Ltd)");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [financialYear, setFinancialYear] = useState("FY 2025 - 2026 (Apr - Mar)");

  // Edit Workspace Modal States
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCurrency, setEditCurrency] = useState("₹ INR");
  const [editMembers, setEditMembers] = useState([]);
  const [editInviteInput, setEditInviteInput] = useState("");
  const [editInviteRole, setEditInviteRole] = useState("Member");
  const [editContributions, setEditContributions] = useState(true);

  // Edit Business Specific Fields (Edit Modal)
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editBusinessLogo, setEditBusinessLogo] = useState(null);
  const [editBusinessType, setEditBusinessType] = useState("Private Limited (Pvt Ltd)");
  const [editBusinessEmail, setEditBusinessEmail] = useState("");
  const [editBusinessPhone, setEditBusinessPhone] = useState("");
  const [editBusinessAddress, setEditBusinessAddress] = useState("");
  const [editFinancialYear, setEditFinancialYear] = useState("FY 2025 - 2026 (Apr - Mar)");
  const [alertMessage, setAlertMessage] = useState("");

  // Logo file upload / removal handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAlertMessage("Logo image size should be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setBusinessLogo(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBusinessLogo(null);
  };

  const handleEditLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAlertMessage("Logo image size should be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditBusinessLogo(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditLogo = () => {
    setEditBusinessLogo(null);
  };

  // Delete Workspace Confirmation Modal State
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);

  // Stored workspace metadata for member names / customizations
  const [workspaceMetadata, setWorkspaceMetadata] = useState(() => {
    try {
      const raw = localStorage.getItem("finflow_workspaces_config");
      const parsed = JSON.parse(raw || "{}");
      if (parsed?.family?.members) {
        parsed.family.members = parsed.family.members.filter(
          (m) => (m.email || "").toLowerCase() !== "varsha@gmail.com"
        );
        localStorage.setItem("finflow_workspaces_config", JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return {};
    }
  });

  // Open modal handler
  const handleOpenAddModal = () => {
    const unadded = ["family", "business", "personal"].find((t) => !selectedModes.includes(t)) || "family";
    setSelectedType(unadded);
    setModalStep(1);
    setCustomName(unadded === "family" ? "My Family" : unadded === "business" ? "My Business" : "Personal Finance");
    setCustomCurrency("₹ INR");
    setBusinessName("My Business");
    setBusinessLogo(null);
    setBusinessType("Private Limited (Pvt Ltd)");
    setBusinessEmail("");
    setBusinessPhone("");
    setBusinessAddress("");
    setFinancialYear("FY 2025 - 2026 (Apr - Mar)");
    setInvitedMembers([]);
    setEnableContributions(true);
    setIsAddModalOpen(true);
  };

  // Step 1: Select Type
  const handleSelectWorkspaceType = (typeId) => {
    setSelectedType(typeId);
    setCustomName(typeId === "family" ? "My Family" : typeId === "business" ? "My Business" : "Personal Finance");
    if (typeId === "business") {
      setBusinessName("My Business");
      setBusinessLogo(null);
      setBusinessType("Private Limited (Pvt Ltd)");
      setBusinessEmail("");
      setBusinessPhone("");
      setBusinessAddress("");
      setFinancialYear("FY 2025 - 2026 (Apr - Mar)");
    }
    setModalStep(2);
  };

  // Add an invitee in Add Modal
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    if (invitedMembers.some((m) => m.email.toLowerCase() === inviteInput.trim().toLowerCase())) {
      return;
    }
    setInvitedMembers([...invitedMembers, { email: inviteInput.trim(), role: inviteRole }]);
    setInviteInput("");
  };

  // Remove invitee in Add Modal
  const handleRemoveMember = (idxToRemove) => {
    setInvitedMembers(invitedMembers.filter((_, idx) => idx !== idxToRemove));
  };

  // Step 2: Create / Add Workspace
  const handleCreateWorkspace = async () => {
    if (selectedType === "business" && !businessName.trim() && !customName.trim()) {
      setSavedToast("Business Name is required.");
      setTimeout(() => setSavedToast(""), 3000);
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      const updatedModes = Array.from(new Set([...selectedModes, selectedType]));
      
      // Save to backend if logged in
      try {
        await apiUpdateSelectedModes({
          selectedModes: updatedModes,
          defaultMode: activeMode,
        });
      } catch (err) {
        console.warn("Backend update skipped, updating locally:", err);
      }

      // Update workspace context and localStorage
      updateSelectedModes(updatedModes);

      // Save custom metadata
      const businessData = selectedType === "business" ? {
        businessName: businessName.trim() || customName.trim() || "My Business",
        businessLogo: businessLogo || null,
        logo: businessLogo || null,
        businessType,
        businessEmail: businessEmail.trim(),
        businessPhone: businessPhone.trim(),
        address: businessAddress.trim(),
        businessAddress: businessAddress.trim(),
        financialYear,
      } : {};

      const newMeta = {
        ...workspaceMetadata,
        [selectedType]: {
          name: (selectedType === "business" ? businessName.trim() : customName) || WORKSPACE_DEFINITIONS[selectedType]?.title,
          currency: customCurrency,
          members: invitedMembers,
          enableContributions,
          ...businessData,
          createdAt: new Date().toISOString(),
        },
      };
      setWorkspaceMetadata(newMeta);
      localStorage.setItem("finflow_workspaces_config", JSON.stringify(newMeta));

      // Directly sync members to Family Members if creating Family workspace
      if (selectedType === "family" && invitedMembers.length > 0) {
        for (const m of invitedMembers) {
          try {
            const email = (m.email || "").trim();
            let name = "";
            if (email.includes("@")) {
              const userPart = email.split("@")[0];
              name = userPart.charAt(0).toUpperCase() + userPart.slice(1);
            } else {
              name = email || "Family Member";
            }
            await createFamilyMember({
              name,
              email,
              role: m.role || "Member",
              relationship: "Other",
              spendingLimit: 0,
            });
          } catch (memberErr) {
            console.warn("Family member sync notice:", memberErr);
          }
        }
      }

      // Directly sync members to Business Employees if creating Business workspace
      if (selectedType === "business" && invitedMembers.length > 0) {
        for (const m of invitedMembers) {
          try {
            const email = (m.email || "").trim();
            let name = "";
            if (email.includes("@")) {
              const userPart = email.split("@")[0];
              name = userPart.charAt(0).toUpperCase() + userPart.slice(1);
            } else {
              name = email || "Team Member";
            }
            await createEmployee({
              name,
              email,
              role: m.role === "Admin" ? "Admin" : "Employee",
              designation: m.role || "Employee",
              department: "General",
              workspace: "business",
            });
          } catch (empErr) {
            console.warn("Business employee sync notice:", empErr);
          }
        }
      }

      // Close modal
      setIsAddModalOpen(false);
      setSavedToast(`${WORKSPACE_DEFINITIONS[selectedType]?.title || selectedType} created successfully!`);
      setTimeout(() => setSavedToast(""), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (modeId) => {
    const meta = workspaceMetadata[modeId] || {};
    const def = WORKSPACE_DEFINITIONS[modeId] || {};
    setWorkspaceToEdit(modeId);
    setEditName(meta.name || def.title || modeId);
    setEditCurrency(meta.currency || "₹ INR");
    setEditMembers(meta.members || []);
    setEditContributions(meta.enableContributions ?? true);
    setEditInviteInput("");

    if (modeId === "business") {
      setEditBusinessName(meta.businessName || meta.name || def.title || "My Business");
      setEditBusinessLogo(meta.businessLogo || meta.logo || null);
      setEditBusinessType(meta.businessType || "Private Limited (Pvt Ltd)");
      setEditBusinessEmail(meta.businessEmail || "");
      setEditBusinessPhone(meta.businessPhone || "");
      setEditBusinessAddress(meta.businessAddress || meta.address || "");
      setEditFinancialYear(meta.financialYear || "FY 2025 - 2026 (Apr - Mar)");
    }
  };

  // Add member in Edit Modal
  const handleAddEditMember = (e) => {
    e.preventDefault();
    if (!editInviteInput.trim()) return;
    if (editMembers.some((m) => m.email.toLowerCase() === editInviteInput.trim().toLowerCase())) {
      return;
    }
    setEditMembers([...editMembers, { email: editInviteInput.trim(), role: editInviteRole }]);
    setEditInviteInput("");
  };

  // Remove member in Edit Modal
  const handleRemoveEditMember = (idxToRemove) => {
    setEditMembers(editMembers.filter((_, idx) => idx !== idxToRemove));
  };

  // Save Edit Workspace Changes
  const handleSaveEditWorkspace = async () => {
    if (!workspaceToEdit) return;

    const businessEditData = workspaceToEdit === "business" ? {
      businessName: editBusinessName.trim() || editName.trim() || "My Business",
      businessLogo: editBusinessLogo || null,
      logo: editBusinessLogo || null,
      businessType: editBusinessType,
      businessEmail: editBusinessEmail.trim(),
      businessPhone: editBusinessPhone.trim(),
      address: editBusinessAddress.trim(),
      businessAddress: editBusinessAddress.trim(),
      financialYear: editFinancialYear,
    } : {};

    const newMeta = {
      ...workspaceMetadata,
      [workspaceToEdit]: {
        ...(workspaceMetadata[workspaceToEdit] || {}),
        name: (workspaceToEdit === "business" ? editBusinessName.trim() : editName.trim()) || WORKSPACE_DEFINITIONS[workspaceToEdit]?.title,
        currency: editCurrency,
        members: editMembers,
        enableContributions: editContributions,
        ...businessEditData,
        updatedAt: new Date().toISOString(),
      },
    };
    setWorkspaceMetadata(newMeta);
    localStorage.setItem("finflow_workspaces_config", JSON.stringify(newMeta));

    // Directly sync members to Family Members if editing Family workspace
    if (workspaceToEdit === "family" && editMembers.length > 0) {
      for (const m of editMembers) {
        try {
          const email = (m.email || "").trim();
          let name = "";
          if (email.includes("@")) {
            const userPart = email.split("@")[0];
            name = userPart.charAt(0).toUpperCase() + userPart.slice(1);
          } else {
            name = email || "Family Member";
          }
          await createFamilyMember({
            name,
            email,
            role: m.role || "Member",
            relationship: "Other",
            spendingLimit: 0,
          });
        } catch (memberErr) {
          console.warn("Family member sync notice:", memberErr);
        }
      }
    }

    // Directly sync members to Business Employees if editing Business workspace
    if (workspaceToEdit === "business" && editMembers.length > 0) {
      for (const m of editMembers) {
        try {
          const email = (m.email || "").trim();
          let name = "";
          if (email.includes("@")) {
            const userPart = email.split("@")[0];
            name = userPart.charAt(0).toUpperCase() + userPart.slice(1);
          } else {
            name = email || "Team Member";
          }
          await createEmployee({
            name,
            email,
            role: m.role === "Admin" ? "Admin" : "Employee",
            designation: m.role || "Employee",
            department: "General",
            workspace: "business",
          });
        } catch (empErr) {
          console.warn("Business employee sync notice:", empErr);
        }
      }
    }

    setSavedToast(`${editName || "Workspace"} updated successfully!`);
    setTimeout(() => setSavedToast(""), 3500);
    setWorkspaceToEdit(null);
  };

  // Workspace Switch Handler
  const handleSwitchWorkspace = (modeId) => {
    if (modeId === activeMode) return;
    switchMode(modeId);
    setSavedToast(`Switched to ${workspaceMetadata[modeId]?.name || WORKSPACE_DEFINITIONS[modeId]?.title || modeId}!`);
    setTimeout(() => setSavedToast(""), 3000);
  };

  // Delete Workspace Action
  const handleConfirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    
    if (selectedModes.length <= 1) {
      setSavedToast("You must keep at least one active workspace.");
      setWorkspaceToDelete(null);
      return;
    }

    const remainingModes = selectedModes.filter((m) => m !== workspaceToDelete);
    const deletedTitle = workspaceMetadata[workspaceToDelete]?.name || WORKSPACE_DEFINITIONS[workspaceToDelete]?.title || workspaceToDelete;

    try {
      const nextActiveMode = workspaceToDelete === activeMode ? remainingModes[0] : activeMode;

      try {
        await apiUpdateSelectedModes({
          selectedModes: remainingModes,
          defaultMode: nextActiveMode,
        });
      } catch (err) {
        console.warn("Backend update skipped, updating locally:", err);
      }

      updateSelectedModes(remainingModes);
      if (workspaceToDelete === activeMode) {
        switchMode(nextActiveMode);
      }

      const newMeta = { ...workspaceMetadata };
      delete newMeta[workspaceToDelete];
      setWorkspaceMetadata(newMeta);
      localStorage.setItem("finflow_workspaces_config", JSON.stringify(newMeta));

      setSavedToast(`${deletedTitle} deleted successfully.`);
      setTimeout(() => setSavedToast(""), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setWorkspaceToDelete(null);
    }
  };

  // Password Update Handler (Matches Image 2)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: "", isError: false });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match.", isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: "Password must be at least 6 characters.", isError: true });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await changeUserPassword({ currentPassword, newPassword });
      setPasswordMsg({ text: res.data?.message || "Password updated successfully!", isError: false });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error updating password. Please verify current password.";
      setPasswordMsg({ text: errorMsg, isError: true });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#1F2937] tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Customize enabled workspace profiles, switching, and security controls
        </p>
      </div>

      {/* Toast Notification */}
      {savedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-sm font-semibold shadow-xs animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: WORKSPACE PROFILES & SWITCHING (BOX CONTAINER)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-5">
        {/* Header & Add Workspace Button */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1F2937]">Your Workspaces</h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">These are the workspaces you have access to.</p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#005B4F] text-[#005B4F] hover:bg-[#005B4F]/5 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workspace</span>
          </button>
        </div>

        {/* Workspaces Cards List */}
        <div className="space-y-3.5">
          {/* Render Selected Workspaces */}
          {selectedModes.map((modeId) => {
            const def = WORKSPACE_DEFINITIONS[modeId] || {
              id: modeId,
              title: modeId.charAt(0).toUpperCase() + modeId.slice(1) + " Workspace",
              description: "Manage your finances",
              icon: LayoutGrid,
              emoji: "💼",
            };
            const isActive = modeId === activeMode;
            const IconComp = def.icon || LayoutGrid;
            const customTitle = workspaceMetadata[modeId]?.name || def.title;

            return (
              <div
                key={modeId}
                className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-gray-300 hover:shadow-xs transition-all duration-200 p-5 sm:p-6 relative overflow-visible group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 transition-transform overflow-hidden ${
                        (workspaceMetadata[modeId]?.logo || workspaceMetadata[modeId]?.businessLogo)
                          ? "border border-gray-200 bg-white"
                          : modeId === "personal"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : modeId === "family"
                          ? "bg-purple-50 text-purple-600 border border-purple-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}
                    >
                      {workspaceMetadata[modeId]?.logo || workspaceMetadata[modeId]?.businessLogo ? (
                        <img
                          src={workspaceMetadata[modeId].logo || workspaceMetadata[modeId].businessLogo}
                          alt={`${customTitle} Logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconComp className="w-6 h-6" strokeWidth={1.8} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#1F2937] truncate">{customTitle}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5 leading-relaxed line-clamp-1">
                        {def.description}
                      </p>

                      {/* Business meta tags if configured */}
                      {modeId === "business" && workspaceMetadata[modeId]?.businessType && (
                        <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px]">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                            {workspaceMetadata[modeId].businessType}
                          </span>
                          {workspaceMetadata[modeId]?.financialYear && (
                            <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                              {workspaceMetadata[modeId].financialYear}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Status Badge */}
                      {isActive && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            Active Workspace
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Switch button, Edit icon, and Delete icon */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSwitchWorkspace(modeId)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-[#005B4F] bg-[#005B4F]/10 hover:bg-[#005B4F] hover:text-white transition-all shadow-xs active:scale-95 cursor-pointer mr-1"
                      >
                        Switch
                      </button>
                    )}

                    {/* Edit Option (Pencil Icon) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(modeId);
                      }}
                      className="p-2 rounded-xl text-gray-500 hover:text-[#005B4F] hover:bg-[#005B4F]/10 transition-colors cursor-pointer"
                      title="Edit Workspace"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete Option (Trash Icon) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedModes.length <= 1) {
                          setSavedToast("You must keep at least one active workspace.");
                          setTimeout(() => setSavedToast(""), 3000);
                          return;
                        }
                        setWorkspaceToDelete(modeId);
                      }}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        selectedModes.length > 1
                          ? "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={selectedModes.length > 1 ? "Delete Workspace" : "Default primary workspace cannot be deleted"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: ACCOUNT SECURITY (EXACT IMAGE 2 FORM BELOW)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#1F2937] mb-1">Account Security</h2>
        <p className="text-xs text-[#6B7280] mb-4">Change your account master password</p>

        {passwordMsg.text && (
          <p
            className={`text-xs font-semibold mb-3 ${
              passwordMsg.isError ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {passwordMsg.text}
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white"
          />
          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1F2937] text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUpdatingPassword ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EDIT WORKSPACE MODAL
         ───────────────────────────────────────────────────────────── */}
      {workspaceToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#D9DEE3] w-full max-w-[540px] p-6 sm:p-7 space-y-5 animate-[scaleIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Edit Workspace</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Update workspace details and member settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceToEdit(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If editing business workspace */}
            {workspaceToEdit === "business" ? (
              <div className="space-y-3.5">
                {/* Business Logo */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#005B4F]" /> Business Logo
                  </label>
                  <div className="flex items-center gap-3.5 p-3 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#005B4F]/50 transition-all">
                    <div className="relative w-14 h-14 rounded-xl border border-[#E5E7EB] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {editBusinessLogo ? (
                        <img
                          src={editBusinessLogo}
                          alt="Business Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Building className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#005B4F] text-[#1F2937] hover:text-[#005B4F] rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{editBusinessLogo ? "Change Logo" : "Upload Logo"}</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                            className="hidden"
                            onChange={handleEditLogoUpload}
                          />
                        </label>
                        {editBusinessLogo && (
                          <button
                            type="button"
                            onClick={handleRemoveEditLogo}
                            className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        PNG, JPG, SVG, WebP up to 2MB (Square recommended)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Name * */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#005B4F]" /> Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editBusinessName}
                    onChange={(e) => {
                      setEditBusinessName(e.target.value);
                      setEditName(e.target.value);
                    }}
                    placeholder="e.g. My Business"
                    required
                    className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>

                {/* Business Type */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#005B4F]" /> Business Type
                  </label>
                  <select
                    value={editBusinessType}
                    onChange={(e) => setEditBusinessType(e.target.value)}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                {/* Business Email & Business Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#005B4F]" /> Business Email
                    </label>
                    <input
                      type="email"
                      value={editBusinessEmail}
                      onChange={(e) => setEditBusinessEmail(e.target.value)}
                      placeholder="contact@business.com"
                      className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#005B4F]" /> Business Phone
                      </label>
                      <span className={`text-[10px] font-mono ${editBusinessPhone.length === 10 ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                        {editBusinessPhone.length}/10
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={editBusinessPhone}
                      onChange={(e) => setEditBusinessPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit phone"
                      className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#005B4F]" /> Address
                  </label>
                  <input
                    type="text"
                    value={editBusinessAddress}
                    onChange={(e) => setEditBusinessAddress(e.target.value)}
                    placeholder="Registered business address"
                    className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>

                {/* Financial Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#005B4F]" /> Financial Year
                  </label>
                  <select
                    value={editFinancialYear}
                    onChange={(e) => setEditFinancialYear(e.target.value)}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                  >
                    {FINANCIAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>{fy}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#6B7280]">Workspace Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
            )}

            {/* Members Section (if not personal) */}
            {workspaceToEdit !== "personal" && (
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-bold text-[#6B7280]">
                  Workspace Members ({editMembers.length})
                </label>

                {/* Add member row */}
                <form onSubmit={handleAddEditMember} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter email or mobile number"
                    value={editInviteInput}
                    onChange={(e) => setEditInviteInput(e.target.value)}
                    className="flex-1 h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005B4F]"
                  />
                  <select
                    value={editInviteRole}
                    onChange={(e) => setEditInviteRole(e.target.value)}
                    className="h-10 px-2.5 border border-[#E5E7EB] rounded-xl text-xs outline-none bg-white cursor-pointer text-[#1F2937]"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="h-10 px-3.5 bg-gray-100 hover:bg-gray-200 text-[#1F2937] text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Members list */}
                {editMembers.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {editMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                      >
                        <span className="font-semibold text-[#1F2937] truncate">{member.email}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                            {member.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEditMember(idx)}
                            className="text-gray-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
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

            {/* Contributions toggle */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#1F2937]">
                  {workspaceToEdit === "family"
                    ? "Enable family contributions"
                    : workspaceToEdit === "business"
                    ? "Enable team approvals"
                    : "Enable personal goals"}
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  {workspaceToEdit === "family"
                    ? "Allow members to contribute towards family expenses"
                    : "Allow members to submit expenses for approval"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editContributions}
                  onChange={(e) => setEditContributions(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005B4F]"></div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceToEdit(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditWorkspace}
                className="px-5 py-2.5 bg-[#005B4F] hover:bg-[#004A40] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DELETE WORKSPACE CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      {workspaceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#D9DEE3] w-full max-w-[420px] p-6 space-y-4 animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Delete Workspace</h3>
                <p className="text-xs text-[#6B7280]">This action will remove the workspace profile.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-[#1F2937]">
                {workspaceMetadata[workspaceToDelete]?.name || WORKSPACE_DEFINITIONS[workspaceToDelete]?.title || workspaceToDelete}
              </span>
              ? Your data in other active workspaces will remain safe.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setWorkspaceToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWorkspace}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ADD WORKSPACE MODAL (4-STEP FLOW AS SHOWN IN IMAGE 1)
         ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#D9DEE3] w-full max-w-[540px] overflow-hidden animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── STEP 1: SELECT WORKSPACE TYPE ── */}
            {modalStep === 1 && (
              <div className="p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#1F2937]">Add New Workspace</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Choose the type of workspace you want to add.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Workspace Options: Personal, Family, Business */}
                <div className="space-y-3">
                  {/* 1. Personal Workspace */}
                  <div
                    onClick={() => handleSelectWorkspaceType("personal")}
                    className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#005B4F] hover:bg-[#005B4F]/5 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1F2937] group-hover:text-[#005B4F] transition-colors">
                          Personal Workspace
                        </h4>
                        <p className="text-xs text-[#6B7280] line-clamp-1">
                          Manage your personal money, bills & expenses
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#005B4F] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* 2. Family Workspace */}
                  <div
                    onClick={() => handleSelectWorkspaceType("family")}
                    className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#7C3AED] hover:bg-[#7C3AED]/5 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1F2937] group-hover:text-[#7C3AED] transition-colors">
                          Family Workspace
                        </h4>
                        <p className="text-xs text-[#6B7280] line-clamp-1">
                          {WORKSPACE_DEFINITIONS.family.modalDescription}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* 3. Business Workspace */}
                  <div
                    onClick={() => handleSelectWorkspaceType("business")}
                    className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                          Business Workspace
                        </h4>
                        <p className="text-xs text-[#6B7280] line-clamp-1">
                          {WORKSPACE_DEFINITIONS.business.modalDescription}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: CONFIGURE / SET UP WORKSPACE ── */}
            {modalStep === 2 && (
              <div className="p-6 sm:p-7 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-[#1F2937]">
                      Set Up {selectedType === "family" ? "Family" : selectedType === "business" ? "Business" : "Personal"} Workspace
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Configure your workspace settings and team members.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* If Business Workspace: render 7 business fields */}
                {selectedType === "business" ? (
                  <div className="space-y-3.5">
                    {/* Business Logo */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#005B4F]" /> Business Logo
                      </label>
                      <div className="flex items-center gap-3.5 p-3 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#005B4F]/50 transition-all">
                        <div className="relative w-14 h-14 rounded-xl border border-[#E5E7EB] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                          {businessLogo ? (
                            <img
                              src={businessLogo}
                              alt="Business Logo Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <Building className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#005B4F] text-[#1F2937] hover:text-[#005B4F] rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{businessLogo ? "Change Logo" : "Upload Logo"}</span>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                            </label>
                            {businessLogo && (
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-1">
                            PNG, JPG, SVG, WebP up to 2MB (Square recommended)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Business Name * */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#005B4F]" /> Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          setCustomName(e.target.value);
                        }}
                        placeholder="e.g. My Business"
                        required
                        className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                      />
                    </div>

                    {/* Business Type */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#005B4F]" /> Business Type
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                      >
                        {BUSINESS_TYPES.map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Business Email & Business Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#005B4F]" /> Business Email
                        </label>
                        <input
                          type="email"
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="contact@business.com"
                          className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#005B4F]" /> Business Phone
                          </label>
                          <span className={`text-[10px] font-mono ${businessPhone.length === 10 ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                            {businessPhone.length}/10
                          </span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="10-digit phone"
                          className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] font-mono transition-all"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#005B4F]" /> Address
                      </label>
                      <input
                        type="text"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="Registered business address"
                        className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                      />
                    </div>

                    {/* Financial Year */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#374151] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#005B4F]" /> Financial Year
                      </label>
                      <select
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                      >
                        {FINANCIAL_YEARS.map((fy) => (
                          <option key={fy} value={fy}>{fy}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Standard Workspace Name for personal / family */
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#6B7280]">Workspace Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={selectedType === "family" ? "My Family" : "Personal Finance"}
                      className="w-full h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    />
                  </div>
                )}

                {/* Invite Members (Optional) */}
                {selectedType !== "personal" && (
                  <div className="space-y-2.5 pt-1">
                    <label className="block text-xs font-bold text-[#6B7280]">
                      Invite {selectedType === "family" ? "Family Members" : "Team Members"} (Optional)
                    </label>

                    {/* Member Add Row */}
                    <form onSubmit={handleAddMember} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter email or mobile number"
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        className="flex-1 h-10 px-3.5 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm outline-none focus:border-[#005B4F]"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="h-10 px-2.5 border border-[#E5E7EB] rounded-xl text-xs outline-none bg-white cursor-pointer text-[#1F2937]"
                      >
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="h-10 px-3.5 bg-gray-100 hover:bg-gray-200 text-[#1F2937] text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>

                    {/* Invited Members List */}
                    {invitedMembers.length > 0 && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                        {invitedMembers.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                          >
                            <span className="font-semibold text-[#1F2937] truncate">{member.email}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                                {member.role}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(idx)}
                                className="text-gray-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
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

                {/* Enable Contributions Toggle */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">
                      {selectedType === "family"
                        ? "Enable family contributions"
                        : selectedType === "business"
                        ? "Enable team approvals"
                        : "Enable personal goals"}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {selectedType === "family"
                        ? "Allow members to contribute towards family expenses"
                        : "Allow members to submit expenses for approval"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableContributions}
                      onChange={(e) => setEnableContributions(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005B4F]"></div>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleCreateWorkspace}
                    disabled={isCreatingWorkspace}
                    className="w-full sm:w-auto px-6 h-11 bg-[#005B4F] hover:bg-[#004A40] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-[#005B4F]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingWorkspace ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Create {selectedType === "family" ? "Family" : selectedType === "business" ? "Business" : "Personal"} Workspace</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={Boolean(alertMessage)}
        onClose={() => setAlertMessage("")}
        title="File Upload Notice"
        message={alertMessage}
        type="warning"
      />
    </div>
  );
}
