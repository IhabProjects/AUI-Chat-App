import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { moderateContent } from "../lib/utils.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: "Content must be less than 500 characters" });
    }

    // Apply server-side content moderation
    const moderationResult = moderateContent(content);
    const moderatedContent = moderationResult.moderatedContent;

    // You can log or take action on highly inappropriate content
    if (moderationResult.containsInappropriate) {
      console.log(`Moderation applied to post from user ${userId}:
        Original: ${content}
        Moderated: ${moderatedContent}`);
    }

    const newPost = new Post({
      author: userId,
      content: moderatedContent
    });

    await newPost.save();

    // Populate author information
    const populatedPost = await Post.findById(newPost._id).populate("author", "fullName profilePic username auiId");

    // Emit socket event for real-time feed updates
    const io = req.app.get('io');
    if (io) {
      // Get user's friends to notify them
      const user = await User.findById(userId);
      if (user && user.friends.length > 0) {
        // Emit to all friends
        user.friends.forEach(friendId => {
          io.to(friendId.toString()).emit("post:new", populatedPost);
        });
      }
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.log("Error in createPost controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get feed posts (posts from friends)
export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's friends
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Include user's own posts and friends' posts
    const friendIds = [...user.friends, userId];

    // Get posts from friends and self, sorted by newest first
    const posts = await Post.find({ author: { $in: friendIds } })
      .populate("author", "fullName profilePic username auiId")
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 most recent posts

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getFeedPosts controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's posts, sorted by newest first
    const posts = await Post.find({ author: userId })
      .populate("author", "fullName profilePic username auiId")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getUserPosts controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    // Add user to likes
    await Post.findByIdAndUpdate(postId, {
      $push: { likes: userId }
    });

    // Get updated post
    const updatedPost = await Post.findById(postId).populate("author", "fullName profilePic username auiId");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in likePost controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Unlike a post
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if not liked
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post not liked" });
    }

    // Remove user from likes
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: userId }
    });

    // Get updated post
    const updatedPost = await Post.findById(postId).populate("author", "fullName profilePic username auiId");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in unlikePost controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a comment
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.length > 200) {
      return res.status(400).json({ message: "Comment must be less than 200 characters" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Apply server-side content moderation
    const moderationResult = moderateContent(text);
    const moderatedText = moderationResult.moderatedContent;

    // You can log or take action on highly inappropriate content
    if (moderationResult.containsInappropriate) {
      console.log(`Moderation applied to comment from user ${userId}:
        Original: ${text}
        Moderated: ${moderatedText}`);
    }

    // Add comment
    const newComment = {
      user: userId,
      text: moderatedText,
      createdAt: new Date()
    };

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: newComment }
    });

    // Get updated post with populated comments
    const updatedPost = await Post.findById(postId)
      .populate("author", "fullName profilePic username auiId")
      .populate("comments.user", "fullName profilePic username auiId");

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify post author
      io.to(post.author.toString()).emit("post:comment", updatedPost);

      // Notify users who commented on this post
      const commenters = post.comments.map(comment =>
        comment.user.toString()
      );

      // Create unique array of users to notify (excluding current user)
      const usersToNotify = [...new Set([
        post.author.toString(),
        ...commenters
      ])].filter(id => id !== userId.toString());

      // Emit to all users
      usersToNotify.forEach(userId => {
        io.to(userId).emit("post:comment", updatedPost);
      });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in addComment controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a post (only author can delete)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized - only the author can delete this post" });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in deletePost controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
