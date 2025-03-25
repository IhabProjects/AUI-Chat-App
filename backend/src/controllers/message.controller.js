import User from "../models/user.model.js";

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
        const {id:userToChatId} = req.params
        const senderId = req.user._id


    } catch (error) {

    }
}
