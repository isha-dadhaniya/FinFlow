import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, X, Shield, Eye, UserPlus, Mail, IndianRupee, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchFamilyMembers, createFamilyMember, updateFamilyMember, deleteFamilyMember } from "../../api/services";
import ConfirmModal from "../../components/common/ConfirmModal";

const ROLES = ["Owner", "Parent/Admin", "Member", "Child"];
const RELATIONSHIPS = ["Father", "Mother", "Son", "Daughter", "Spouse", "Sibling", "Grandparent", "Other"];

const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

export default function FamilyMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteMemberId, setDeleteMemberId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    relationship: "Other",
    email: "",
    role: "Member",
    spendingLimit: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let apiMembers = [];
      try {
        const res = await fetchFamilyMembers();
        apiMembers = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error("Error loading family members:", err);
        try {
          const token = localStorage.getItem("token");
          const directRes = await fetch("http://localhost:5000/api/family/members", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await directRes.json();
          apiMembers = Array.isArray(data) ? data : [];
        } catch {
          apiMembers = [];
        }
      }

      // Check workspace metadata for invited family members created in Settings
      try {
        const wsConfig = JSON.parse(localStorage.getItem("finflow_workspaces_config") || "{}");
        const familyInvites = wsConfig?.family?.members || [];
        
        const existingEmails = new Set(apiMembers.map((m) => (m.email || "").toLowerCase()).filter(Boolean));
        const localMembers = [];

        for (const invite of familyInvites) {
          const email = (invite.email || "").trim();
          if (email && !existingEmails.has(email.toLowerCase())) {
            const userPart = email.includes("@") ? email.split("@")[0] : email;
            const name = userPart.charAt(0).toUpperCase() + userPart.slice(1);
            localMembers.push({
              _id: `ws-${email}`,
              name,
              email,
              role: invite.role || "Member",
              relationship: "Other",
              spendingLimit: 0,
              createdAt: new Date().toISOString(),
            });
            existingEmails.add(email.toLowerCase());
          }
        }
        setMembers([...apiMembers, ...localMembers]);
      } catch {
        setMembers(apiMembers);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ name: "", relationship: "Other", email: "", role: "Member", spendingLimit: "" });
    setErrorMsg("");
    setShowForm(true);
  };

  const handleOpenEdit = (m) => {
    setEditItem(m);
    setForm({
      name: m.name || "",
      relationship: m.relationship || "Other",
      email: m.email || "",
      role: m.role || "Member",
      spendingLimit: m.spendingLimit ? String(m.spendingLimit) : "",
    });
    setErrorMsg("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Please enter the member's full name");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        name: form.name.trim(),
        relationship: form.relationship,
        email: form.email.trim(),
        role: form.role,
        spendingLimit: form.spendingLimit ? Number(form.spendingLimit) : 0,
      };

      if (editItem) {
        await updateFamilyMember(editItem._id, payload);
      } else {
        await createFamilyMember(payload);
      }

      setShowForm(false);
      setEditItem(null);
      setForm({ name: "", relationship: "Other", email: "", role: "Member", spendingLimit: "" });
      setSuccessMsg(editItem ? "Member updated successfully!" : "Family member added successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
      loadData();
    } catch (err) {
      console.error("Error saving member:", err);
      const msg = err.response?.data?.message || err.message || "Failed to save member. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMemberId) return;
    try {
      await deleteFamilyMember(deleteMemberId);
      setSuccessMsg("Family member removed successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
      setDeleteMemberId(null);
      loadData();
    } catch (err) {
      console.error("Error deleting member:", err);
      setErrorMsg("Failed to delete member");
    }
  };

  const roleColors = {
    Owner: "bg-purple-50 text-purple-700 border border-purple-200",
    "Parent/Admin": "bg-blue-50 text-blue-700 border border-blue-200",
    Member: "bg-[#005B4F]/10 text-[#005B4F] border border-[#005B4F]/20",
    Child: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  const roleIcons = {
    Owner: Shield,
    "Parent/Admin": Shield,
    Member: Users,
    Child: Eye,
  };

  return (
    <div className="space-y-6 w-full max-w-[1640px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">Family Members</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage family workspace members, permissions, and spending allowances</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl animate-pulse border border-[#E5E7EB] p-5 space-y-4" />
          ))
        ) : members.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">No Family Members Added</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Add your spouse, parents, or children to manage shared expenses, household budgets, and bill splitting together.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Member
            </button>
          </div>
        ) : (
          members.map((m) => {
            const RoleIcon = roleIcons[m.role] || Users;
            return (
              <div
                key={m._id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005B4F] to-[#008573] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                        {m.name ? m.name[0].toUpperCase() : "M"}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1F2937] leading-tight">{m.name}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{m.relationship || "Family Member"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] transition-colors cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteMemberId(m._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {m.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  )}

                  {m.spendingLimit > 0 && (
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-[#F4F6F8] p-2.5 rounded-xl mt-3">
                      <span className="text-gray-500">Monthly Allowance:</span>
                      <span className="text-[#005B4F] font-bold">{formatINR(m.spendingLimit)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full flex items-center gap-1 ${roleColors[m.role] || roleColors.Member}`}>
                    <RoleIcon className="w-3 h-3" />
                    {m.role || "Member"}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Added: {new Date(m.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit Family Member" : "Add Family Member"}</h2>
                  <p className="text-xs text-[#6B7280]">Join family finances, assign bills and view permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Relationship</label>
                  <select
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Workspace Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. member@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Monthly Allowance / Limit (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  min="0"
                  value={form.spendingLimit}
                  onChange={(e) => setForm({ ...form, spendingLimit: e.target.value })}
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 transition-all"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-gray-300 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editItem ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteMemberId)}
        onClose={() => setDeleteMemberId(null)}
        onConfirm={confirmDelete}
        title="Delete Member"
        message="Are you sure you want to remove this family member? All assigned budgets and permissions will be removed."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
