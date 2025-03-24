// Controlling Routes

import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// sign up
export const signup = async (req, res) => {
  const { fullName, email, password, auiId, role, school, major } = req.body;
  try {
    // Checking if user inputs empty field
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Check if password length is < 6
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    // Checking if the email or if the id already exists
    const existingUser = await User.findOne({ $or: [{ email }, { auiId }] });
    // will enter this if only if a user exists with those data
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.auiId === auiId) {
        return res.status(400).json({ message: "AUI ID already exists" });
      }
    }
    //The data given is original so NEW user
    // Hashing Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Document of NewUser (instance of a model is called a document)
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      auiId,
      role,
      major,
      school,
    });

    //Checking if user is created correctly
    if (newUser) {
      //Generate jwt (jason web token) here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        auiId: newUser.auiId,
        profilePic: newUser.profilePic,
        role: newUser.role,
        major: newUser.major,
        school: newUser.school,
      });
    } else {
      res.status(400).json({ message: "Invalid User Data" });
    }
  } catch (error) {
    console.log("Error in sign up controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// log in
export const login = (req, res) => {
  res.send("login route");
};

// log out
export const logout = (req, res) => {
  res.send("logout route");
};
