// server.js

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const dbConfig = {
    host: 'localhost',
    user: 'root', // Change to your MySQL username
    password: 'root', // Change to your MySQL password
    database: 'grocery_chat_db'
};

let db;

// Initialize Database Connection
const initDB = async () => {
    try {
        // First, create connection without database to create the database
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Create database if it doesn't exist
        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await tempConnection.end();

        // Now create connection with the database
        db = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        });

        // Create tables
        await createTables();
        
        console.log('MySQL connected and tables created successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
};

const createTables = async () => {
    // Users table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Chat rooms table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user1_id INT NOT NULL,
            user2_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user1_id) REFERENCES users(id),
            FOREIGN KEY (user2_id) REFERENCES users(id),
            UNIQUE KEY unique_chat_pair (user1_id, user2_id),
            INDEX idx_users (user1_id, user2_id)
        )
    `);

    // Chat messages table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT PRIMARY KEY AUTO_INCREMENT,
            chat_room_id INT NOT NULL,
            sender_id INT NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id),
            FOREIGN KEY (sender_id) REFERENCES users(id),
            INDEX idx_chat_room_timestamp (chat_room_id, timestamp),
            INDEX idx_unread (chat_room_id, is_read)
        )
    `);
};

// Auth Routes
app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Insert new user
        const [result] = await db.execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email.toLowerCase().trim(), password]
        );

        res.status(201).json({ 
            message: "User registered successfully", 
            user: { id: result.insertId, email: email.toLowerCase().trim() } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const [users] = await db.execute(
            'SELECT id, email FROM users WHERE email = ? AND password = ?',
            [email.toLowerCase().trim(), password]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({ 
            message: "Login successful", 
            user: { id: users[0].id, email: users[0].email } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all users (for finding people to chat with)
app.get("/users/:currentUserId", async (req, res) => {
    try {
        const { currentUserId } = req.params;
        
        const [users] = await db.execute(
            'SELECT id, email FROM users WHERE id != ?',
            [currentUserId]
        );

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Create or get chat room between two users
app.post("/chatroom", async (req, res) => {
    try {
        const { user1Id, user2Id } = req.body;

        if (!user1Id || !user2Id) {
            return res.status(400).json({ error: "Both user IDs are required" });
        }

        // Check if chat room already exists between these users (in either direction)
        const [existingRooms] = await db.execute(`
            SELECT cr.*, 
                   u1.email as user1_email, 
                   u2.email as user2_email
            FROM chat_rooms cr
            JOIN users u1 ON cr.user1_id = u1.id
            JOIN users u2 ON cr.user2_id = u2.id
            WHERE (cr.user1_id = ? AND cr.user2_id = ?) 
               OR (cr.user1_id = ? AND cr.user2_id = ?)
        `, [user1Id, user2Id, user2Id, user1Id]);

        let chatRoom;
        
        if (existingRooms.length > 0) {
            chatRoom = {
                id: existingRooms[0].id,
                user1: {
                    id: existingRooms[0].user1_id,
                    email: existingRooms[0].user1_email
                },
                user2: {
                    id: existingRooms[0].user2_id,
                    email: existingRooms[0].user2_email
                },
                created_at: existingRooms[0].created_at
            };
        } else {
            // Always store user IDs in consistent order (smaller ID first)
            const smallerId = Math.min(parseInt(user1Id), parseInt(user2Id));
            const largerId = Math.max(parseInt(user1Id), parseInt(user2Id));
            
            // Create new chat room
            const [result] = await db.execute(
                'INSERT INTO chat_rooms (user1_id, user2_id) VALUES (?, ?)',
                [smallerId, largerId]
            );

            // Get the created chat room with user details
            const [newRoom] = await db.execute(`
                SELECT cr.*, 
                       u1.email as user1_email, 
                       u2.email as user2_email
                FROM chat_rooms cr
                JOIN users u1 ON cr.user1_id = u1.id
                JOIN users u2 ON cr.user2_id = u2.id
                WHERE cr.id = ?
            `, [result.insertId]);

            chatRoom = {
                id: newRoom[0].id,
                user1: {
                    id: newRoom[0].user1_id,
                    email: newRoom[0].user1_email
                },
                user2: {
                    id: newRoom[0].user2_id,
                    email: newRoom[0].user2_email
                },
                created_at: newRoom[0].created_at
            };
        }

        res.json(chatRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all chat rooms for a user with unread message count
app.get("/chatrooms/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [chatRooms] = await db.execute(`
            SELECT cr.*, 
                   u1.email as user1_email, 
                   u2.email as user2_email,
                   COALESCE(unread_counts.unread_count, 0) as unread_count,
                   last_message.message as last_message,
                   last_message.timestamp as last_message_time
            FROM chat_rooms cr
            JOIN users u1 ON cr.user1_id = u1.id
            JOIN users u2 ON cr.user2_id = u2.id
            LEFT JOIN (
                SELECT chat_room_id, COUNT(*) as unread_count
                FROM chat_messages 
                WHERE sender_id != ? AND is_read = FALSE
                GROUP BY chat_room_id
            ) unread_counts ON cr.id = unread_counts.chat_room_id
            LEFT JOIN (
                SELECT DISTINCT
                    cm1.chat_room_id,
                    cm1.message,
                    cm1.timestamp
                FROM chat_messages cm1
                INNER JOIN (
                    SELECT chat_room_id, MAX(timestamp) as max_timestamp
                    FROM chat_messages
                    GROUP BY chat_room_id
                ) cm2 ON cm1.chat_room_id = cm2.chat_room_id 
                    AND cm1.timestamp = cm2.max_timestamp
            ) last_message ON cr.id = last_message.chat_room_id
            WHERE cr.user1_id = ? OR cr.user2_id = ?
            ORDER BY COALESCE(last_message.timestamp, cr.created_at) DESC
        `, [userId, userId, userId]);

        const formattedRooms = chatRooms.map(room => ({
            id: room.id,
            user1: {
                id: room.user1_id,
                email: room.user1_email
            },
            user2: {
                id: room.user2_id,
                email: room.user2_email
            },
            created_at: room.created_at,
            unread_count: room.unread_count || 0,
            last_message: room.last_message || null,
            last_message_time: room.last_message_time || null
        }));

        res.json(formattedRooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get messages for a specific chat room
app.get("/messages/:chatRoomId", async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const { userId } = req.query; // Get user ID from query params
        
        const [messages] = await db.execute(`
            SELECT cm.*, u.email as sender_email
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.chat_room_id = ?
            ORDER BY cm.timestamp ASC
        `, [chatRoomId]);

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            chatRoom: msg.chat_room_id,
            sender: {
                id: msg.sender_id,
                email: msg.sender_email
            },
            message: msg.message,
            timestamp: msg.timestamp,
            is_read: msg.is_read
        }));

        // Mark messages as read for the current user (except their own messages)
        if (userId) {
            await db.execute(`
                UPDATE chat_messages 
                SET is_read = TRUE 
                WHERE chat_room_id = ? AND sender_id != ? AND is_read = FALSE
            `, [chatRoomId, userId]);
        }

        res.json(formattedMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Mark messages as read
app.post("/messages/mark-read", async (req, res) => {
    try {
        const { chatRoomId, userId } = req.body;

        if (!chatRoomId || !userId) {
            return res.status(400).json({ error: "Chat room ID and user ID are required" });
        }

        await db.execute(`
            UPDATE chat_messages 
            SET is_read = TRUE 
            WHERE chat_room_id = ? AND sender_id != ?
        `, [chatRoomId, userId]);

        res.json({ message: "Messages marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get unread message count for a user
app.get("/unread-count/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [result] = await db.execute(`
            SELECT COUNT(*) as total_unread
            FROM chat_messages cm
            JOIN chat_rooms cr ON cm.chat_room_id = cr.id
            WHERE (cr.user1_id = ? OR cr.user2_id = ?)
            AND cm.sender_id != ?
            AND cm.is_read = FALSE
        `, [userId, userId, userId]);

        res.json({ unread_count: result[0].total_unread });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Send message to a chat room
app.post("/messages", async (req, res) => {
    try {
        const { chatRoomId, senderId, message } = req.body;

        if (!chatRoomId || !senderId || !message) {
            return res.status(400).json({ error: "Chat room ID, sender ID, and message are required" });
        }

        // Verify that the sender is part of this chat room
        const [chatRooms] = await db.execute(
            'SELECT * FROM chat_rooms WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [chatRoomId, senderId, senderId]
        );

        if (chatRooms.length === 0) {
            return res.status(403).json({ error: "Unauthorized to send message to this chat room" });
        }

        // Insert message
        const [result] = await db.execute(
            'INSERT INTO chat_messages (chat_room_id, sender_id, message) VALUES (?, ?, ?)',
            [chatRoomId, senderId, message]
        );

        // Get the created message with sender details
        const [newMessage] = await db.execute(`
            SELECT cm.*, u.email as sender_email
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.id = ?
        `, [result.insertId]);

        const formattedMessage = {
            id: newMessage[0].id,
            chatRoom: newMessage[0].chat_room_id,
            sender: {
                id: newMessage[0].sender_id,
                email: newMessage[0].sender_email
            },
            message: newMessage[0].message,
            timestamp: newMessage[0].timestamp,
            is_read: newMessage[0].is_read
        };

        res.status(201).json(formattedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Initialize database and start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});