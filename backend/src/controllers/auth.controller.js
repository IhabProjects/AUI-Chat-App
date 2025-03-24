// Controlling Routes

import cloudinary from "../lib/cloudinary.js";
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
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      auiId: user.auiId,
      profilePic: user.profilePic,
      role: user.role,
      major: user.major,
      school: user.school,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// log out
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Updating Profile
export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id

        if(!profilePic) {
            return res.status(400).json({message:"Profile Pic Is required"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true})
        res.status(200).json(updatedUser)
    } catch (error) {
        console.log("error in updated profile:", error)
        res.status(500).json({message: "Internal Server Error"})
    }
}
