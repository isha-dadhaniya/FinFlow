import React, { useState, useEffect } from "react";
import { ClipboardCheck, Check, X, AlertCircle, Clock, CheckCircle2, XCircle, Search, Filter } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function Approvals() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalId, setRejectModalId] = useState(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/workspace/reimbursements?workspace=business`, { headers: headers() });
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Approvals load error:", err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (id, status) => {
    try {
      await fetch(`${API}/workspace/reimbursements/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ status }),
      });
      setRejectModalId(null);
      setRejectReason("");
      loadClaims();
    } catch (err) {
      console.error("Update claim status error:", err);
    }
  };

  const filtered = filter === "all" ? claims : claims.filter((c) => c.status === filter);
  const pendingCount = claims.filter((c) => c.status === "Submitted" || c.status === "Under Review" || c.status === "Draft").length;

  const statusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">Approved</span>;
      case "Paid":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700">Paid Out</span>;
      case "Rejected":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Manager Approvals</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Review, approve, and disburse employee expense claims</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
          <Clock className="w-4 h-4" />
          <span>{pendingCount} Pending Action{pendingCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "Submitted", "Under Review", "Approved", "Rejected", "Paid"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === s ? "bg-[#005B4F] text-white shadow-md shadow-[#005B4F]/20" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All Claims" : s}
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading claims...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No approval claims found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((claim) => (
              <div key={claim._id} className="p-5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#005B4F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {claim.employeeName ? claim.employeeName[0].toUpperCase() : "E"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1F2937]">{claim.employeeName}</p>
                      {statusBadge(claim.status)}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{claim.description || "Business reimbursement claim"}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">
                      Category: {claim.category || "General"} · Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-lg font-extrabold text-[#1F2937]">{formatCurrency(claim.amount)}</p>

                  {/* Actions for pending items */}
                  {claim.status !== "Approved" && claim.status !== "Paid" && claim.status !== "Rejected" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateClaimStatus(claim._id, "Approved")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setRejectModalId(claim._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {claim.status === "Approved" && (
                    <button
                      onClick={() => updateClaimStatus(claim._id, "Paid")}
                      className="px-3.5 py-1.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all cursor-pointer"
                    >
                      Disburse / Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectModalId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-[#1F2937] mb-2">Reject Claim</h2>
            <p className="text-xs text-[#6B7280] mb-4">Please specify reason for rejecting this claim.</p>
            <textarea
              placeholder="e.g. Missing valid GST tax receipt"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateClaimStatus(rejectModalId, "Rejected")}
                className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2.5 border border-[#E5E7EB] text-xs font-bold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
