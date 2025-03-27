import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Building,
  Camera,
  GraduationCap,
  Mail,
  Save,
  User,
  UserCircle,
  FileText,
  LayoutList,
  Users,
  MessageCircle,
  Send
} from "lucide-react";
import {
  SCHOOL_MAJORS,
  getMajorsForSchool,
} from "../constants/schoolMajor.constant";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { safeMap } from '../utils/helpers';

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  try {
    // MongoDB ISODate string format: 2025-03-24T20:23:38.799+00:00
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "Not available";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Not available";
  }
};

// Import CommentSection from FeedPage or make it a separate component
const CommentSection = ({ post, onCommentAdded }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authUser } = useAuthStore();

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post(`/posts/${post._id}/comment`, {
        text: commentText
      });

      // Call the callback to update the post with new comment
      if (onCommentAdded) {
        onCommentAdded(res.data);
      }

      // Clear the input
      setCommentText('');

      toast.success('Comment added!');
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="btn btn-sm btn-ghost gap-1 w-full flex justify-between mb-2"
      >
        <span className="flex items-center">
          <MessageCircle className="h-5 w-5 mr-1" />
          {post.comments?.length || 0} comments
        </span>
        <span>{isExpanded ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {/* Comment list */}
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto p-2 bg-base-300/40 rounded-lg">
              {post.comments.map((comment, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="avatar self-start">
                    <div className="w-8 h-8 rounded-full">
                      <img
                        src={comment.user.profilePic || "/avatar.png"}
                        alt={comment.user.username || "User"}
                      />
                    </div>
                  </div>
                  <div className="flex-1 bg-base-200 p-2 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">
                        {comment.user.fullName || comment.user.username}
                      </span>
                      <span className="text-xs text-base-content/60">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-base-content/60 py-2">
              No comments yet. Be the first to comment!
            </p>
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-2">
            <div className="avatar self-start">
              <div className="w-8 h-8 rounded-full">
                <img
                  src={authUser.profilePic || "/avatar.png"}
                  alt={authUser.username}
                />
              </div>
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 input input-sm input-bordered bg-base-200"
              placeholder="Write a comment..."
              maxLength={200}
            />
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ?
                <span className="loading loading-spinner loading-xs"></span> :
                <Send size={14} />
              }
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [editableFields, setEditableFields] = useState({
    school: "",
    major: "",
    bio: "",
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const navigate = useNavigate();

  // Sync editableFields with authUser data when it changes or becomes available
  useEffect(() => {
    if (authUser) {
      setEditableFields({
        school: authUser.school || "",
        major: authUser.major || "",
        bio: authUser.bio || "Hey there! I'm using AUI Connect."
      });
    }
  }, [authUser]);

  useEffect(() => {
    // Debug logging
    console.log("Full authUser data:", authUser);
    console.log("CreatedAt from authUser:", authUser?.createdAt);
  }, [authUser]);

  useEffect(() => {
    // Only fetch posts when on the posts tab and we have authUser
    if (activeTab === 'posts' && authUser?._id) {
      fetchUserPosts();
    }

    // Fetch friend requests and friends when on the friends tab
    if (activeTab === 'friends' && authUser?._id) {
      fetchFriendRequests();
      fetchFriends();
    }
  }, [activeTab, authUser?._id]);

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      console.log("🔍 Fetching user posts from:", axiosInstance.defaults.baseURL + `/posts/user/${authUser._id}`);

      const res = await axiosInstance.get(`/posts/user/${authUser._id}`);
      console.log("✅ User posts response:", res.data);

      setUserPosts(res.data);
    } catch (error) {
      console.error("❌ Error fetching user posts:", error);
      console.error("❌ Error details:", error.response?.data || error.message);

      toast.error("Error fetching your posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      setLoadingFriends(true);
      const res = await axiosInstance.get('/auth/friends/requests');
      setFriendRequests(res.data);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      toast.error("Failed to fetch friend requests");
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      if (!authUser?.friends?.length) {
        setFriends([]);
        return;
      }

      const res = await axiosInstance.get('/auth/friends');
      setFriends(res.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to fetch friends");
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleAcceptFriendRequest = async (friendId) => {
    try {
      await axiosInstance.post(`/auth/friends/accept/${friendId}`);
      toast.success("Friend request accepted");

      // Update the lists
      setFriendRequests(prev => ({
        ...prev,
        received: prev.received.filter(req => req._id !== friendId)
      }));

      // Refresh friends list
      fetchFriends();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectFriendRequest = async (friendId) => {
    try {
      await axiosInstance.post(`/auth/friends/reject/${friendId}`);
      toast.success("Friend request rejected");

      // Update the lists
      setFriendRequests(prev => ({
        ...prev,
        received: prev.received.filter(req => req._id !== friendId)
      }));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request");
    }
  };

  const handleCancelFriendRequest = async (friendId) => {
    try {
      await axiosInstance.post(`/auth/friends/cancel/${friendId}`);
      toast.success("Friend request canceled");

      // Update the lists
      setFriendRequests(prev => ({
        ...prev,
        sent: prev.sent.filter(req => req._id !== friendId)
      }));
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await axiosInstance.post(`/auth/friends/remove/${friendId}`);
      toast.success("Friend removed");

      // Update the friends list
      setFriends(prev => prev.filter(friend => friend._id !== friendId));
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImage(base64Image);
      try {
        await updateProfile({
          profilePic: base64Image,
        });
        toast.success("Profile picture updated successfully");
      } catch (error) {
        toast.error("Failed to update profile picture");
        setSelectedImage(null);
      }
    };
  };

  const handleUpdateProfile = async () => {
    try {
      if (!editableFields.school || !editableFields.major) {
        toast.error("Please select both school and major");
        return;
      }

      await updateProfile({
        school: editableFields.school,
        major: editableFields.major,
        bio: editableFields.bio
      });

      // No need to manually update authUser since useAuthStore already handles this
      // The store's updateProfile function updates the authUser state with the response from the server
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
      // Reset the fields to the current authUser values if update fails
      setEditableFields({
        school: authUser?.school || "",
        major: authUser?.major || "",
        bio: authUser?.bio || "Hey there! I'm using AUI Connect."
      });
    }
  };

  // Add this function to handle comment updates
  const handleCommentAdded = (updatedPost) => {
    setUserPosts(prevPosts =>
      safeMap(prevPosts, post => {
        if (post._id === updatedPost._id) {
          return updatedPost;
        }
        return post;
      })
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="bg-base-300 rounded-xl p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="mt-1">Your profile Information</p>
        </div>

        {/* Profile Image */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={selectedImage || authUser.profilePic || "/avatar.png"}
              alt="Profile"
              className="size-32 rounded-full object-cover border-4"
            />
            <label
              htmlFor="avatar-upload"
              className={`
                absolute bottom-0 right-0
                bg-base-content hover:scale-105
                p-2 rounded-full cursor-pointer
                transition-all duration-200
                ${
                  isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                }
              `}
            >
              <Camera className="w-5 h-5 text-base-200" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </label>
          </div>
          <p className="text-sm text-zinc-400">
            {isUpdatingProfile
              ? "Uploading..."
              : "Click the camera icon to update your photo"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-content/20 mt-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'posts' ? 'border-b-2 border-primary text-primary' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <LayoutList className="w-4 h-4 inline mr-2" />
            My Posts
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'friends' ? 'border-b-2 border-primary text-primary' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Friends
          </button>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.fullName}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                AUI ID
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.auiId}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Role
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.role}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </div>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                placeholder="Tell us about yourself..."
                value={editableFields.bio}
                onChange={(e) =>
                  setEditableFields({
                    ...editableFields,
                    bio: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Building className="w-4 h-4" />
                School
              </div>
              <select
                className="select select-bordered w-full"
                value={editableFields.school}
                onChange={(e) => {
                  setEditableFields({
                    ...editableFields,
                    school: e.target.value,
                    major: "", // Reset major when school changes
                  });
                }}
              >
                <option value="">Select School</option>
                {Object.entries(SCHOOL_MAJORS).map(([code, { name }]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Major
              </div>
              <select
                className="select select-bordered w-full"
                value={editableFields.major}
                onChange={(e) =>
                  setEditableFields({
                    ...editableFields,
                    major: e.target.value,
                  })
                }
                disabled={!editableFields.school}
              >
                <option value="">Select Major</option>
                {editableFields.school &&
                  getMajorsForSchool(editableFields.school).map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
              </select>
            </div>

            <button
              className={`btn btn-primary w-full ${
                isUpdatingProfile ? "btn-disabled opacity-75" : ""
              }`}
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <>Updating...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>

            {/* Account Information Section */}
            <div className="mt-4 bg-base-200 rounded-xl p-4">
              <h2 className="text-lg font-medium mb-3">Account Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-base-300">
                  <span>Member Since</span>
                  <span className="text-base-content font-medium">
                    {console.log("createdAt value:", authUser?.createdAt) ||
                      formatDate(authUser?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Account Status</span>
                  <span className="text-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">My Posts</h3>

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <p className="text-lg mb-2">You haven't created any posts yet</p>
                <p className="text-sm">Share your thoughts with your friends by posting to your feed!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map(post => (
                  <div key={post._id} className="bg-base-200 p-5 rounded-xl shadow-sm transition-all hover:shadow-md">
                    {/* Post Header with user info */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        <div className="avatar mr-3 ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100 rounded-full">
                          <div className="w-10 rounded-full">
                            <img
                              src={authUser.profilePic || "/avatar.png"}
                              alt={authUser.username}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">{authUser.username || authUser.fullName}</span>
                          {authUser.auiId && (
                            <span className="block text-xs text-base-content/70">{authUser.auiId}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm ml-auto text-base-content/70">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Post Content with AUI styling */}
                    <div className="my-3 p-3 bg-base-300/50 rounded-lg relative">
                      {/* AUI badge */}
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs px-2 py-0.5 rounded-lg opacity-70">
                        AUI Connect
                      </div>

                      <p className="whitespace-pre-line">{post.content}</p>
                    </div>

                    {/* Post Footer with reactions */}
                    <div className="flex items-center mt-4 pt-2 border-t border-base-300">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm">{post.likes?.length || 0} likes</span>
                      </div>

                      {/* Comment button (placeholder) */}
                      <button className="btn btn-sm btn-ghost gap-1 ml-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Comment
                      </button>
                    </div>

                    {/* Add Comment Section */}
                    <CommentSection post={post} onCommentAdded={handleCommentAdded} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Friends & Requests</h3>

            {loadingFriends ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <>
                {/* Friend Requests */}
                {friendRequests.received && friendRequests.received.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Friend Requests</h4>
                    <div className="bg-base-200 rounded-lg divide-y divide-base-300">
                      {friendRequests.received.map(request => (
                        <div key={request._id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="avatar mr-3">
                              <div className="w-10 rounded-full">
                                <img
                                  src={request.profilePic || "/avatar.png"}
                                  alt={request.fullName}
                                />
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">{request.fullName}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptFriendRequest(request._id)}
                              className="btn btn-sm btn-primary"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectFriendRequest(request._id)}
                              className="btn btn-sm btn-outline"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Requests */}
                {friendRequests.sent && friendRequests.sent.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h4 className="text-lg font-medium">Pending Requests</h4>
                    <div className="bg-base-200 rounded-lg divide-y divide-base-300">
                      {friendRequests.sent.map(request => (
                        <div key={request._id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="avatar mr-3">
                              <div className="w-10 rounded-full">
                                <img
                                  src={request.profilePic || "/avatar.png"}
                                  alt={request.fullName}
                                />
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">{request.fullName}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelFriendRequest(request._id)}
                            className="btn btn-sm btn-outline btn-error"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friend List */}
                <div className="space-y-4 mt-6">
                  <h4 className="text-lg font-medium">My Friends</h4>
                  {friends.length === 0 ? (
                    <div className="text-center py-8 bg-base-200 rounded-lg">
                      <p className="text-lg mb-2">You don't have any friends yet</p>
                      <p className="text-sm">Search for other users to add them as friends</p>
                    </div>
                  ) : (
                    <div className="bg-base-200 rounded-lg divide-y divide-base-300">
                      {friends.map(friend => (
                        <div key={friend._id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="avatar mr-3">
                              <div className="w-10 rounded-full">
                                <img
                                  src={friend.profilePic || "/avatar.png"}
                                  alt={friend.fullName}
                                />
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">{friend.fullName}</span>
                              {friend.auiId && (
                                <span className="block text-xs text-base-content/70">{friend.auiId}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/user/${friend._id}`)}
                              className="btn btn-sm btn-outline"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(friend._id)}
                              className="btn btn-sm btn-outline btn-error"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
