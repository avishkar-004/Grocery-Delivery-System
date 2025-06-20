// components/UserList.jsx

import React, { useState, useEffect } from 'react';

const UserList = ({ currentUser, onChatRoomCreated, onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`http://localhost:5000/users/${currentUser.id}`);
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser.id]);

    const startChat = async (otherUserId) => {
        try {
            const response = await fetch('http://localhost:5000/chatroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user1Id: currentUser.id,
                    user2Id: otherUserId
                }),
            });

            const chatRoom = await response.json();
            onChatRoomCreated(chatRoom);
        } catch (error) {
            console.error('Error creating chat room:', error);
        }
    };

    if (loading) {
        return (
            <div className="user-list">
                <div className="user-list-header">
                    <h3>Start New Chat</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="loading">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="user-list">
            <div className="user-list-header">
                <h3>Start New Chat</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>
            
            <div className="users-container">
                {users.length === 0 ? (
                    <p>No other users found.</p>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="user-item">
                            <div className="user-info">
                                <h4>{user.email}</h4>
                            </div>
                            <button 
                                onClick={() => startChat(user.id)}
                                className="start-chat-btn"
                            >
                                Start Chat
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserList;