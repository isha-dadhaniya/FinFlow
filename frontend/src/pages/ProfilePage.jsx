import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import Toast from "../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";
import { fetchUserProfile, updateUserProfile, deleteUserProfile } from "../api/services";
import { Camera, Check, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [avatar, setAvatar] = useState(null);

  // Modals & Feedback
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetchUserProfile();
      if (res.data) {
        setFullName(res.data.fullName || "User");
        setEmail(res.data.email || "");
        setMobile(res.data.mobile || "");
        setAddress(res.data.address || "");
        setDob(res.data.dob || "");
      }
    } catch (err) {
      const cached = JSON.parse(localStorage.getItem("user") || "{}");
      setFullName(cached.fullName || "User");
      setEmail(cached.email || "");
      setMobile(cached.mobile || "");
      setAddress(cached.address || "");
      setDob(cached.dob || "");
    }
  };

  // Avatar Upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setToast({ message: "Profile picture updated!", type: "success" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setToast({ message: "Profile picture removed.", type: "info" });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile({ fullName, mobile, address, dob });
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.fullName = fullName;
      user.mobile = mobile;
      user.address = address;
      user.dob = dob;
      localStorage.setItem("user", JSON.stringify(user));
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to update profile.", type: "error" });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUserProfile();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/Login");
    } catch (err) {
      setToast({ message: "Failed to delete profile.", type: "error" });
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal details and profile info."
      />

      {/* Single Clean Profile Card */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#D9DEE3]/60 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-8">
        {/* Profile Picture Header */}
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#005B4F]/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#005B4F] text-white text-2xl font-extrabold flex items-center justify-center ring-4 ring-[#005B4F]/20">
                {fullName ? fullName[0].toUpperCase() : "U"}
              </div>
            )}
            <label
              htmlFor="avatar-input"
              className="absolute bottom-0 right-0 p-1.5 bg-[#005B4F] text-white rounded-full cursor-pointer hover:bg-[#004A40] transition-colors shadow-md"
              title="Upload Picture"
            >
              <Camera className="w-3.5 h-3.5" />
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">{fullName}</h3>
            <p className="text-xs text-gray-500">{email}</p>
            <div className="flex items-center gap-3 mt-2">
              <label
                htmlFor="avatar-input-2"
                className="text-xs font-bold text-[#005B4F] hover:underline cursor-pointer"
              >
                Upload Picture
                <input
                  id="avatar-input-2"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Details Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-medium"
                placeholder="Not provided"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-medium"
              placeholder="e.g. 123 Main Street, City, State, Country"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete Profile
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#005B4F] text-white font-bold text-xs rounded-xl hover:bg-[#004A40] shadow-md cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Profile & Account"
        message="Are you sure you want to permanently delete your profile and all associated data? This action cannot be undone."
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </div>
  );
}
