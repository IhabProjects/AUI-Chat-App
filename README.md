# AUI Connect - Social Network Application

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

## Deployment

The application is ready for deployment with the following considerations:

### Frontend Deployment
- Build the production bundle with `npm run build`
- Deploy static files to a CDN or web server (Netlify, Vercel, etc.)
- Configure environment variables for production API endpoints

### Backend Deployment
- Set up environment variables for production
- Configure MongoDB Atlas for database
- Deploy to a Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)
- Set up proper CORS configuration for production domains
- Implement rate limiting and additional security measures

### Scaling Considerations
- Implement database indexing for frequently queried fields
- Set up caching layers for common queries
- Configure horizontal scaling for WebSocket connections
- Implement CDN for static assets and uploaded media

## Project Review

### Implementation Assessment

The AUI Connect application has successfully implemented all core features required for a social networking platform:

#### Successfully Implemented Features:

1. **User Authentication & Authorization**: Secure JWT-based authentication with protected routes
2. **Social Graph Management**: Complete friend request and relationship management
3. **Content Creation & Interaction**: Post creation, likes, and comments with real-time updates
4. **Direct Messaging**: Real-time chat with image sharing capabilities
5. **Content Moderation**: Two-layered approach with client and server-side filtering
6. **Profile Management**: Comprehensive user profiles with customization options
7. **Groups**: Group creation and management with dedicated content

#### Technical Achievements:

1. **Real-time Architecture**: Robust WebSocket implementation for instant updates across clients
2. **Comprehensive Error Handling**: Error handling throughout the application with user feedback
3. **Responsive Design**: Mobile-friendly UI with TailwindCSS and DaisyUI
4. **Optimistic UI Updates**: Improved perceived performance through optimistic state updates
5. **Advanced Feed Algorithm**: Intelligent content ranking and filtering

### Deployment Readiness

The application is ready for deployment with some minor considerations:

1. **Socket.io Configuration**: Ensure proper transport settings for production environment
2. **Database Indexing**: Add indexes for frequently queried fields before scaling
3. **Environment Variables**: Verify all environment variables are properly set for production
4. **Security Hardening**: Implement rate limiting and additional security headers
5. **Performance Optimization**: Implement bundling optimizations for production builds

With these considerations addressed, the application is production-ready and can be deployed to serve the AUI community.

## Future Improvements

Potential enhancements for future versions:

1. **Enhanced Media Support**: Video uploads and embedding
2. **Advanced Analytics**: User engagement metrics and content performance
3. **AI-powered Content Recommendations**: Personalized content suggestions
4. **Event Management**: Create and RSVP to campus events
5. **Academic Features**: Class discussions, study groups, resource sharing
6. **Progressive Web App**: Offline capabilities and native-like experience
7. **End-to-End Encryption**: For private messages
8. **Integration with University Systems**: Calendar, course information

---

Built with ❤️ for the AUI community
