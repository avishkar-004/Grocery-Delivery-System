// components/ChatRoom.jsx

import React, { useState, useEffect, useRef } from 'react';

const ChatRoom = ({ chatRoom, currentUser, otherUser }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch(`http://localhost:5000/messages/${chatRoom.id}?userId=${currentUser.id}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatRoomId: chatRoom.id,
                    senderId: currentUser.id,
                    message: message.trim()
                }),
            });

            if (response.ok) {
                setMessage('');
                fetchMessages();
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        if (chatRoom) {
            fetchMessages();
            // Poll for new messages every 2 seconds for real-time updates
            const interval = setInterval(fetchMessages, 2000);
            return () => clearInterval(interval);
        }
    }, [chatRoom.id, currentUser.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="chat-room">
            <div className="chat-header">
                <h3>Chat with {otherUser.email}</h3>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message ${msg.sender.id === currentUser.id ? 'own-message' : 'other-message'}`}
                        >
                            <div className="message-content">
                                <div className="message-text">{msg.message}</div>
                                <div className="message-time">
                                    {formatTime(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="message-input"
                    rows="1"
                />
                <button 
                    onClick={sendMessage} 
                    disabled={loading || !message.trim()}
                    className="send-button"
                >
                    {loading ? '...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;