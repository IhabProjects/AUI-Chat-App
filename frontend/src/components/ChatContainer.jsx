import React from 'react'
import { useEffect } from 'react'

import { useChatStore } from '../store/useChatStore'
//importing the ChatHeader and MessageInput components
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'

function ChatContainer() {
    const {messages, getMessages, isMessagesLoading, selectedUser}=useChatStore()


    useEffect(() => {
        getMessages(selectedUser._id)

      }, [selectedUser._id, getMessages])
    if (isMessagesLoading) return <div>Loading...</div>

    return (
    <div className='flex-1 flex flex-col overflow-y-auto'>
        <ChatHeader />
        <p>messages...</p>

        <MessageInput />
    </div>
  )
}

export default ChatContainer
