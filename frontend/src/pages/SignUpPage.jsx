import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { CircleUser, MessageSquare, Mail } from "lucide-react";
import { useState } from "react";
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
  const validateForm = () => {
    // Check if all required fields are filled and valid
    const isValidEmail = formData.email.includes('@aui.ma'); // Ensure it's an AUI email
    const isValidPassword = formData.password.length >= 6; // Minimum 6 characters
    const isValidAuiId = /^\d{6}$/.test(formData.auiId); // Must be 6 digits

    return (
      formData.fullName.trim() !== '' &&
      isValidAuiId &&
      formData.school !== '' &&
      formData.major !== '' &&
      formData.role !== '' &&
      isValidEmail &&
      isValidPassword
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form container */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and header section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center
              group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
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
                    placeholder="John Doe"
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button - full width with loading state */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSigningUp || !validateForm()}
            >
              {isSigningUp ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
      {/* Right side - Reserved for future content */}
    </div>
  );
};

export default SignUpPage;
