﻿# AUI Connect - Social Network Application

A feature-rich social networking platform built for the AUI (Al Akhawayn University) community, enabling students and faculty to connect, share posts, chat in real-time, manage friend relationships, and more.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Folder Structure](#folder-structure)
- [Key Components](#key-components)
- [Authentication System](#authentication-system)
- [Real-time Features](#real-time-features)
- [Content Moderation](#content-moderation)
- [Feature Details](#feature-details)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Project Review](#project-review)
- [Future Improvements](#future-improvements)
- [User Experience Features](#user-experience-features)
- [Real-time Updates](#real-time-updates)

## Features

### User Management
- **Authentication**: Secure registration and login system using JWT
- **Profile Management**: Customizable user profiles with bio, school, major, and profile picture
- **Friendship System**: Send, accept, reject and manage friend requests

### Content Sharing
- **Posts**: Create, view, and interact with posts from the community
- **Comments**: Real-time commenting system on posts
- **Liking**: Like/unlike posts with real-time updates
- **Feed Algorithm**: Smart feed sorting based on relevance, recency, and user interactions

### Messaging System
- **Real-time Chat**: Instant messaging between users
- **Media Sharing**: Support for image sharing in chat
- **Typing Indicators**: Real-time typing status
- **Read Receipts**: See when messages are delivered and read

### Groups
- **Group Creation**: Create groups for specific interests or clubs
- **Group Posts**: Share content within specific groups
- **Member Management**: Add and remove members

### Advanced Features
- **Content Moderation**: Automated filtering of inappropriate content
- **Smart Search**: Advanced user search with relevancy scoring
- **Real-time Notifications**: Notifications for friend requests, comments, etc.
- **Responsive Design**: Works across desktop and mobile devices

## Tech Stack

### Frontend
- **React**: UI library for building the user interface
- **Zustand**: State management
- **TailwindCSS & DaisyUI**: Styling and UI components
- **Socket.io-client**: Real-time bidirectional communication
- **Axios**: HTTP client for API requests
- **React Router**: Client-side routing
- **Vite**: Build tool and development server

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **Socket.io**: Real-time event-based communication
- **JWT**: Authentication
- **Cloudinary**: Cloud storage for images
- **bcrypt**: Password hashing

## Architecture

The application follows a modern client-server architecture:

```
┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │
│    Frontend     │◄─────►│     Backend     │
│    (React)      │   HTTP│   (Node.js)     │
│                 │WebSocket                │
└─────────────────┘       └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │                 │
                          │    Database     │
                          │   (MongoDB)     │
                          │                 │
                          └─────────────────┘
```

- **Frontend**: React SPA with component-based architecture
- **Backend**: RESTful API + WebSocket server
- **Database**: MongoDB document store with Mongoose schemas
- **Real-time Communication**: WebSocket connections via Socket.io
- **Authentication**: JWT-based with secure HTTP-only cookies
- **Media Storage**: Cloudinary integration for storing and serving images

## Setup & Installation

### Prerequisites
- Node.js v16+
- MongoDB
- Cloudinary account (for image storage)

### Backend Setup
```bash
cd backend
npm install
# Create .env file with required environment variables
# JWT_SECRET, MONGODB_URI, CLOUDINARY_CLOUD_NAME, etc.
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with VITE_API_BASE_URL pointing to your backend
npm run dev
```

## Folder Structure

### Frontend

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   ├── constants/       # App constants
│   ├── lib/             # Utility libraries
│   ├── pages/           # Page components
│   ├── store/           # Zustand state stores
│   └── utils/           # Helper functions
```

### Backend

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── lib/             # Utility libraries
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas
│   └── routes/          # API routes
```

## Key Components

### Authentication System

The authentication system uses JWT (JSON Web Tokens) stored in HTTP-only cookies for secure user sessions. The auth flow includes:

1. User registers with email, password, and university credentials
2. Credentials are validated and password is hashed with bcrypt
3. On login, server verifies credentials and issues a JWT
4. JWT is stored in an HTTP-only cookie for subsequent authenticated requests
5. Auth middleware validates JWT for protected routes

```javascript
// Authentication middleware (simplified)
export const protectRoute = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid Token" });
  }
};
```

### Real-time Features

The app leverages Socket.io for real-time communication:

1. **Connection Management**: Handles user online status and socket authentication
2. **Chat System**: Enables direct messaging between users
3. **Notifications**: Delivers friend requests, post updates in real-time
4. **Live Updates**: Synchronizes post likes/comments across connected clients

```javascript
// Socket event handling (simplified)
socket.on("message:new", (message) => {
  // Store message in database
  const newMessage = new Message({ ...message });
  await newMessage.save();

  // Emit to recipient
  io.to(message.receiverId).emit("message:receive", newMessage);
});
```

### Content Moderation

The application implements a two-layered content moderation system:

1. **Client-side filtering**: Checks content as users type with visual feedback
2. **Server-side validation**: Ensures all content passes moderation rules before saving

The moderation system:
- Filters inappropriate language
- Provides warnings for borderline content
- Blocks severely inappropriate content
- Logs moderation actions for review

```javascript
// Client-side moderation implementation
export const moderateContent = (content, options = {}) => {
  if (!content || typeof content !== 'string') {
    return {
      isClean: true,
      moderatedContent: content || '',
      containsInappropriate: false,
      flags: []
    };
  }

  // List of prohibited words and patterns
  const badWords = [
    'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy',
    'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut', 'kike', 'spic',
    'chink', 'kill yourself', 'kys'
  ];

  // Store which inappropriate content was found
  const flags = [];

  // Use regex to create word boundary patterns for accurate matching
  const wordBoundaryPatterns = badWords.map(word => ({
    word,
    pattern: new RegExp(`\\b${word}\\b`, 'gi')
  }));

  // Check for inappropriate content
  let processedContent = content;
  let containsInappropriate = false;

  wordBoundaryPatterns.forEach(({ word, pattern }) => {
    if (pattern.test(processedContent)) {
      containsInappropriate = true;
      flags.push(word);

      // Replace bad words with asterisks
      processedContent = processedContent.replace(pattern, match =>
        '*'.repeat(match.length)
      );
    }
  });

  return {
    isClean: !containsInappropriate,
    moderatedContent: processedContent,
    containsInappropriate,
    flags
  };
};
```

## Feature Details

### Feed System

The feed system uses a sophisticated algorithm that sorts content based on:

1. **Recency**: Newer posts get higher priority
2. **Relevance**: Posts from friends and groups are prioritized
3. **Engagement**: Posts with more likes and comments rank higher
4. **User Interaction**: Content from users you interact with frequently gets boosted

```javascript
// Feed algorithm (simplified)
posts.sort((a, b) => {
  // Base score from likes
  const aLikes = a.likes?.length || 0;
  const bLikes = b.likes?.length || 0;

  // Recency factor (exponential decay)
  const aRecency = Math.exp(-aAge / 24);
  const bRecency = Math.exp(-bAge / 24);

  // Friend bonus
  const aFriendBonus = isUserFriend(a.author) ? 1.5 : 1;
  const bFriendBonus = isUserFriend(b.author) ? 1.5 : 1;

  // Final score calculation
  const aScore = (aLikes + 1) * aRecency * aFriendBonus;
  const bScore = (bLikes + 1) * bRecency * bFriendBonus;

  return bScore - aScore;
});
```

### Friend System

The friendship system allows users to:

1. **Send Requests**: Initiate friendship connections
2. **Accept/Reject**: Manage incoming requests
3. **View Friends**: See current connections
4. **Remove Friends**: Disconnect from existing friendships

Friend requests flow through these states:
- Sent → Pending → Accepted/Rejected

The Friend tab on the profile page organizes friendship features into three sections:
- **Friend Requests**: Incoming requests that can be accepted or rejected
- **Pending Requests**: Outgoing requests that can be canceled
- **My Friends**: Existing friends with options to view profiles or remove

```javascript
// Friend request handling (simplified)
export const sendFriendRequest = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user._id;

  // Add to sent friend requests
  await User.findByIdAndUpdate(userId, {
    $push: { "friendRequests.sent": friendId }
  });

  // Add to received friend requests of the other user
  await User.findByIdAndUpdate(friendId, {
    $push: { "friendRequests.received": userId }
  });

  // Emit socket event to notify recipient
  io.to(friendId).emit("friend:request", { from: userId });
};
```

### Comments System

The commenting system enables:

1. **Adding Comments**: Attach comments to posts
2. **Real-time Updates**: Comments appear instantly for all viewers
3. **Author Recognition**: Comments are attributed to authors with profile pictures
4. **Moderation**: Content filtering applied to comments
5. **Expandable Interface**: Comments can be collapsed/expanded to save space

The CommentSection component includes:
- Toggle control to show/hide comments
- Comment count display
- List of existing comments with author info
- Comment form with real-time moderation warnings
- Optimistic UI updates for new comments

```jsx
// Comment component implementation
const CommentSection = ({ post, onCommentAdded }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [moderationWarning, setModerationWarning] = useState(null);

  // Apply live moderation as user types
  useEffect(() => {
    if (commentText.trim()) {
      const result = moderateContent(commentText);
      if (!result.isClean) {
        setModerationWarning('Your comment contains inappropriate language');
      } else {
        setModerationWarning(null);
      }
    } else {
      setModerationWarning(null);
    }
  }, [commentText]);

  const handleSubmitComment = async () => {
    try {
      // Apply content moderation
      const moderatedText = validateContent(commentText);

      // Submit comment to server
      const res = await axiosInstance.post(`/posts/${post._id}/comment`, {
        text: moderatedText
      });

      // Update UI through callback
      onCommentAdded(res.data);
      setCommentText('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div>
      {/* Collapsible comment UI with moderation warnings */}
    </div>
  );
};
```

## Troubleshooting

### Common Issues

#### Socket.io Connection Errors

If you encounter Socket.io connection errors (400 Bad Request), check these potential solutions:

1. **CORS Configuration**:
   - Ensure your backend has proper CORS settings for your frontend domain
   - Check that credentials are properly handled with `allowCredentials: true`

2. **Socket Transport Settings**:
   - Force WebSocket transport only (avoid polling) by setting:
   ```javascript
   socket = io(BACKEND_URL, {
     transports: ['websocket'],
     upgrade: false
   });
   ```

3. **Proxy Configuration**:
   - When using Vite, ensure your proxy settings are correctly configured in `vite.config.js`
   - For direct backend connections, use the full backend URL instead of relative paths

4. **Cookie/Authentication Issues**:
   - Verify that cookies are properly set and sent with WebSocket connections
   - Check that authentication middleware is correctly processing socket connections

Example Socket.io client configuration:

```javascript
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
socket = io(BACKEND_URL, {
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket'], // Force WebSocket transport only
  upgrade: false // Disable transport upgrade
});
```

### Infinite Loading on Feed

If the feed page shows an infinite loading spinner:

1. Check for console errors to identify the specific issue
2. Verify that the backend API for `/posts/feed` is working correctly
3. Try clearing your browser cache and cookies
4. Check if your user authentication is still valid (you may need to log in again)

The application has a built-in timeout that prevents infinite loading after 10 seconds.

#### Transition Issues When Adding First Friend

We've fixed issues that could cause infinite loading when a user transitions from having no friends to having at least one friend:

1. **Real-time Feed Updates**: The feed now automatically refreshes when friend status changes
   - Socket.io events (`friend:list:changed`) broadcast when friends are added/removed
   - The FeedPage listens for these events and refreshes the feed immediately
   - No page reload is needed when accepting friend requests

2. **Friend Array Handling**: Improved handling of the `friends` array
   - Properly checks if arrays exist before using array methods
   - Prevents duplicate friend entries in the state
   - Handles empty/null/undefined friend lists gracefully

3. **Feed Algorithm Improvements**:
   - Added robust error handling in the sorting algorithm
   - Added proper checks for post data integrity
   - Implemented a loading timeout to prevent infinite spinner

4. **Backend Improvements**:
   - Added duplicate friend check in the `acceptFriendRequest` controller
   - Enhanced socket event emissions with more detailed data
   - Improved error handling for friend-related operations

If you still experience issues:
- Try switching to the "All Posts" filter from the dropdown menu
- Clear your browser cache and cookies
- Check the browser console for any error messages

### Friend Request Status Not Updating

If friend request status doesn't update in real-time:

1. Verify that socket connections are working
2. Check that the socket event listeners are properly set up
3. Review the authorization middleware to ensure it properly attaches user info
4. Try logging out and logging back in

### Database Connection Issues

If the application fails to connect to the database:

1. Check your MongoDB connection string
2. Verify network access to your MongoDB instance
3. Look for authentication errors in the backend logs
4. Ensure your IP address is whitelisted if using Atlas

# Security Considerations

When deploying the application to production, consider these additional security measures:

1. Use HTTPS for all connections
2. Implement rate limiting for sensitive endpoints
3. Add additional content moderation for user-generated content
4. Set up proper error logging and monitoring
5. Configure secure headers (HSTS, CSP, etc.)
6. Regularly update dependencies for security patches


## User Experience Features

### First-Time User Experience
- **Welcome Screen**: New users are presented with a comprehensive welcome screen after signup
- **Onboarding Flow**: Guided experience showing key features and next steps
- **Getting Started Tips**: Clear instructions on setting up profile, finding friends, and creating posts
- **Visual Cues**: Clear visual hierarchy to guide new users to important features
- **Seamless Transition**: One-time experience that transitions to normal app usage after initial view

### User Interface

- **Intuitive Navigation**: Clear navigation elements with consistent placement
- **Feed as Homepage**: Main feed is placed at the root URL (/) for immediate content access
- **Responsive Design**: Adapts to various screen sizes from mobile to desktop
- **Real-time Indicators**: Visual indicators for online status, new messages, and notifications
- **Enhanced Comments**: Rich comment display with user details including roles, academic information, and timestamps

## Real-time Updates

The application uses Socket.io to provide real-time updates for various features:

### Friend Requests

Friend requests are handled in real-time using socket events:

1. When a user sends a friend request, the recipient gets a real-time notification
2. When a user accepts a friend request, both users receive updates to their friend lists
3. Friend lists and request lists are automatically updated without requiring a page reload
4. The feed refreshes automatically when friend relationships change

### Post Updates

Posts are updated in real-time across all connected clients:

1. New posts appear immediately in other users' feeds
2. Likes and comments are synchronized across all viewers
3. Comment sections update instantly when new comments are added
4. Comment details show rich user information including role, AUI ID, and academic details

### Chat Messages

Chat messages are delivered instantly:

1. Messages appear in real-time for both sender and recipient
2. Read status and typing indicators update in real-time
3. New message notifications appear even when chat isn't open


---

Built with ❤️ for the AUI community
