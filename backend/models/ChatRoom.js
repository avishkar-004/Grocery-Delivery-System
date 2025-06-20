// models/ChatRoom.js

const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    user1: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    user2: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Ensure a unique combination of user1 and user2
chatRoomSchema.index({ user1: 1, user2: 1 }, { unique: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;