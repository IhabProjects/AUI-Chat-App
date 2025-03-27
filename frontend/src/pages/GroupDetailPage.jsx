import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from "../store/useAuthStore";
import axios from 'axios';
import toast from "react-hot-toast";
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ensureArray } from '../utils/helpers';
import { Users } from 'lucide-react';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { authUser, socket } = useAuthStore();

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !groupId) return;

    // Listen for new posts in this group
    socket.on(`group_post_${groupId}`, (newPost) => {
      setPosts(prevPosts => {
        if (!prevPosts.some(post => post._id === newPost._id)) {
          return [newPost, ...prevPosts];
        }
        return prevPosts;
      });
    });

    // Listen for group updates
    socket.on(`group_updated_${groupId}`, (updatedGroup) => {
      setGroup(updatedGroup);
      setIsMember(updatedGroup.members.some(member => member._id === authUser._id));
      setIsCreator(updatedGroup.creator._id === authUser._id);
    });

    // Listen for member join/leave events
    socket.on(`group_member_${groupId}`, ({ type, member }) => {
      if (type === 'join') {
        toast.success(`${member.username} joined the group!`);
      } else if (type === 'leave') {
        toast.info(`${member.username} left the group`);
      }
      // Refresh the group details to get updated members list
      fetchGroupDetails();
    });

    return () => {
      socket.off(`group_post_${groupId}`);
      socket.off(`group_updated_${groupId}`);
      socket.off(`group_member_${groupId}`);
    };
  }, [socket, groupId, authUser._id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/groups/${groupId}`);
      if (res.data) {
        if (!Array.isArray(res.data.members)) {
          res.data.members = [];
        }
        setGroup(res.data);
        setIsMember(res.data.members.some(member => member._id === authUser._id));
        setIsCreator(res.data.creator._id === authUser._id);
      } else {
        setGroup(null);
      }

      const postsRes = await axios.get(`/api/posts/group/${groupId}`);
      setPosts(ensureArray(postsRes.data));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load group details');
      setGroup(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const res = await axios.post(`/api/groups/${groupId}/post`, { content: newPostContent });

      // We don't need this manual update if sockets are working properly
      // But keep it as a fallback
      setPosts(prevPosts => {
        if (!prevPosts.some(post => post._id === res.data._id)) {
          return [res.data, ...prevPosts];
        }
        return prevPosts;
      });

      setNewPostContent('');
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      setIsJoining(true);
      await axios.post(`/api/groups/${groupId}/join`);
      toast.success(group.isPrivate ? 'Join request sent!' : 'Joined group!');
      fetchGroupDetails(); // Refresh the details
    } catch (error) {
      toast.error('Failed to join group');
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setIsLeaving(true);
      await axios.post(`/api/groups/${groupId}/leave`);
      toast.success('Left group successfully');
      fetchGroupDetails(); // Refresh the details
    } catch (error) {
      toast.error('Failed to leave group');
      console.error(error);
    } finally {
      setIsLeaving(false);
    }
  };

  const hasJoinRequest = group && group.joinRequests?.includes(authUser._id);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-8 bg-base-200 p-8 rounded-lg max-w-4xl mx-auto m-4">
        <p className="text-xl">Group not found or you don't have permission to view it.</p>
        <Link to="/groups" className="btn btn-primary mt-4">Back to Groups</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="bg-base-200 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="mt-2">{group.description}</p>
            <div className="mt-3 flex gap-2 items-center">
              <button
                className="btn btn-sm"
                onClick={() => setShowMembers(!showMembers)}
              >
                {showMembers ? 'Hide Members' : `${group.members?.length || 0} Members`}
              </button>
              {group.isPrivate && <span className="badge">Private Group</span>}
            </div>
          </div>
          <div>
            {!isMember && !hasJoinRequest && (
              <button
                className="btn btn-primary"
                onClick={handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? <span className="loading loading-spinner"></span> : 'Join Group'}
              </button>
            )}
            {hasJoinRequest && (
              <button className="btn btn-outline btn-disabled">
                Join Request Pending
              </button>
            )}
            {isMember && !isCreator && (
              <button
                className="btn btn-outline btn-error"
                onClick={handleLeaveGroup}
                disabled={isLeaving}
              >
                {isLeaving ? <span className="loading loading-spinner"></span> : 'Leave Group'}
              </button>
            )}
          </div>
        </div>

        {showMembers && (
          <div className="mt-4 bg-base-100 p-3 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Members</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {group.members && Array.isArray(group.members) && group.members.map(member => (
                <Link
                  key={member._id}
                  to={`/user/${member._id}`}
                  className="flex items-center p-2 hover:bg-base-200 rounded-lg"
                >
                  <div className="avatar mr-2">
                    <div className="w-8 rounded-full">
                      <img
                        src={member.profilePic || "https://ui-avatars.com/api/?name=" + member.username}
                        alt={member.username}
                      />
                    </div>
                  </div>
                  <span className={`${member._id === group.creator._id ? "font-bold" : ""}`}>
                    {member.username}
                    {member._id === group.creator._id && " (Creator)"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMember && (
        <div className="mb-8 bg-base-200 p-4 rounded-lg">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full p-3 rounded-lg mb-3 bg-base-100"
              placeholder={`Post something to ${group.name}...`}
              rows="3"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newPostContent.trim()}
            >
              Post
            </button>
          </form>
        </div>
      )}

      <div className="bg-base-200 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Group Posts</h2>

        {!Array.isArray(posts) || posts.length === 0 ? (
          <div className="text-center my-8">
            <p className="text-xl">No posts in this group yet.</p>
            {isMember && <p>Be the first to post something!</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <div key={post._id} className="bg-base-100 p-5 rounded-xl shadow-sm transition-all hover:shadow-md">
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
                  {/* Group badge */}
                  <div className="absolute -top-1 -right-1 bg-secondary text-secondary-content text-xs px-2 py-0.5 rounded-lg opacity-80 flex items-center gap-1">
                    <Users size={12} /> {group.name}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetailPage;
