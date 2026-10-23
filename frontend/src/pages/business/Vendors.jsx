import React, { useState, useEffect } from "react";
import { Plus, Store, Trash2, Edit2, X, Phone, Mail, CheckCircle2, AlertCircle, Search } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const formatCurrency = (a) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);

const VENDOR_CATEGORIES = [
  "General",
  "Supplies & Inventory",
  "Raw Materials",
  "IT & Software",
  "Logistics & Shipping",
  "Utilities & Rent",
  "Professional Services",
  "Marketing & Advertising",
  "Maintenance & Repairs",
  "Other",
];

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteVendor, setDeleteVendor] = useState(null);
  const [form, setForm] = useState({ name: "", gstNumber: "", contact: "", email: "", category: "General" });
  const [contactError, setContactError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const loadData = async () => {
    try {
      const t = localStorage.getItem("token");
      const r = await fetch(`${API}/workspace/vendors?workspace=business`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await r.json();
      setVendors(Array.isArray(d) ? d : []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setForm({ name: "", gstNumber: "", contact: "", email: "", category: "General" });
    setContactError("");
    setServerError("");
    setShowForm(true);
  };

  const openEditModal = (v) => {
    setEditItem(v);
    // Sanitize contact to 10 digits max if existing data had more
    const sanitizedContact = (v.contact || "").replace(/\D/g, "").slice(0, 10);
    setForm({
      name: v.name || "",
      gstNumber: v.gstNumber || "",
      contact: sanitizedContact,
      email: v.email || "",
      category: v.category || "General",
    });
    setContactError("");
    setServerError("");
    setShowForm(true);
  };

  const handleContactChange = (e) => {
    // Only allow numeric digits and limit strictly to 10
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, contact: digits }));
    if (contactError) setContactError("");
  };

  const handleContactPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, contact: digits }));
    if (contactError) setContactError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setContactError("");
    setServerError("");

    const cleanContact = (form.contact || "").replace(/\D/g, "");

    // Validate that contact number must be exactly 10 digits
    if (!cleanContact) {
      setContactError("Contact number is required and must be 10 digits");
      return;
    }
    if (cleanContact.length !== 10) {
      setContactError(`Contact number must be exactly 10 digits (currently ${cleanContact.length})`);
      return;
    }

    setSubmitting(true);
    try {
      const t = localStorage.getItem("token");
      const url = editItem
        ? `${API}/workspace/vendors/${editItem._id}`
        : `${API}/workspace/vendors`;

      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          ...form,
          contact: cleanContact,
          workspace: "business",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || "Failed to save vendor");
        setSubmitting(false);
        return;
      }

      setShowForm(false);
      setEditItem(null);
      setForm({ name: "", gstNumber: "", contact: "", email: "", category: "General" });
      loadData();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteVendor) return;
    try {
      const t = localStorage.getItem("token");
      await fetch(`${API}/workspace/vendors/${deleteVendor._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      loadData();
    } catch (err) {
      console.error("Failed to delete vendor:", err);
    } finally {
      setDeleteVendor(null);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.contact?.includes(q) ||
      v.gstNumber?.toLowerCase().includes(q) ||
      v.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Vendors</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Track vendor spending, GST, and 10-digit contacts</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {vendors.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendors by name, GST, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#005B4F] transition-all"
            />
          </div>
          <span className="text-xs text-gray-400">
            Showing {filteredVendors.length} of {vendors.length} vendor{vendors.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">
              {search ? "No vendors match your search" : "No vendors added"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Try clearing your search query" : "Add your first vendor to begin tracking payments"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filteredVendors.map((v) => (
              <div key={v._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">{v.name}</p>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#6B7280] mt-1">
                      <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                        {v.category || "General"}
                      </span>
                      {v.gstNumber && (
                        <span>
                          GST: <span className="font-mono text-gray-700">{v.gstNumber}</span>
                        </span>
                      )}
                      {v.contact && (
                        <span className="flex items-center gap-1 font-mono text-[#005B4F] bg-[#005B4F]/5 px-2 py-0.5 rounded-md font-medium">
                          <Phone className="w-3 h-3 text-[#005B4F]" />
                          {v.contact.length === 10
                            ? `${v.contact.slice(0, 5)} ${v.contact.slice(5)}`
                            : v.contact}
                        </span>
                      )}
                      {v.email && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {v.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#1F2937]">{formatCurrency(v.totalSpending)}</p>
                    <p className="text-[10px] text-[#9CA3AF]">Total Spending</p>
                  </div>
                  <button
                    onClick={() => openEditModal(v)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Edit Vendor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteVendor(v)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit" : "Add"} Vendor</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Enter vendor details and 10-digit contact number</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {serverError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Supplies"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] uppercase font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white transition-all cursor-pointer"
                  >
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#374151] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#005B4F]" /> Contact <span className="text-red-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono font-medium ${
                        form.contact.length === 10
                          ? "text-emerald-600 font-bold"
                          : form.contact.length > 0
                          ? "text-amber-600"
                          : "text-gray-400"
                      }`}
                    >
                      {form.contact.length}/10
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={form.contact}
                      onChange={handleContactChange}
                      onPaste={handleContactPaste}
                      required
                      className={`w-full h-11 px-3.5 pr-8 border rounded-xl text-sm font-mono tracking-wide outline-none transition-all ${
                        contactError
                          ? "border-red-400 bg-red-50/20 focus:border-red-500"
                          : form.contact.length === 10
                          ? "border-emerald-400 bg-emerald-50/10 focus:border-[#005B4F]"
                          : "border-[#E5E7EB] focus:border-[#005B4F]"
                      }`}
                    />
                    {form.contact.length === 10 && (
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  {contactError ? (
                    <p className="text-[10px] text-red-600 font-medium mt-1 leading-tight flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {contactError}
                    </p>
                  ) : form.contact.length > 0 && form.contact.length < 10 ? (
                    <p className="text-[10px] text-amber-600 mt-1">
                      {10 - form.contact.length} more digit{10 - form.contact.length > 1 ? "s" : ""} needed
                    </p>
                  ) : form.contact.length === 10 ? (
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">✓ Valid 10-digit number</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">Must be exactly 10 digits</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="vendor@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editItem ? "Update Vendor" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteVendor)}
        onClose={() => setDeleteVendor(null)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={
          deleteVendor
            ? `Are you sure you want to delete vendor "${deleteVendor.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this vendor?"
        }
        confirmText="Delete Vendor"
        isDanger={true}
      />
    </div>
  );
}
