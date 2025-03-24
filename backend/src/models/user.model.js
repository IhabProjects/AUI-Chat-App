import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    auiId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role:{
        type: String,
        required: true,
        enum: ["Student", "Faculty"]
    },
    major: {
      type: String,
      required: true,
      // TODO: Add An Array of all possible Majors in AUI
    },
    school: {
      type: String,
      required: true,
      enum: ["SSE", "SHSS", "BA"],
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);
