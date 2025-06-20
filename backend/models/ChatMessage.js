// models/ChatMessage.js

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    chatRoom: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ChatRoom', 
        required: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;