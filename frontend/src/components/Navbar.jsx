import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, User, MessageSquare, Settings, Users, Newspaper, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { ensureArray, fuzzySearch } from "../utils/helpers";
import toast from "react-hot-toast";

function Navbar() {
  const { logout, authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      // Search for users, posts, and groups with more specific parameters
      const [usersRes, postsRes, groupsRes] = await Promise.all([
        axiosInstance.get(`/users/search?query=${query}&searchFields=username,fullName,auiId&exact=false`),
        axiosInstance.get(`/posts/search?query=${query}`),
        axiosInstance.get(`/groups/search?query=${query}`)
      ]);

      const users = ensureArray(usersRes.data).map(user => ({
        ...user,
        type: 'user'
      }));

      const posts = ensureArray(postsRes.data).map(post => ({
        ...post,
        type: 'post'
      }));

      const groups = ensureArray(groupsRes.data).map(group => ({
        ...group,
        type: 'group'
      }));

      // Combine all results
      const combinedResults = [...users, ...posts, ...groups];

      // Use advanced fuzzy search on the client side
      const searchOptions = {
        keys: [
          // User keys with higher weights for exact matches
          { name: 'username', weight: 3 },
          { name: 'fullName', weight: 2.5 },
          { name: 'auiId', weight: 4 }, // Increased weight for AUI ID
          // Post keys
          { name: 'content', weight: 1 },
          // Group keys
          { name: 'name', weight: 3 },
          { name: 'description', weight: 1 }
        ],
        threshold: 0.4, // Slightly higher threshold for more lenient matching
        includeMatches: true
      };

      const searchResults = await fuzzySearch(combinedResults, query, searchOptions);

      // Post-process results:
      // 1. Boost relevance of friends
      // 2. Boost relevance of recent content
      // 3. Boost exact or partial matches on auiId
      // 4. Limit to top 10 results
      const processedResults = searchResults
        .map(result => {
          let boostScore = result.score || 0;

          // Boost user results that are friends
          if (result.type === 'user' && result.isFriend) {
            boostScore += 0.2;
          }

          // Extra boost for AUI ID exact or partial matches
          if (result.type === 'user' && result.auiId) {
            // Direct match (case insensitive)
            if (result.auiId.toLowerCase() === query.toLowerCase()) {
              boostScore += 0.5;
            }
            // Starts with match
            else if (result.auiId.toLowerCase().startsWith(query.toLowerCase())) {
              boostScore += 0.3;
            }
            // Contains match
            else if (result.auiId.toLowerCase().includes(query.toLowerCase())) {
              boostScore += 0.2;
            }
          }

          // Boost recent posts
          if (result.type === 'post' && result.createdAt) {
            const postDate = new Date(result.createdAt);
            const now = new Date();
            const daysDiff = (now - postDate) / (1000 * 60 * 60 * 24);
            if (daysDiff < 1) boostScore += 0.15;
            else if (daysDiff < 7) boostScore += 0.1;
          }

          return {
            ...result,
            score: Math.min(boostScore, 1) // Cap at 1
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setSearchResults(processedResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchQuery("");

    // Navigate based on result type
    if (result.type === 'user') {
      navigate(`/user/${result._id}`);
    } else if (result.type === 'post') {
      // Navigate to the post (you might want to modify this based on your app's structure)
      navigate(`/post/${result._id}`);
    } else if (result.type === 'group') {
      navigate(`/groups/${result._id}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-base-100 border-b border-base-300 shadow-sm backdrop-blur-lg bg-base-100/95">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <Link
            to={authUser ? "/" : "/login"}
            className="flex items-center gap-2.5 hover:opacity-80 transition-all"
          >
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1>AUI Connect</h1>
          </Link>

          {authUser && (
            <div className="relative mx-2 flex-grow max-w-md hidden md:block" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users, posts, groups..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="input input-sm input-bordered w-full pr-10"
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/50"
                  onClick={() => {
                    setSearchQuery("");
                    setShowResults(false);
                  }}
                >
                  {searchQuery ? "✕" : <Search size={16} />}
                </button>
              </div>

              {showResults && (searchResults.length > 0 || isSearching) && (
                <div className="absolute mt-1 w-full bg-base-100 shadow-lg rounded-md z-50 max-h-[70vh] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <span className="loading loading-spinner loading-sm"></span>
                    </div>
                  ) : (
                    <>
                      {searchResults.map((result) => (
                        <div
                          key={`${result.type}-${result._id}`}
                          className="border-b last:border-0 hover:bg-base-200 cursor-pointer p-2"
                          onClick={() => handleResultClick(result)}
                        >
                          {result.type === 'user' && (
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-8 rounded-full">
                                  <img src={result.profilePic || `https://ui-avatars.com/api/?name=${result.username}`} alt="" />
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold">{result.username}</div>
                                <div className="text-xs text-base-content/70">
                                  {result.fullName}
                                  {result.auiId && <span className="ml-1 badge badge-sm">{result.auiId}</span>}
                                </div>
                              </div>
                              <span className="ml-auto badge badge-sm badge-primary">User</span>
                            </div>
                          )}

                          {result.type === 'post' && (
                            <div className="flex items-start gap-2">
                              <Newspaper className="w-8 h-8 text-primary shrink-0" />
                              <div>
                                <div className="line-clamp-1">{result.content}</div>
                                <div className="text-xs text-base-content/70">by {result.author?.username || 'Unknown'}</div>
                              </div>
                              <span className="ml-auto badge badge-sm badge-accent">Post</span>
                            </div>
                          )}

                          {result.type === 'group' && (
                            <div className="flex items-center gap-2">
                              <Users className="w-8 h-8 text-primary" />
                              <div>
                                <div className="font-semibold">{result.name}</div>
                                <div className="text-xs line-clamp-1">{result.description}</div>
                              </div>
                              <span className="ml-auto badge badge-sm badge-secondary">Group</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {authUser && (
              <>
                <Link to={"/"} className={`btn btn-sm gap-2`}>
                  <Newspaper className="w-4 h-4" />
                  <span className="hidden sm:inline">Feed</span>
                </Link>
                <Link to={"/chat"} className={`btn btn-sm gap-2`}>
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </Link>
                <Link to={"/groups"} className={`btn btn-sm gap-2`}>
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Groups</span>
                </Link>
              </>
            )}
            <Link
              to={"/settings"}
              className={`btn btn-sm gap-2 transition-colors`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
