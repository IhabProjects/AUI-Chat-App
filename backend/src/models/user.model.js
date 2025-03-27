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
    role: {
      type: String,
      required: true,
      enum: ["Student", "Faculty"],
      default: "",
    },
    major: {
      type: String,
      required: true,
      enum:["Computer Science", "General Engineering", "Engineering and Management Science", "Business Administration", "International Studies","Communication Studies","Human Resource Development","Sustainable Energy Management", "International Trade", "Business Administration", "International Studies and Diplomacy", "North African and Middle Eastern Studies"]
    },
    school: {
      type: String,
      required: true,
      enum: ["SSE", "SHSS", "BA"],
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "Hey there! I'm using AUI Connect.",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    friendRequests: {
      sent: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      received: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ]
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
