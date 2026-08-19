import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Shield, Bell, Moon, Sun, DollarSign, Globe, Lock, Save, Check, Users, Briefcase, User } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";

export default function Settings() {
  const { activeMode, selectedModes, updateSelectedModes, switchMode } = useWorkspace();
  const [currency, setCurrency] = useState("INR");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [overBudgetWarning, setOverBudgetWarning] = useState(true);
  const [defaultWorkspace, setDefaultWorkspace] = useState(activeMode);
  const [enabledProfiles, setEnabledProfiles] = useState(selectedModes || ["personal"]);
  const [savedToast, setSavedToast] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem("finflow_settings") || "{}");
    if (savedSettings.currency) setCurrency(savedSettings.currency);
    if (savedSettings.emailAlerts !== undefined) setEmailAlerts(savedSettings.emailAlerts);
    if (savedSettings.smsAlerts !== undefined) setSmsAlerts(savedSettings.smsAlerts);
    if (savedSettings.overBudgetWarning !== undefined) setOverBudgetWarning(savedSettings.overBudgetWarning);
    if (savedSettings.defaultWorkspace) setDefaultWorkspace(savedSettings.defaultWorkspace);
  }, []);

  useEffect(() => {
    setEnabledProfiles(selectedModes || ["personal"]);
  }, [selectedModes]);

  const toggleProfile = (profileId) => {
    if (enabledProfiles.includes(profileId)) {
      if (enabledProfiles.length === 1) {
        return; // Keep at least one profile enabled
      }
      setEnabledProfiles(enabledProfiles.filter((p) => p !== profileId));
    } else {
      setEnabledProfiles([...enabledProfiles, profileId]);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    const settings = {
      currency,
      emailAlerts,
      smsAlerts,
      overBudgetWarning,
      defaultWorkspace: enabledProfiles.includes(defaultWorkspace) ? defaultWorkspace : enabledProfiles[0],
    };
    localStorage.setItem("finflow_settings", JSON.stringify(settings));
    updateSelectedModes(enabledProfiles);
    if (enabledProfiles.includes(defaultWorkspace)) {
      switchMode(defaultWorkspace);
    } else {
      switchMode(enabledProfiles[0]);
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg(data.message || "Failed to update password.");
      }
    } catch (err) {
      setPasswordMsg("Error updating password.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">System Settings & Preferences</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Customize enabled workspace profiles, notifications, and security controls</p>
      </div>

      {savedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-semibold animate-[fadeIn_0.2s_ease-out]">
          <Check className="w-4 h-4 text-emerald-600" />
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#1F2937] mb-1">Enabled Workspace Profiles</h2>
        <p className="text-xs text-[#6B7280] mb-4">
          Select which profiles you want available in your FinFlow workspace switcher.
        </p>

        {/* Enabled Profile Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div
            onClick={() => toggleProfile("personal")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              enabledProfiles.includes("personal")
                ? "border-[#005B4F] bg-[#005B4F]/5 shadow-xs"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">🧑</span>
              <input
                type="checkbox"
                checked={enabledProfiles.includes("personal")}
                onChange={() => toggleProfile("personal")}
                className="w-4 h-4 text-[#005B4F] rounded border-gray-300 pointer-events-none"
              />
            </div>
            <p className="text-sm font-bold text-[#1F2937]">Personal Finance</p>
            <p className="text-xs text-[#6B7280]">My personal money, bills & expenses</p>
          </div>

          <div
            onClick={() => toggleProfile("family")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              enabledProfiles.includes("family")
                ? "border-[#2A9D8F] bg-[#2A9D8F]/5 shadow-xs"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">👨‍👩‍👧</span>
              <input
                type="checkbox"
                checked={enabledProfiles.includes("family")}
                onChange={() => toggleProfile("family")}
                className="w-4 h-4 text-[#2A9D8F] rounded border-gray-300 pointer-events-none"
              />
            </div>
            <p className="text-sm font-bold text-[#1F2937]">Family Workspace</p>
            <p className="text-xs text-[#6B7280]">Household pool, joint loans & goals</p>
          </div>

          <div
            onClick={() => toggleProfile("business")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              enabledProfiles.includes("business")
                ? "border-[#1E232A] bg-[#1E232A]/5 shadow-xs"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">🏢</span>
              <input
                type="checkbox"
                checked={enabledProfiles.includes("business")}
                onChange={() => toggleProfile("business")}
                className="w-4 h-4 text-[#1E232A] rounded border-gray-300 pointer-events-none"
              />
            </div>
            <p className="text-sm font-bold text-[#1F2937]">Business Operations</p>
            <p className="text-xs text-[#6B7280]">Corporate loans, invoices & approvals</p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="max-w-md">
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Default Workspace</label>
            <select
              value={defaultWorkspace}
              onChange={(e) => setDefaultWorkspace(e.target.value)}
              className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
            >
              {enabledProfiles.map((p) => (
                <option key={p} value={p}>
                  {p === "personal" && "Personal"}
                  {p === "family" && "Family"}
                  {p === "business" && "Business"}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overBudgetWarning}
                onChange={(e) => setOverBudgetWarning(e.target.checked)}
                className="w-4 h-4 text-[#005B4F] rounded border-[#E5E7EB]"
              />
              <span className="text-sm font-medium text-[#1F2937]">Enable 80% & 100% Budget Warning Alerts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#005B4F] rounded border-[#E5E7EB]"
              />
              <span className="text-sm font-medium text-[#1F2937]">Send email notifications for upcoming bill deadlines</span>
            </label>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </form>
      </div>

      {/* Security & Password */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#1F2937] mb-2">Account Security</h2>
        <p className="text-xs text-[#6B7280] mb-4">Change your account master password</p>

        {passwordMsg && (
          <p className={`text-xs font-semibold mb-3 ${passwordMsg.includes("success") ? "text-emerald-600" : "text-rose-600"}`}>
            {passwordMsg}
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1F2937] text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
          >
            <Lock className="w-4 h-4" /> Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
