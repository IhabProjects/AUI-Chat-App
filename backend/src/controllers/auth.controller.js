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
        bio: newUser.bio,
        friends: newUser.friends
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
      bio: user.bio,
      friends: user.friends
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
    const { profilePic, school, major, bio } = req.body;
    const userId = req.user._id;

    if (!profilePic && !school && !major && !bio) {
      return res
        .status(400)
        .json({ message: "At least one field Is required to update" });
    }
    let updatedFields = {};
    // If profilePic is provided, upload it to Cloudinary
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic); //Upload to cloudinary pic
      updatedFields.profilePic = uploadResponse.secure_url; //link of the pic that will be added to DB
    }
    // If major is provided, update it
    if (major) {
      updatedFields.major = major;
    }

    // If school is provided, update it
    if (school) {
      updatedFields.school = school;
    }

    // If bio is provided, update it
    if (bio) {
      updatedFields.bio = bio;
    }

    // Update the user record
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//Checking Authentification
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message)
    res.status(500).json({error:"Internal Server Error"})
  }
};

//Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Add Friend Request
export const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Check if user exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    const user = await User.findById(userId);
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    if (user.friendRequests.sent.includes(friendId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if there's a pending request from the other user
    if (user.friendRequests.received.includes(friendId)) {
      // Accept the request instead
      return await acceptFriendRequest(req, res);
    }

    // Add to sent friend requests
    await User.findByIdAndUpdate(userId, {
      $push: { "friendRequests.sent": friendId }
    });

    // Add to received friend requests of the other user
    await User.findByIdAndUpdate(friendId, {
      $push: { "friendRequests.received": userId }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      // Notify the receiver
      io.to(friendId.toString()).emit("friend:request", {
        from: userId,
        fromUser: {
          _id: user._id,
          fullName: user.fullName,
          profilePic: user.profilePic
        }
      });
    }

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.log("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Check if the request exists
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User or friend not found" });
    }

    // Check if the request is in the received list
    if (!user.friendRequests.received.includes(friendId)) {
      return res.status(400).json({ message: "No friend request from this user" });
    }

    // Check if they're already friends to prevent duplicates
    if (user.friends.includes(friendId)) {
      // If already friends, just remove from requests
      await User.findByIdAndUpdate(
        userId,
        { $pull: { "friendRequests.received": friendId } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        friendId,
        { $pull: { "friendRequests.sent": userId } },
        { new: true }
      );

      return res.status(200).json({
        message: "Already friends. Request cleared.",
        alreadyFriends: true
      });
    }

    // Accept the request (add to friends list and remove from requests)
    const userUpdateResult = await User.findByIdAndUpdate(
      userId,
      {
        $push: { friends: friendId },
        $pull: { "friendRequests.received": friendId }
      },
      { new: true }
    ).select("username fullName friends friendRequests.received profilePic");

    const friendUpdateResult = await User.findByIdAndUpdate(
      friendId,
      {
        $push: { friends: userId },
        $pull: { "friendRequests.sent": userId }
      },
      { new: true }
    ).select("username fullName friends friendRequests.sent profilePic");

    // Emit socket events to update UI in real-time
    const io = req.app.get('io');
    if (io) {
      // Notify the user who accepted the request
      io.to(userId.toString()).emit("friend:request:accepted", {
        friend: friendUpdateResult,
        action: "accepted"
      });

      // Notify the user whose request was accepted
      io.to(friendId.toString()).emit("friend:request:accepted", {
        friend: userUpdateResult,
        action: "accepted"
      });

      // Broadcast friend list changed event to both users to trigger feed refresh
      io.to(userId.toString()).emit("friend:list:changed");
      io.to(friendId.toString()).emit("friend:list:changed");

      // Broadcast online status update to ensure both users see each other's status
      const onlineUsers = Array.from(io.sockets.adapter.rooms.keys());
      if (onlineUsers.includes(userId.toString())) {
        io.to(friendId.toString()).emit("user:online", [userId.toString()]);
      }
      if (onlineUsers.includes(friendId.toString())) {
        io.to(userId.toString()).emit("user:online", [friendId.toString()]);
      }
    }

    res.status(200).json({
      message: "Friend request accepted",
      user: userUpdateResult,
      friend: friendUpdateResult
    });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Reject Friend Request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Check if user exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from received friend requests
    await User.findByIdAndUpdate(userId, {
      $pull: { "friendRequests.received": friendId }
    });

    // Remove from sent friend requests of the other user
    await User.findByIdAndUpdate(friendId, {
      $pull: { "friendRequests.sent": userId }
    });

    res.status(200).json({ message: "Friend request rejected successfully" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Cancel Friend Request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Check if user exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from sent friend requests
    await User.findByIdAndUpdate(userId, {
      $pull: { "friendRequests.sent": friendId }
    });

    // Remove from received friend requests of the other user
    await User.findByIdAndUpdate(friendId, {
      $pull: { "friendRequests.received": userId }
    });

    res.status(200).json({ message: "Friend request cancelled successfully" });
  } catch (error) {
    console.log("Error in cancelFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Remove Friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Check if user exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove friend from user's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    // Remove user from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.log("Error in removeFriend controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Get Friend Requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('friendRequests.sent', 'fullName profilePic')
      .populate('friendRequests.received', 'fullName profilePic');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      sent: user.friendRequests.sent,
      received: user.friendRequests.received
    });
  } catch (error) {
    console.log("Error in getFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Get Friends List
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('friends', 'fullName profilePic auiId');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    console.log("Error in getFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Search Users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { auiId: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id } // Exclude the current user
    }).select('fullName profilePic school role');

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
