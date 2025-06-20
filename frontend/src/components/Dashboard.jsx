import React, { useState, useEffect } from 'react';
import UserList from './UserList';
import ChatRoom from './ChatRoom';

const Dashboard = ({ user, onLogout }) => {
    const [chatRooms, setChatRooms] = useState([]);
    const [activeChatRoom, setActiveChatRoom] = useState(null);
    const [showUserList, setShowUserList] = useState(false);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    const getOtherUser = (chatRoom) => {
        return chatRoom.user1.id === user.id ? chatRoom.user2 : chatRoom.user1;
    };

    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString();
        }
    };// components/Dashboard.jsx

    const fetchChatRooms = async () => {
        try {
            const response = await fetch(`http://localhost:5000/chatrooms/${user.id}`);
            const data = await response.json();
            setChatRooms(data);

            // Calculate total unread count
            const total = data.reduce((sum, room) => {
                const otherUser = getOtherUser(room);
                return sum + (room.unread_count || 0);
            }, 0);
            setTotalUnreadCount(total);
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`http://localhost:5000/unread-count/${user.id}`);
            const data = await response.json();
            setTotalUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchChatRooms();

        // Set up interval for real-time updates
        const interval = setInterval(() => {
            fetchChatRooms();
            fetchUnreadCount();
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [user.id]);

    const handleChatRoomCreated = (newChatRoom) => {
        setChatRooms(prev => {
            const exists = prev.find(room => room.id === newChatRoom.id);
            if (!exists) {
                return [...prev, newChatRoom];
            }
            return prev;
        });
        setActiveChatRoom(newChatRoom);
        setShowUserList(false);
    };

    const handleChatRoomSelected = async (chatRoom) => {
        setActiveChatRoom(chatRoom);

        // Mark messages as read when opening a chat
        try {
            await fetch('http://localhost:5000/messages/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatRoomId: chatRoom.id,
                    userId: user.id
                }),
            });

            // Refresh chat rooms to update unread counts
            fetchChatRooms();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="header-left">
                    <h2>Welcome, {user.email}</h2>
                    {totalUnreadCount > 0 && (
                        <span className="total-unread-badge">{totalUnreadCount}</span>
                    )}
                </div>
                <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>

            <div className="dashboard-content">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h3>Chats</h3>
                        <button
                            onClick={() => setShowUserList(true)}
                            className="new-chat-btn"
                        >
                            + New Chat
                        </button>
                    </div>

                    <div className="chat-list">
                        {chatRooms.length === 0 ? (
                            <p className="no-chats">No chats yet. Start a new conversation!</p>
                        ) : (
                            chatRooms.map((chatRoom) => {
                                const otherUser = getOtherUser(chatRoom);
                                return (
                                    <div
                                        key={chatRoom.id}
                                        className={`chat-item ${activeChatRoom?.id === chatRoom.id ? 'active' : ''}`}
                                        onClick={() => handleChatRoomSelected(chatRoom)}
                                    >
                                        <div className="chat-info">
                                            <div className="chat-header-info">
                                                <h4>{otherUser.email}</h4>
                                                {chatRoom.unread_count > 0 && (
                                                    <span className="unread-badge">{chatRoom.unread_count}</span>
                                                )}
                                            </div>
                                            <div className="last-message-info">
                                                {chatRoom.last_message && (
                                                    <>
                                                        <small className="last-message">
                                                            {chatRoom.last_message.length > 50
                                                                ? chatRoom.last_message.substring(0, 50) + '...'
                                                                : chatRoom.last_message
                                                            }
                                                        </small>
                                                        <small className="last-message-time">
                                                            {formatLastMessageTime(chatRoom.last_message_time)}
                                                        </small>
                                                    </>
                                                )}
                                                {!chatRoom.last_message && (
                                                    <small>Click to start chatting</small>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="main-content">
                    {showUserList ? (
                        <UserList
                            currentUser={user}
                            onChatRoomCreated={handleChatRoomCreated}
                            onClose={() => setShowUserList(false)}
                        />
                    ) : activeChatRoom ? (
                        <ChatRoom
                            chatRoom={activeChatRoom}
                            currentUser={user}
                            otherUser={getOtherUser(activeChatRoom)}
                        />
                    ) : (
                        <div className="welcome-message">
                            <h3>Select a chat to start messaging</h3>
                            <p>Choose a conversation from the sidebar or start a new chat.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;