import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import axios from 'axios';
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, Clock, ThumbsUp, Users, Zap, LayoutGrid, Sparkles, MessageCircle, Send, AlertTriangle } from 'lucide-react';
import { ensureArray, safeMap, validateContent, moderateContent } from '../utils/helpers';

const CommentSection = ({ post, onCommentAdded }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState(null);
  const { authUser } = useAuthStore();

  // Apply live moderation as user types
  useEffect(() => {
    if (commentText.trim()) {
      const result = moderateContent(commentText);
      if (!result.isClean) {
        if (result.flags.length > 2) {
          setModerationWarning('Your comment contains multiple inappropriate words');
        } else {
          setModerationWarning('Your comment contains inappropriate language');
        }
      } else {
        setModerationWarning(null);
      }
    } else {
      setModerationWarning(null);
    }
  }, [commentText]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);

      // Apply content moderation
      let moderatedText;
      try {
        moderatedText = validateContent(commentText, {
          strictLevel: 'medium',
          allowWithWarning: false
        });
      } catch (error) {
        // Content rejected
        toast.error(error.message);
        setIsSubmitting(false);
        return;
      }

      const res = await axiosInstance.post(`/posts/${post._id}/comment`, {
        text: moderatedText
      });

      // Call the callback to update the post with new comment
      if (onCommentAdded) {
        onCommentAdded(res.data);
      }

      // Clear the input
      setCommentText('');
      setModerationWarning(null);

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
                        src={comment.user?.profilePic || "/avatar.png"}
                        alt={comment.user?.username || "User"}
                      />
                    </div>
                  </div>
                  <div className="flex-1 bg-base-200 p-2 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-medium text-sm">
                          {comment.user?.fullName || comment.user?.username || "User"}
                        </span>
                        {comment.user?.role && (
                          <span className="ml-2 badge badge-xs badge-primary">{comment.user.role}</span>
                        )}
                        {comment.user?.auiId && (
                          <span className="text-xs text-base-content/70 block">
                            {comment.user.auiId}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-base-content/60">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{comment.text}</p>
                    <div className="flex justify-between mt-1 text-xs text-base-content/60">
                      {comment.user?.school && comment.user?.major && (
                        <span>{comment.user.school} - {comment.user.major}</span>
                      )}
                    </div>
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
          <form onSubmit={handleSubmitComment} className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="avatar self-start">
                <div className="w-8 h-8 rounded-full">
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt={authUser.username}
                  />
                </div>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={`w-full input input-sm input-bordered ${moderationWarning ? 'border-warning' : ''}`}
                  placeholder="Write a comment..."
                  maxLength={200}
                />

                {moderationWarning && (
                  <div className="text-xs text-warning flex items-center mt-1">
                    <AlertTriangle size={12} className="mr-1" />
                    {moderationWarning}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={!commentText.trim() || isSubmitting || (moderationWarning && moderationWarning.includes('multiple'))}
              >
                {isSubmitting ?
                  <span className="loading loading-spinner loading-xs"></span> :
                  <Send size={14} />
                }
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showingSearch, setShowingSearch] = useState(false);
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'popular', 'algorithm'
  const [filterType, setFilterType] = useState('all'); // 'all', 'friends', 'groups'
  const { authUser, socket } = useAuthStore();

  // Fetch posts when sort or filter changes
  useEffect(() => {
    fetchPosts();
  }, [sortBy, filterType]);

  // Add an effect to refresh the feed when friends list changes
  useEffect(() => {
    // Only refetch if authUser is properly loaded and we're not already loading
    if (authUser && !loading) {
      console.log("Friends list changed, refreshing feed...");
      fetchPosts();
    }
  }, [authUser?.friends?.length]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new posts
    socket.on('new_post', (newPost) => {
      setPosts(prevPosts => {
        // Only add post if it doesn't already exist
        if (!prevPosts.some(post => post._id === newPost._id)) {
          // Apply current filters
          const shouldAdd = filterPost(newPost, filterType);
          if (shouldAdd) {
            return sortPosts([newPost, ...prevPosts], sortBy);
          }
        }
        return prevPosts;
      });
      toast(`${newPost.author.username} posted something new!`, {
        icon: '✨',
        position: 'bottom-right',
        duration: 3000
      });
    });

    // Listen for post updates (likes, etc)
    socket.on('post_updated', (updatedPost) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === updatedPost._id ? updatedPost : post
        )
      );
    });

    // Listen for post comment updates
    socket.on('post:comment', (updatedPost) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === updatedPost._id ? updatedPost : post
        )
      );

      // Show notification if the comment is not from the current user
      if (updatedPost.comments &&
          updatedPost.comments.length > 0 &&
          updatedPost.comments[updatedPost.comments.length - 1].user._id !== authUser._id) {
        const latestComment = updatedPost.comments[updatedPost.comments.length - 1];
        toast(`${latestComment.user.fullName || latestComment.user.username} commented on a post`, {
          icon: '💬',
          position: 'bottom-right',
          duration: 3000
        });
      }
    });

    // Listen for post deletions
    socket.on('post_deleted', (postId) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    });

    // Listen for friend list changes
    socket.on('friend:list:changed', () => {
      console.log("Friend list changed event received in FeedPage - refreshing feed");
      // Immediately refetch posts to update based on new friend status
      fetchPosts();
    });

    return () => {
      socket.off('new_post');
      socket.off('post_updated');
      socket.off('post_deleted');
      socket.off('post:comment');
      socket.off('friend:list:changed');
    };
  }, [socket, filterType, sortBy, authUser._id]);

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter posts based on the selected filter type
  const filterPost = useCallback((post, filter) => {
    if (filter === 'all') return true;
    if (filter === 'friends' && post.author && authUser.friends.includes(post.author._id)) return true;
    if (filter === 'groups' && post.group) return true;
    return false;
  }, [authUser]);

  // Sort posts based on the selected sort type
  const sortPosts = useCallback((postsToSort, sort) => {
    if (!Array.isArray(postsToSort) || postsToSort.length === 0) return [];

    try {
      if (sort === 'latest') {
        return [...postsToSort].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
      else if (sort === 'popular') {
        return [...postsToSort].sort((a, b) =>
          (b.likes?.length || 0) - (a.likes?.length || 0)
        );
      }
      else if (sort === 'algorithm') {
        // Advanced algorithm that combines recency, popularity, and relevance
        return [...postsToSort].sort((a, b) => {
          // Base score from likes (popularity)
          const aLikes = a.likes?.length || 0;
          const bLikes = b.likes?.length || 0;

          // Recency factor (exponential decay)
          const now = new Date();
          const aDate = new Date(a.createdAt || now);
          const bDate = new Date(b.createdAt || now);
          const aAge = (now - aDate) / (1000 * 60 * 60); // hours
          const bAge = (now - bDate) / (1000 * 60 * 60); // hours
          const aRecency = Math.exp(-aAge / 24); // decay rate = 1 day half-life
          const bRecency = Math.exp(-bAge / 24);

          // Friend bonus (content from friends)
          // Ensure friends is an array before trying to use includes
          const friendsArray = Array.isArray(authUser?.friends) ? authUser.friends : [];

          const aFriendBonus = a.author && a.author._id &&
            friendsArray.includes(a.author._id) ? 1.5 : 1;

          const bFriendBonus = b.author && b.author._id &&
            friendsArray.includes(b.author._id) ? 1.5 : 1;

          // Interaction bonus (user has liked this content)
          const aInteracted = Array.isArray(a.likes) && authUser?._id &&
            a.likes.includes(authUser._id) ? 1.2 : 1;

          const bInteracted = Array.isArray(b.likes) && authUser?._id &&
            b.likes.includes(authUser._id) ? 1.2 : 1;

          // Final score calculation
          const aScore = (aLikes + 1) * aRecency * aFriendBonus * aInteracted;
          const bScore = (bLikes + 1) * bRecency * bFriendBonus * bInteracted;

          return bScore - aScore;
        });
      }
      return [...postsToSort]; // fallback - return a copy to avoid mutation issues
    } catch (error) {
      console.error("Error sorting posts:", error);
      // If sorting fails, return posts in their original order
      return [...postsToSort];
    }
  }, [authUser]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching posts from:", axiosInstance.defaults.baseURL + '/posts/feed');

      // Add loading timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        setLoading(false);
        console.log("Loading timeout reached - preventing infinite loading");
        // When timeout is reached, set empty posts array to show "no posts" message
        setPosts([]);
      }, 10000); // 10 seconds timeout

      // Add filter and sort parameters
      const params = {};

      // Only filter by friends if user has friends
      if (filterType === 'friends') {
        if (Array.isArray(authUser?.friends) && authUser.friends.length > 0) {
          params.filter = 'friends';
        } else {
          // If user has no friends but the filter is 'friends', show message immediately
          clearTimeout(loadingTimeout);
          setLoading(false);
          setPosts([]);
          return;
        }
      }

      if (filterType === 'groups') params.filter = 'groups';
      params.sort = sortBy;

      console.log("🔍 With params:", params);

      const res = await axiosInstance.get('/posts/feed', { params });
      console.log("✅ Posts response:", res.data);

      // Clear the timeout since we got a response
      clearTimeout(loadingTimeout);

      // Handle empty response
      if (!res.data || !Array.isArray(res.data)) {
        console.log("No posts returned or invalid response format");
        setPosts([]);
      } else {
        setPosts(sortPosts(res.data, sortBy));
      }
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
      console.error("❌ Error details:", error.response?.data || error.message);

      toast.error('Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      // Add specific search fields and parameters for better matching
      const res = await axiosInstance.get(`/users/search?query=${query}&searchFields=username,fullName,auiId&exact=false`);

      // Process results to prioritize exact or partial matches on AUI ID
      const results = ensureArray(res.data).map(user => {
        let score = 1; // Base score

        // Score boosting for AUI ID matches
        if (user.auiId) {
          // Direct match (case insensitive)
          if (user.auiId.toLowerCase() === query.toLowerCase()) {
            score += 1.5; // Strong boost for exact match
          }
          // Starts with match
          else if (user.auiId.toLowerCase().startsWith(query.toLowerCase())) {
            score += 1.0; // Good boost for prefix match
          }
          // Contains match
          else if (user.auiId.toLowerCase().includes(query.toLowerCase())) {
            score += 0.5; // Moderate boost for partial match
          }
        }

        // Score boost for username matches (secondary to AUI ID)
        if (user.username) {
          if (user.username.toLowerCase() === query.toLowerCase()) {
            score += 0.8;
          } else if (user.username.toLowerCase().startsWith(query.toLowerCase())) {
            score += 0.6;
          }
        }

        // Score boost for fullName matches (tertiary importance)
        if (user.fullName) {
          if (user.fullName.toLowerCase() === query.toLowerCase()) {
            score += 0.7;
          } else if (user.fullName.toLowerCase().startsWith(query.toLowerCase())) {
            score += 0.5;
          }
        }

        // Score boost for friends
        if (authUser?.friends?.includes(user._id)) {
          score += 0.3;
        }

        return {
          ...user,
          score
        };
      });

      // Sort by score and limit to most relevant
      const sortedResults = results.sort((a, b) => b.score - a.score);
      setSearchResults(sortedResults);
    } catch (error) {
      toast.error('Failed to search users');
      console.error(error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await axiosInstance.post(`/users/friend-request`, { userId });

      // Update the search results to show pending status
      setSearchResults(prevResults =>
        safeMap(prevResults, user =>
          user._id === userId
            ? { ...user, friendRequestStatus: 'pending' }
            : user
        )
      );

      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send friend request');
      console.error(error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      // Apply content moderation
      let moderatedContent;
      try {
        moderatedContent = validateContent(newPostContent, {
          strictLevel: 'medium',
          allowWithWarning: false
        });
      } catch (error) {
        // Content rejected by moderation
        toast.error(error.message);
        return;
      }

      const res = await axiosInstance.post('/posts', { content: moderatedContent });
      console.log("✅ Post created:", res.data);

      // We don't need to update the state manually as the socket will handle it
      // But as a fallback in case socket fails:
      setPosts(prevPosts => {
        const postExists = prevPosts.some(post => post._id === res.data._id);
        if (!postExists) {
          return sortPosts([res.data, ...prevPosts], sortBy);
        }
        return prevPosts;
      });

      setNewPostContent('');
      toast.success('Post created!');
    } catch (error) {
      console.error("❌ Error creating post:", error);
      console.error("❌ Error details:", error.response?.data || error.message);

      toast.error('Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await axiosInstance.post(`/posts/${postId}/like`);

      // Optimistic update (for faster UI response)
      setPosts(prevPosts =>
        safeMap(prevPosts, post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: [...(post.likes || []), authUser._id],
            };
          }
          return post;
        })
      );
    } catch (error) {
      // Revert optimistic update on error
      fetchPosts();
      toast.error('Failed to like post');
      console.error(error);
    }
  };

  const handleUnlikePost = async (postId) => {
    try {
      await axiosInstance.post(`/posts/${postId}/unlike`);

      // Optimistic update
      setPosts(prevPosts =>
        safeMap(prevPosts, post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: (post.likes || []).filter(id => id !== authUser._id),
            };
          }
          return post;
        })
      );
    } catch (error) {
      // Revert optimistic update on error
      fetchPosts();
      toast.error('Failed to unlike post');
      console.error(error);
    }
  };

  // Add this function to handle comment updates
  const handleCommentAdded = (updatedPost) => {
    setPosts(prevPosts =>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Feed</h1>

        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          <button
            onClick={() => setShowingSearch(!showingSearch)}
            className="btn btn-sm btn-outline"
          >
            <Search size={16} className="mr-1" /> Find Friends
          </button>

          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm btn-outline">
              <Filter size={16} className="mr-1" /> Filter
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li onClick={() => setFilterType('all')}>
                <a className={filterType === 'all' ? 'active' : ''}>
                  <LayoutGrid size={16} /> All Posts
                </a>
              </li>
              <li onClick={() => setFilterType('friends')}>
                <a className={filterType === 'friends' ? 'active' : ''}>
                  <Users size={16} /> Friends Only
                </a>
              </li>
              <li onClick={() => setFilterType('groups')}>
                <a className={filterType === 'groups' ? 'active' : ''}>
                  <Users size={16} /> Group Posts
                </a>
              </li>
            </ul>
          </div>

          <div className="dropdown dropdown-end">
            <label tabIndex={1} className="btn btn-sm btn-outline">
              <Clock size={16} className="mr-1" /> Sort
            </label>
            <ul tabIndex={1} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li onClick={() => setSortBy('algorithm')}>
                <a className={sortBy === 'algorithm' ? 'active' : ''}>
                  <Sparkles size={16} /> Smart Feed
                </a>
              </li>
              <li onClick={() => setSortBy('latest')}>
                <a className={sortBy === 'latest' ? 'active' : ''}>
                  <Clock size={16} /> Latest
                </a>
              </li>
              <li onClick={() => setSortBy('popular')}>
                <a className={sortBy === 'popular' ? 'active' : ''}>
                  <ThumbsUp size={16} /> Most Popular
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search UI */}
      {showingSearch && (
        <div className="mb-8 bg-base-200 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <Search size={18} className="mr-2 text-primary" />
            <h2 className="text-xl font-semibold">Find Friends</h2>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg mb-3 bg-base-100"
              placeholder="Search by username or name..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>

          {isSearching ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {searchResults.map(user => (
                <div key={user._id} className="flex items-center justify-between bg-base-100 p-3 rounded">
                  <Link to={`/user/${user._id}`} className="flex items-center">
                    <div className="avatar mr-3">
                      <div className="w-10 rounded-full">
                        <img
                          src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}`}
                          alt={user.username}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <div className="text-xs text-base-content/70 flex items-center">
                        {user.fullName}
                        {user.auiId && (
                          <span className="ml-1 badge badge-sm">{user.auiId}</span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {user._id !== authUser._id && (
                    <>
                      {user.isFriend ? (
                        <span className="badge badge-success">Friend</span>
                      ) : user.friendRequestStatus === 'pending' ? (
                        <span className="badge badge-warning">Request Sent</span>
                      ) : user.friendRequestStatus === 'received' ? (
                        <Link to="/profile" className="btn btn-sm btn-primary">
                          Respond
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(user._id)}
                          className="btn btn-sm btn-outline"
                        >
                          <Users size={14} className="mr-1" /> Add Friend
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <p className="text-center py-4">No users found matching "{searchQuery}"</p>
          ) : null}
        </div>
      )}

      <div className="mb-8 bg-base-200 p-5 rounded-xl shadow-md">
        <form onSubmit={handleCreatePost}>
          <div className="flex items-center mb-4">
            <div className="avatar mr-3">
              <div className="w-10 rounded-full">
                <img
                  src={authUser.profilePic || "https://ui-avatars.com/api/?name=" + authUser.username}
                  alt={authUser.username}
                />
              </div>
            </div>
            <div className="text-sm font-medium text-base-content/70">
              Share what's on your mind with the AUI community
            </div>
          </div>

          <div className="bg-base-100 p-2 rounded-lg border border-base-300">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full p-2 rounded-lg bg-transparent resize-none focus:outline-none min-h-[100px]"
              placeholder="What's on your mind?"
              rows="3"
            />

            {newPostContent.trim() && (() => {
              const result = moderateContent(newPostContent);
              if (!result.isClean) {
                return (
                  <div className="px-2 py-1 text-warning text-sm flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    {result.flags.length > 2
                      ? "Your post contains multiple inappropriate words that may be blocked"
                      : "Your post contains language that may be inappropriate"}
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-base-300">
              <div className="text-xs text-base-content/50">
                Posts are shared with the AUI community
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm gap-2"
                disabled={!newPostContent.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                Post
              </button>
            </div>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center my-8 bg-base-200 p-6 rounded-xl">
          <p className="text-xl mb-4">No posts to show right now</p>

          {filterType === 'friends' && (!Array.isArray(authUser?.friends) || authUser?.friends.length === 0) ? (
            <div>
              <p className="mb-3">You don't have any friends yet. Start by adding some!</p>
              <button
                onClick={() => setShowingSearch(true)}
                className="btn btn-primary"
              >
                <Users size={16} className="mr-2" /> Find Friends
              </button>
            </div>
          ) : (
            <p>Start by creating a post or adding more friends</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post._id} className="bg-base-200 p-5 rounded-xl shadow-sm transition-all hover:shadow-md">
              {/* Post Header with user info */}
              <div className="flex items-center mb-3">
                <Link to={`/user/${post.author._id}`} className="flex items-center group">
                  <div className="avatar mr-3 ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100 rounded-full">
                    <div className="w-10 rounded-full">
                      <img
                        src={post.author.profilePic || "https://ui-avatars.com/api/?name=" + post.author.username}
                        alt={post.author.username}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-medium group-hover:text-primary transition-colors">{post.author.username}</span>
                    {post.author.fullName && (
                      <span className="block text-sm text-base-content/80">{post.author.fullName}</span>
                    )}
                    {post.author.auiId && (
                      <span className="block text-xs text-base-content/70">{post.author.auiId}</span>
                    )}
                  </div>
                </Link>
                <span className="text-sm ml-auto text-base-content/70">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Post Content with AUI styling */}
              <div className="my-3 p-3 bg-base-300/50 rounded-lg relative">
                {/* AUI watermark */}
                <div className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs px-2 py-0.5 rounded-lg opacity-70">
                  AUI Connect
                </div>

                <p className="whitespace-pre-line">{post.content}</p>
              </div>

              {/* Post Footer with reactions */}
              <div className="flex items-center mt-4 pt-2 border-t border-base-300">
                {post.likes?.includes(authUser._id) ? (
                  <button
                    onClick={() => handleUnlikePost(post._id)}
                    className="btn btn-sm btn-ghost text-error gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {post.likes?.length || 0}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLikePost(post._id)}
                    className="btn btn-sm btn-ghost gap-1 hover:text-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes?.length || 0}
                  </button>
                )}

                {/* Group link if part of group */}
                {post.group && (
                  <Link to={`/groups/${post.group._id}`} className="ml-auto btn btn-sm btn-ghost text-primary">
                    <Users size={14} className="mr-1" />
                    {post.group.name}
                  </Link>
                )}
              </div>

              {/* Comment Section */}
              <CommentSection post={post} onCommentAdded={handleCommentAdded} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
