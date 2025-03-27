import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Building,
  FileText,
  GraduationCap,
  Loader,
  Mail,
  MessageCircle,
  User,
  UserCircle,
  UserPlus,
  UserMinus,
  LayoutList,
  Send
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { safeMap } from '../utils/helpers';

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
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

// Import CommentSection component or duplicate it here
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

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { selectUserById } = useChatStore();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/auth/profile/${userId}`);
        setUserProfile(response.data);

        // Check if this user is a friend of the current user
        if (authUser?.friends?.includes(userId)) {
          setIsFriend(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile");
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, authUser]);

  useEffect(() => {
    // Only fetch posts when on the posts tab and we have a userId
    if (activeTab === 'posts' && userId) {
      fetchUserPosts(userId);
    }
  }, [activeTab, userId]);

  const fetchUserPosts = async (id) => {
    try {
      setLoadingPosts(true);
      console.log("🔍 Fetching user posts from:", axiosInstance.defaults.baseURL + `/posts/user/${id}`);

      const res = await axiosInstance.get(`/posts/user/${id}`);
      console.log("✅ User posts response:", res.data);

      setUserPosts(res.data);
    } catch (error) {
      console.error("❌ Error fetching user posts:", error);
      console.error("❌ Error details:", error.response?.data || error.message);

      toast.error("Error fetching user's posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      setIsUpdating(true);
      await axiosInstance.post(`/auth/friends/request/${userId}`);
      setIsFriend(true);
      toast.success("Friend request sent successfully");
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to send friend request");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      setIsUpdating(true);
      await axiosInstance.post(`/auth/friends/remove/${userId}`);
      setIsFriend(false);
      toast.success("Friend removed successfully");
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartChat = async () => {
    // Navigate to the home page with chat selection info
    if (userProfile) {
      try {
        // Navigate to home page and explicitly pass the userId as state
        navigate('/', { state: { selectedChatUserId: userProfile._id } });
      } catch (error) {
        console.error("Error starting chat:", error);
        toast.error("Failed to start chat");
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-semibold mb-4">Error</h1>
          <p>{error || "User not found"}</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => navigate('/')}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="bg-base-300 rounded-xl p-6 space-y-4">
        <div className="flex items-center mb-4">
          <button
            className="btn btn-circle btn-ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold ml-2">User Profile</h1>
        </div>

        {/* Profile Image */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={userProfile.profilePic || "/avatar.png"}
              alt="Profile"
              className="size-32 rounded-full object-cover border-4"
            />
          </div>
          <h2 className="text-xl font-semibold">{userProfile.fullName}</h2>
          <div className="flex gap-2">
            <button
              className={`btn ${isFriend ? 'btn-error' : 'btn-primary'}`}
              onClick={isFriend ? handleRemoveFriend : handleAddFriend}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : isFriend ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Remove Friend
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleStartChat}
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
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
            Posts
          </button>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4 mt-6">
            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {userProfile.bio || "No bio available"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {userProfile.email}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                AUI ID
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {userProfile.auiId}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Role
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {userProfile.role}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Building className="w-4 h-4" />
                School
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {userProfile.school}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Major
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {userProfile.major}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Member Since
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {formatDate(userProfile.createdAt)}
              </p>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6 mt-6">
            <h3 className="text-xl font-semibold">Posts by {userProfile.fullName}</h3>

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <p className="text-lg">No posts yet</p>
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
                              src={userProfile.profilePic || "/avatar.png"}
                              alt={userProfile.username}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">{userProfile.username}</span>
                          {userProfile.fullName && (
                            <span className="block text-sm text-base-content/80">{userProfile.fullName}</span>
                          )}
                          {userProfile.auiId && (
                            <span className="block text-xs text-base-content/70">{userProfile.auiId}</span>
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
      </div>
    </div>
  );
};

export default UserProfilePage;
