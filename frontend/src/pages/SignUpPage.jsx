import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { CircleUser, MessageSquare, Mail, Loader2, Lock, EyeOff, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import { toast } from "react-hot-toast";
import {
  SCHOOL_MAJORS,
  findSchoolForMajor,
  getAllMajors,
  getMajorsForSchool,
} from "../constants/schoolMajor.constant";

const SignUpPage = () => {
  // State management for password visibility and form data
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    auiId: "",
    school: "",
    major: "",
    role: "Student", // Default role set to Student
    email: "",
    password: "",
  });
  const { signup, isSigningUp } = useAuthStore();

  // Validate form fields
  const validateForm = (showToast = false) => {
    const errors = [];
    const isValidEmail = formData.email.includes("@aui.ma"); 
    const isValidPassword = formData.password.length >= 6;
    const isValidAuiId = /^\d{6}$/.test(formData.auiId);

    if (formData.password.trim() === "") errors.push("Password is required");
    if (formData.email.trim() === "") errors.push("Email is required");
    if (formData.auiId.trim() === "") errors.push("AUI ID is required");
    if (formData.fullName.trim() === "") errors.push("Full name is required");
    if (!isValidPassword) errors.push("Password must be at least 6 characters");
    if (!isValidAuiId) errors.push("AUI ID must be 6 digits");
    if (!isValidEmail) errors.push("Email must be an AUI email");
    if (formData.school.trim() === "") errors.push("School is required");

    if (showToast && errors.length > 0) {
      // Show first error
      toast.error(errors[0]);
      // If there are more errors, show them after a delay
      errors.slice(1).forEach((error, index) => {
        setTimeout(() => {
          toast.error(error);
        }, (index + 1) * 1000);
      });
    }

    return errors.length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm(true);
    if (success) {
      signup(formData);
    }
  };

  // Handle school change - Resets major when school changes
  const handleSchoolChange = (e) => {
    const newSchool = e.target.value;
    setFormData({
      ...formData,
      school: newSchool,
      major: "", // Reset major when school changes
    });
  };

  // Handle major change - Automatically sets corresponding school
  const handleMajorChange = (e) => {
    const newMajor = e.target.value;
    const correspondingSchool = findSchoolForMajor(newMajor);
    setFormData({
      ...formData,
      major: newMajor,
      school: correspondingSchool, // Automatically set school based on major
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-200">
      {/* Left side - Form container */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-base-100">
        <div className="w-full max-w-md space-y-2">
          {/* Logo and header section */}
          <div className="text-center mb-4">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center
              group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2 text-base-content">
                Create Account
              </h1>
              <p className="text-base-content/60">
                Get started with your free account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name field - spans full width */}
              <div className="form-control col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Full Name</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CircleUser className="w-5 h-5 text-neutral-content" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Aziz Albogos"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* AUI ID and Role fields - side by side */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">AUI Id</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered pl-10 w-full"
                    placeholder="123456"
                    value={formData.auiId}
                    onChange={(e) =>
                      setFormData({ ...formData, auiId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Role</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>

              {/* School and Major fields - side by side with dynamic relationship */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">School</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.school}
                  onChange={handleSchoolChange}
                >
                  <option value="">Select School</option>
                  {Object.entries(SCHOOL_MAJORS).map(([code, { name }]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Major</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.major}
                  onChange={handleMajorChange}
                >
                  <option value="">Select Major</option>
                  {(formData.school
                    ? getMajorsForSchool(formData.school)
                    : getAllMajors()
                  ).map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email field - full width */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className="input input-bordered pl-10 w-full"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Password field - full width with visibility toggle */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button - full width with loading state */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading ...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          {/* Login link */}
          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side - Reserved for future content */}
      <AuthImagePattern
        title="Welcome to AUI's First Social Platform"
        subtitle="Connect with your peers and professors"
      />
    </div>
  );
};

export default SignUpPage;
