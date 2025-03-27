import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import axios from 'axios';
import toast from "react-hot-toast";
import { Link } from 'react-router-dom';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/groups');
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to load groups');
      console.error(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim() || !newGroup.description.trim()) return;

    try {
      const res = await axios.post('/api/groups', newGroup);
      setGroups([...groups, res.data]);
      setNewGroup({
        name: '',
        description: '',
        isPrivate: false
      });
      setShowCreateForm(false);
      toast.success('Group created!');
    } catch (error) {
      toast.error('Failed to create group');
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewGroup({
      ...newGroup,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Groups</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-base-200 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Group</h2>
          <form onSubmit={handleCreateGroup}>
            <div className="mb-4">
              <label className="block mb-2">Group Name</label>
              <input
                type="text"
                name="name"
                value={newGroup.name}
                onChange={handleInputChange}
                className="w-full p-2 rounded bg-base-100"
                placeholder="Enter group name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Description</label>
              <textarea
                name="description"
                value={newGroup.description}
                onChange={handleInputChange}
                className="w-full p-2 rounded bg-base-100"
                placeholder="Describe your group"
                rows="3"
                required
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                name="isPrivate"
                id="isPrivate"
                checked={newGroup.isPrivate}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="isPrivate">Private Group (members only)</label>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newGroup.name.trim() || !newGroup.description.trim()}
            >
              Create Group
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center my-8 bg-base-200 p-8 rounded-lg">
          <p className="text-xl mb-4">You're not part of any groups yet</p>
          <p>Create a new group or join existing groups to connect with others!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(group => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className="bg-base-200 p-4 rounded-lg hover:bg-base-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{group.name}</h3>
                {group.isPrivate && (
                  <span className="badge badge-sm">Private</span>
                )}
              </div>
              <p className="mt-2 text-sm line-clamp-2">{group.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm">{group.members.length} members</span>
                {group.creator._id === useAuthStore.getState().authUser._id && (
                  <span className="badge badge-primary">Owner</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
