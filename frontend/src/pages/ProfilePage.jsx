import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Building, Camera, GraduationCap, Mail, Save, User } from "lucide-react";
import { SCHOOL_MAJORS, getMajorsForSchool } from "../constants/schoolMajor.constant";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();

  const [editableFields, setEditableFields] = useState({
    school: authUser?.school || "",
    major: authUser?.major || "",
  });
  const handleImageUpload = async (e) => {};
  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        school: editableFields.school,
        major: editableFields.major,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <div className="min-h-screen pt-12">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile Information</p>
          </div>

          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={authUser.profilePic || "/avatar_original.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer
                  transition-all duration-200
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.fullName}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                AUI ID
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.auiId}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Building className="w-4 h-4" />
                School
              </div>
              <select
                className="select select-bordered w-full"
                value={editableFields.school}
                onChange={(e) => {
                  setEditableFields({
                    ...editableFields,
                    school: e.target.value,
                    major: "", // Reset major when school changes
                  });
                }}
              >
                <option value="">Select School</option>
                {Object.entries(SCHOOL_MAJORS).map(([code, { name }]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Major
              </div>
              <select
                className="select select-bordered w-full"
                value={editableFields.major}
                onChange={(e) =>
                  setEditableFields({
                    ...editableFields,
                    major: e.target.value,
                  })
                }
                disabled={!editableFields.school}
              >
                <option value="">Select Major</option>
                {editableFields.school &&
                  getMajorsForSchool(editableFields.school).map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
              </select>
            </div>

            <button
              className={`btn btn-primary w-full ${
                isUpdatingProfile ? "loading" : ""
              }`}
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              <Save className="w-4 h-4" />
              {isUpdatingProfile ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
