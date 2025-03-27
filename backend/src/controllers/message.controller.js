import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { moderateContent } from "../lib/utils.js";
// Get all Users a part from logged in user to see on the side bar

//TODO Show only friends
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUserForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      // Will find all messages between two parties
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // Sort by createdAt to show oldest messages first

    res.status(200).json({ messages });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Apply moderation to message text if present
    let moderatedText = text;
    if (text) {
      const moderationResult = moderateContent(text);
      moderatedText = moderationResult.moderatedContent;

      // You can log or take action on highly inappropriate content
      if (moderationResult.containsInappropriate) {
        console.log(`Moderation applied to message from user ${senderId}:
          Original: ${text}
          Moderated: ${moderatedText}`);
      }
    }

    let imageUrl;
    //If user sent an image
    if (image) {
      //upload base64 image to cloudinary DB
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text: moderatedText,
      image: imageUrl,
    });

    await newMessage.save();

    // Socket.io - emit a new message event with proper format for socket
    // Use the socket event the client is expecting to receive
    io.emit("message:new", {
      _id: newMessage._id,
      senderId,
      receiverId,
      text: moderatedText,
      image: imageUrl,
      createdAt: newMessage.createdAt
    });

    res.status(200).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
