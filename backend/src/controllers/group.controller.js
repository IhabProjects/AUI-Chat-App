import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user._id;

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    // Create new group
    const newGroup = new Group({
      name,
      description,
      creator: userId,
      members: [userId],
      admins: [userId],
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await newGroup.save();

    res.status(201).json(newGroup);
  } catch (error) {
    console.log("Error in createGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all groups (public groups or groups user is a member of)
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find groups where user is a member or the group is public
    const groups = await Group.find({
      $or: [
        { members: userId },
        { isPublic: true }
      ]
    }).populate("creator", "fullName profilePic");

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a specific group
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("creator", "fullName profilePic")
      .populate("members", "fullName profilePic")
      .populate("admins", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user can view this group
    if (!group.isPublic && !group.members.some(member => member._id.toString() === userId.toString())) {
      return res.status(403).json({ message: "Unauthorized - you are not a member of this private group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in getGroupById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Join a group
export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "Already a member of this group" });
    }

    // Check if group is public
    if (!group.isPublic) {
      // Send join request
      if (group.joinRequests.includes(userId)) {
        return res.status(400).json({ message: "Join request already sent" });
      }

      await Group.findByIdAndUpdate(groupId, {
        $push: { joinRequests: userId }
      });

      return res.status(200).json({ message: "Join request sent successfully" });
    }

    // Add member to public group
    await Group.findByIdAndUpdate(groupId, {
      $push: { members: userId }
    });

    res.status(200).json({ message: "Joined group successfully" });
  } catch (error) {
    console.log("Error in joinGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Approve join request
export const approveJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is an admin
    if (!group.admins.includes(adminId)) {
      return res.status(403).json({ message: "Unauthorized - only admins can approve join requests" });
    }

    // Check if join request exists
    if (!group.joinRequests.includes(userId)) {
      return res.status(400).json({ message: "No join request from this user" });
    }

    // Add member and remove join request
    await Group.findByIdAndUpdate(groupId, {
      $push: { members: userId },
      $pull: { joinRequests: userId }
    });

    res.status(200).json({ message: "Join request approved successfully" });
  } catch (error) {
    console.log("Error in approveJoinRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: "Not a member of this group" });
    }

    // Check if the user is the creator
    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({ message: "Group creator cannot leave - you must delete the group or transfer ownership" });
    }

    // Remove from members and admins
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: userId, admins: userId }
    });

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.log("Error in leaveGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add post to group
export const createGroupPost = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if member
    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized - only members can post" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: "Content must be less than 500 characters" });
    }

    // Create new post
    const newPost = new Post({
      author: userId,
      content
    });

    await newPost.save();

    // Add post to group
    await Group.findByIdAndUpdate(groupId, {
      $push: { posts: newPost._id }
    });

    // Populate author information
    const populatedPost = await Post.findById(newPost._id).populate("author", "fullName profilePic");

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Emit to all group members
      group.members.forEach(memberId => {
        io.to(memberId.toString()).emit("group:post:new", {
          groupId,
          post: populatedPost
        });
      });
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.log("Error in createGroupPost controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get group posts
export const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if member or public group
    if (!group.isPublic && !group.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized - you are not a member of this private group" });
    }

    // Get posts
    const posts = await Post.find({ _id: { $in: group.posts } })
      .populate("author", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getGroupPosts controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Search groups by name or description
export const searchGroups = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const groups = await Group.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .populate("admin", "username fullName profilePic")
    .sort({ createdAt: -1 })
    .limit(20);

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in searchGroups controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
