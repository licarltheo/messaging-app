# WhatsApp-like Messaging App

A full-featured messaging app with real-time chat, groups, files, status, and voice/video calls.

## Features

- ✅ Real-time messaging (text, images, files)
- ✅ Groups (create, join, manage)
- ✅ Status updates (photos, videos)
- ✅ Voice & Video calls
- ✅ End-to-end encryption (planned)
- ✅ File sharing
- ✅ Online status
- ✅ Read receipts
- ✅ Message reactions
- ✅ Search messages
- ✅ Dark mode

## Tech Stack

### Frontend
- React Native
- Expo
- React Navigation
- Socket.io-client
- Firebase (for file storage)

### Backend
- Node.js
- Express
- MongoDB
- Socket.io
- JWT (authentication)
- Multer (file uploads)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Expo CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/licarltheo/messaging-app.git
cd messaging-app

# Install dependencies
npm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Setup MongoDB
# Create a MongoDB cluster at https://www.mongodb.com/cloud/atlas
# Update backend/.env with your MongoDB connection string

# Start backend
cd backend
npm start

# Start frontend
cd frontend
npx expo start
```

### API Endpoints

#### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user

#### Messages
- GET /api/messages - Get messages
- POST /api/messages - Send message
- PUT /api/messages/:id - Update message
- DELETE /api/messages/:id - Delete message

#### Groups
- GET /api/groups - Get all groups
- POST /api/groups - Create group
- GET /api/groups/:id - Get group details
- PUT /api/groups/:id - Update group
- DELETE /api/groups/:id - Delete group
- POST /api/groups/:id/members - Add member
- DELETE /api/groups/:id/members/:userId - Remove member

#### Status
- GET /api/status - Get all status updates
- POST /api/status - Create status update
- DELETE /api/status/:id - Delete status update

#### Calls
- POST /api/calls - Create call
- GET /api/calls - Get call history
- PUT /api/calls/:id - Update call status

### Database Schema

#### Users
- _id (ObjectId)
- username (String)
- email (String)
- password (String)
- avatar (String)
- online (Boolean)
- lastSeen (Date)
- createdAt (Date)
- updatedAt (Date)

#### Messages
- _id (ObjectId)
- senderId (ObjectId)
- receiverId (ObjectId)
- groupId (ObjectId, optional)
- content (String)
- type (String: text, image, file)
- fileUrl (String, optional)
- reactions (Array)
- read (Boolean)
- createdAt (Date)

#### Groups
- _id (ObjectId)
- name (String)
- description (String)
- createdBy (ObjectId)
- members (Array<ObjectId>)
- admin (Array<ObjectId>)
- createdAt (Date)
- updatedAt (Date)

#### Status
- _id (ObjectId)
- userId (ObjectId)
- content (String)
- type (String: text, image, video)
- fileUrl (String)
- expiresAt (Date)
- createdAt (Date)

#### Calls
- _id (ObjectId)
- callerId (ObjectId)
- receiverId (ObjectId)
- groupId (ObjectId, optional)
- type (String: voice, video)
- status (String: incoming, outgoing, missed)
- duration (Number)
- createdAt (Date)

## Project Structure

```
messaging-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Group.js
│   │   ├── Status.js
│   │   └── Call.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── messages.js
│   │   ├── groups.js
│   │   ├── status.js
│   │   └── calls.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── socket.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── ChatList.js
│   │   │   ├── ChatScreen.js
│   │   │   ├── StatusScreen.js
│   │   │   ├── CallsScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── components/
│   │   │   ├── MessageBubble.js
│   │   │   ├── ChatInput.js
│   │   │   ├── StatusItem.js
│   │   │   ├── CallItem.js
│   │   │   └── Avatar.js
│   │   ├── navigation/
│   │   │   └── AppNavigator.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── utils/
│   │   │   └── socket.js
│   │   └── App.js
│   ├── .env.example
│   └── package.json
├── README.md
└── .gitignore
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@messaging-app.com or open an issue on GitHub.

## Acknowledgments

- Inspired by WhatsApp
- Built with React Native and Node.js
- Powered by MongoDB and Socket.io