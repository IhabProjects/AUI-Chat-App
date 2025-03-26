import React from 'react'
import { useAuthStore } from '../store/useAuthStore';

const ProfilePage = () => {
    const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();

    const handleImageUpload = async (e) => {}

  return (
    <div>
        
    </div>
  )
}

export default ProfilePage
