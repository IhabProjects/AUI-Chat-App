import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from 'react-router-dom';
import { Search, UserPlus, Check, User, ArrowLeft } from 'lucide-react';
import { ensureArray, safeMap } from '../utils/helpers';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({});
  const { authUser } = useAuthStore();

  // Debounced search
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

  const searchUsers = async (query) => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      // Add specific search fields and parameters for better matching
      const res = await axiosInstance.get(`/users/search?query=${query}&searchFields=username,fullName,auiId&exact=false`);

      // Process results to prioritize exact or partial matches on AUI ID
      const results = ensureArray(res.data).map(user => {
        // Add isFriend and friendRequestStatus
        const isFriend = authUser?.friends?.includes(user._id);
        return {
          ...user,
          isFriend
        };
      });

      setSearchResults(results);
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
      await axiosInstance.post(`/auth/friends/request/${userId}`);

      // Update pending requests state to show the request is pending
      setPendingRequests(prev => ({
        ...prev,
        [userId]: true
      }));

      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send friend request');
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 mt-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="btn btn-circle btn-ghost">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Find Friends</h1>
      </div>

      <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-lg font-medium">Search Users</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-base-content/50" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10"
              placeholder="Search by name, username, or AUI ID..."
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchQuery('')}
              >
                <span className="text-base-content/50">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-base-100 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {searchQuery ? 'Search Results' : 'Popular Users'}
        </h2>

        {isSearching ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map(user => (
              <div key={user._id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <Link to={`/user/${user._id}`} className="flex items-center flex-1">
                  <div className="avatar mr-4">
                    <div className="w-12 h-12 rounded-full">
                      <img
                        src={user.profilePic || `/avatar.png`}
                        alt={user.username}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <div className="text-sm text-base-content/70">
                      {user.fullName}
                      {user.auiId && <span className="ml-2 badge badge-sm">{user.auiId}</span>}
                    </div>
                    {user.school && <div className="text-xs">{user.school} • {user.major}</div>}
                  </div>
                </Link>

                <div>
                  {user.isFriend ? (
                    <button className="btn btn-sm btn-success" disabled>
                      <Check className="w-4 h-4 mr-1" />
                      Friends
                    </button>
                  ) : pendingRequests[user._id] ? (
                    <button className="btn btn-sm btn-disabled">
                      Request Sent
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSendFriendRequest(user._id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-base-content/70">Try a different search term</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-base-content/70">Enter a search term to find users</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
