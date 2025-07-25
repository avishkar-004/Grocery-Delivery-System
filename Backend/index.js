const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

//=============================================
// SECTION 1: DEPENDENCIES & CONFIGURATION
// ========================================

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173", // Don't use env during dev; keep it hardcoded
        methods: ["GET", "POST"],
        credentials: true
    }
});
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',  // Vite frontend
    credentials: true                // Allow cookies/headers
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  message: { success: false, message: 'Too many authentication attempts' }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3000,
  message: { success: false, message: 'Too many OTP requests' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000,
  message: { success: false, message: 'Too many requests' }
});

app.use('/api/auth', authLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api', generalLimiter);

// ========================================
// SECTION 2: DATABASE CONNECTION
// ========================================

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'grocery_deliver',
    timezone: 'local',
    charset: 'utf8mb4'
};

let db, dbPool;

async function initializeDatabase() {
  try {
    db = await mysql.createConnection(dbConfig); // For login/otp
    dbPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ DB connection and pool ready');
  } catch (error) {
    console.error('❌ DB init failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();



// ========================================
// SECTION 3: UTILITY FUNCTIONS
// ========================================


// E:\super30\v1\index.js

// Define the formatResponse function
function formatResponse(success, message, data = null, errorMessage = null) {
    return {
        success: success,
        message: message,
        data: data,
        error: errorMessage
    };
}

// ... rest of your index.js code ...



// MD5 password hashing


// SECURE PASSWORD HASHING FUNCTIONS
async function hashPassword(password) {
    try {
        // Salt rounds: 12 is recommended for 2024+ (good balance of security vs performance)
        return await bcrypt.hash(password, 12);
    } catch (error) {
        console.error('Password hashing error:', error);
        throw new Error('Password hashing failed');
    }
}

async function verifyPassword(inputPassword, hashedPassword) {
    try {
        return await bcrypt.compare(inputPassword, hashedPassword);
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

// MIGRATION FUNCTION - Handle both old MD5 and new bcrypt hashes
async function verifyPasswordWithMigration(inputPassword, storedHash) {
    try {
        // Check if it's old MD5 format (32 characters, hex only)
        if (storedHash.length === 32 && /^[a-f0-9]+$/i.test(storedHash)) {
            // Old MD5 system - hash input password with MD5 and compare
            const md5Hash = crypto.createHash('md5').update(inputPassword).digest('hex');
            return md5Hash === storedHash;
        } else {
            // New bcrypt system
            return await bcrypt.compare(inputPassword, storedHash);
        }
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

// OTP generation
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER ||'sqltrytest@gmail.com',
    pass: process.env.EMAIL_PASS || 'lool jtgx ycmq nmij'
  }
});

// Send email function
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER ||'sqltrytest@gmail.com',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// JWT token functions
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
}

// Distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Standard response format
function sendResponse(res, statusCode, success, message, data = null, error = null) {
  res.status(statusCode).json({
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
  });
}

// ========================================
// SECTION 4: MIDDLEWARE FUNCTIONS
// ========================================

// Authentication middleware
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendResponse(res, 401, false, 'Access token required');
    }

    const decoded = verifyToken(token);

    // Check if session exists and is valid
    const [sessions] = await dbPool.execute(
  'SELECT * FROM user_sessions WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()',
  [decoded.userId, crypto.createHash('sha256').update(token).digest('hex')]
);

    if (sessions.length === 0) {
      return sendResponse(res, 401, false, 'Invalid or expired session');
    }

    // Get user details
    const [users] = await dbPool.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE AND is_suspended = FALSE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return sendResponse(res, 401, false, 'User not found or suspended');
    }

    req.user = users[0];
    next();
  } catch (error) {
    return sendResponse(res, 401, false, 'Invalid token');
  }
}

// Role-based authorization
function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'Insufficient permissions');
    }
    next();
  };
}

// Input validation middleware
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 422, false, 'Validation failed', null, errors.array());
  }
  next();
}

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
const chatFileStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/chat';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const chatUpload = multer({
    storage: chatFileStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Allow images, documents, and other files
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// ========================================
// SECTION 5: AUTHENTICATION ROUTES
// ========================================


app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 1 }),
    body('role').isIn(['seller', 'buyer','admin']).withMessage('Role must be either seller or buyer')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, password, role } = req.body;

        console.log(`Login attempt for email: ${email} with role: ${role}`);

        // Find user with specific email AND role
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND role = ? AND is_active = TRUE',
            [email, role]
        );

        if (users.length === 0) {
            console.log(`Login failed: No active user found for ${email} with role ${role}`);
            return res.status(401).json(formatResponse(false, 'Invalid credentials'));
        }

        const user = users[0];

        // Verify password with migration support
        const isPasswordValid = await verifyPasswordWithMigration(password, user.password);

        if (!isPasswordValid) {
            console.log(`Login failed: Invalid password for ${email} with role ${role}`);
            return res.status(401).json(formatResponse(false, 'Invalid credentials'));
        }

        // Check if user is suspended
        if (user.is_suspended) {
            console.log(`Login failed: Account suspended for ${email} with role ${role}`);
            return res.status(403).json(formatResponse(false, 'Account suspended. Contact support.'));
        }

        // OPTIONAL: Upgrade old MD5 passwords to bcrypt on successful login
        if (user.password.length === 32 && /^[a-f0-9]+$/i.test(user.password)) {
            console.log(`Upgrading password hash for user: ${email} with role: ${role}`);
            try {
                const newHash = await hashPassword(password);
                await db.execute(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [newHash, user.id]
                );
                console.log(`Password hash upgraded successfully for ${email} with role: ${role}`);
            } catch (upgradeError) {
                console.error('Password upgrade failed:', upgradeError);
                // Don't fail login if upgrade fails
            }
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Create session
        const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.execute(
            'INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address) VALUES (?, ?, ?, ?)',
            [
                user.id,
                crypto.createHash('sha256').update(token).digest('hex'),
                sessionExpiry,
                req.ip || 'unknown'
            ]
        );

        console.log(`Login successful for ${email} with role: ${role}`);

        res.status(200).json(formatResponse(true, 'Login successful', {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified
            }
        }));

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json(formatResponse(false, 'Login failed', null, error.message));
    }
});

// POST /api/auth/register - User registration (Updated for multiple roles)
app.post('/api/auth/register', [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('phone').matches(/^\d{10}$/).withMessage('Valid 10-digit phone number required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('address').if(body('role').equals('seller')).notEmpty().withMessage('Address required for sellers'),
    body('latitude').if(body('role').equals('seller')).isFloat().withMessage('Valid latitude required for sellers'),
    body('longitude').if(body('role').equals('seller')).isFloat().withMessage('Valid longitude required for sellers')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            name, email: rawEmail, phone, password,
            role: rawRole, gender, date_of_birth, address, latitude, longitude
        } = req.body;

        const email = rawEmail.toLowerCase().trim();
        const role = rawRole.toLowerCase().trim();

        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND phone = ? AND role = ?',
            [email, phone, role]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json(formatResponse(false, `User already exists with this email, phone, and ${role} role`));
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await db.execute(
            'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, otp, 'registration', otpExpiry]
        );

        const emailSent = await sendEmail(
            email,
            'Registration OTP - Grocery Delivery',
            `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your FreshMarket OTP</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-top: 5px solid #22C55E; }
        h2 { color: #22C55E; font-size: 28px; margin-bottom: 20px; text-align: center; }
        p { font-size: 16px; margin-bottom: 15px; }
        .otp-box { background-color: #e0ffe0; border: 2px dashed #22C55E; padding: 15px 25px; margin: 25px 0; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #10B981; }
        .expiry-text { font-size: 14px; color: #EAB308; text-align: center; margin-top: 10px; }
        .footer-text { font-size: 12px; color: #888; text-align: center; margin-top: 30px; }
        .logo { text-align: center; margin-bottom: 25px; }
        .logo img { max-width: 180px; height: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src='v1\email.png' alt="FreshMarket Logo">
        </div>
        <h2>Welcome to FreshMarket!</h2>
        <p>Hello there,</p>
        <p>To complete your **${role}** registration, please use the One-Time Password (OTP) below:</p>
        <div class="otp-box">
            <strong>${otp}</strong>
        </div>
        <p class="expiry-text">This OTP is valid for the next **10 minutes**.</p>
        <p>If you did not request this, please disregard this email.</p>
        <p class="footer-text">Thank you for choosing FreshMarket!</p>
    </div>
</body>
</html>`
        );

        if (!emailSent) {
            return res.status(500).json(formatResponse(false, 'Failed to send OTP email'));
        }
        const hashedPassword = await hashPassword(password);
        const tempUserData = {
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            gender,
            date_of_birth,
            address,
            latitude,
            longitude
        };

        global.tempRegistrations = global.tempRegistrations || {};
        const tempKey = `${email}_${role}`;
        global.tempRegistrations[tempKey] = tempUserData;

        console.log(`✅ Stored temp registration as [${tempKey}]`, tempUserData);

        return res.status(200).json(formatResponse(true, `OTP sent successfully for ${role} registration`));
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json(formatResponse(false, 'Registration failed', null, error.message));
    }
});


// VERIFY OTP: Step 2 - Complete Registration (Updated for multiple roles)
app.post('/api/auth/verify-otp', [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit OTP required'),
    body('type').isIn(['registration', 'login', 'password_reset']),
    body('role').if(body('type').equals('registration')).isIn(['buyer', 'seller']).withMessage('Role required for registration')
], handleValidationErrors, async (req, res) => {
    try {
        const rawEmail = req.body.email;
        const email = rawEmail.toLowerCase().trim();
        const otp = req.body.otp;
        const type = req.body.type;
        let role = req.body.role?.toLowerCase().trim();

        console.log('\n--- OTP VERIFICATION DEBUG ---');
        console.log('Input:', { email, otp, type, role });

        const [otpRecords] = await db.execute(
            `SELECT * FROM otp_verifications 
             WHERE email = ? AND otp = ? AND type = ? 
             ORDER BY created_at DESC LIMIT 1`,
            [email, otp, type]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
        }

        const matchedOtp = otpRecords[0];
        const isExpired = new Date(matchedOtp.expires_at) < new Date();
        const isUsed = matchedOtp.is_used;

        if (isExpired || isUsed) {
            return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
        }

        await db.execute('UPDATE otp_verifications SET is_used = TRUE WHERE id = ?', [matchedOtp.id]);

        if (type === 'registration') {
            if (!role) {
                return res.status(400).json(formatResponse(false, 'Role missing during OTP verification'));
            }

            const tempKey = `${email}_${role}`;
            const tempUserData = global.tempRegistrations?.[tempKey];

            console.log(`Looking for temp registration with key: ${tempKey}`);
            console.log("Available temp keys:", Object.keys(global.tempRegistrations || {}));

            if (!tempUserData) {
                return res.status(400).json(formatResponse(false, 'Registration session expired. Please register again.'));
            }

            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE email = ? AND phone = ? AND role = ?',
                [tempUserData.email, tempUserData.phone, tempUserData.role]
            );

            if (existingUsers.length > 0) {
                delete global.tempRegistrations[tempKey];
                return res.status(409).json(formatResponse(false, `User already exists with this email, phone, and ${role} role`));
            }

            const insertValues = [
                tempUserData.name,
                tempUserData.email,
                tempUserData.phone,
                tempUserData.password,
                tempUserData.role,
                tempUserData.gender ?? null,
                tempUserData.date_of_birth ?? null,
                tempUserData.address ?? null,
                tempUserData.latitude ?? null,
                tempUserData.longitude ?? null
            ];

            const [result] = await db.execute(
                `INSERT INTO users 
                 (name, email, phone, password, role, gender, date_of_birth, address, latitude, longitude, is_verified, email_verified_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
                insertValues
            );

            delete global.tempRegistrations[tempKey];

            const token = generateToken({ userId: result.insertId, email, role });

            await db.execute(
                'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [result.insertId, crypto.createHash('sha256').update(token).digest('hex'), new Date(Date.now() + 24 * 60 * 60 * 1000)]
            );

            return res.status(201).json(formatResponse(true, `${role} registration completed successfully`, {
                token,
                user: {
                    id: result.insertId,
                    name: tempUserData.name,
                    email: tempUserData.email,
                    phone: tempUserData.phone,
                    role: tempUserData.role,
                    is_verified: true
                }
            }));
        } else {
            return res.status(200).json(formatResponse(true, 'OTP verified successfully'));
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json(formatResponse(false, 'OTP verification failed', null, error.message));
    }
});





// Reset password (Updated to handle multiple roles)
// Add this new endpoint to send OTP for password reset
app.post('/api/auth/send-password-reset-otp', [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['buyer', 'seller','admin']).withMessage('Role must be buyer or seller')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, role } = req.body;

        // Check if user exists with specified role
        const [users] = await db.execute(
            `SELECT id FROM users 
       WHERE email = ? 
         AND role = ? 
         AND is_active = 1 
         AND is_suspended = 0`,
            [email, role]
        );
        if (users.length === 0) {
            return res.status(404).json(formatResponse(false, `No ${role} account found for this email`));
        }

        // Generate OTP and set expiry
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Insert OTP into database
        await db.execute(
            'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, otp, 'password_reset', otpExpiry]
        );

        // Send OTP email
        const emailSent = await sendEmail(
            email,
            'Password Reset OTP - FreshMarket',
            `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Password Reset OTP - FreshMarket</title>
    <style>
        :root {
            --green-bg: #f3fdf5;
            --green-border: #d1e7d3;
            --green-primary: #4b9560;
            --green-secondary: #a5c9aa;
            --yellow-warning: #fef9c3;
            --warning-text: #7c6f0b;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--green-bg);
            margin: 0;
            padding: 20px;
            color: #2f2f2f;
        }

        .container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 32px;
            border-radius: 10px;
            border: 1px solid var(--green-border);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .logo {
            text-align: center;
            margin-bottom: 20px;
        }

        .logo img {
            max-width: 150px;
            height: auto;
        }

        h2 {
            text-align: center;
            color: var(--green-primary);
            font-size: 22px;
            margin-bottom: 18px;
        }

        p {
            font-size: 15px;
            line-height: 1.6;
            margin: 12px 0;
        }

        .otp-box {
            background: var(--green-bg);
            border: 1px dashed var(--green-secondary);
            color: var(--green-primary);
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            text-align: center;
            padding: 16px;
            margin: 24px 0;
            border-radius: 8px;
        }

        .expiry-text {
            text-align: center;
            font-size: 13px;
            color: #947f19;
            margin-top: -10px;
            margin-bottom: 20px;
        }

        .warning {
            background-color: var(--yellow-warning);
            border-left: 4px solid #fde047;
            padding: 14px;
            font-size: 14px;
            border-radius: 6px;
            color: var(--warning-text);
            margin-top: 20px;
        }

        .footer-text {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 40px;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="logo">
        <img src="./email.png" alt="FreshMarket Logo" />
    </div>

    <h2>Password Reset Request</h2>

    <p>Hello,</p>
    <p>You have requested to reset your password for your <strong>${role}</strong> account. Please use the One-Time Password (OTP) below:</p>

    <div class="otp-box">${otp}</div>

    <p class="expiry-text">This OTP is valid for the next <strong>10 minutes</strong>.</p>

    <div class="warning">
        <strong>Security Notice:</strong> If you did not request this password reset, please ignore this message and ensure your account is secure.
    </div>

    <p class="footer-text">Thank you for using FreshMarket!</p>
</div>
</body>
</html>
`
        );

        if (!emailSent) {
            return res.status(500).json(formatResponse(false, 'Failed to send OTP email'));
        }

        res.status(200).json(formatResponse(true, `Password reset OTP sent to your email for ${role} account`));
    } catch (error) {
        console.error('Send password reset OTP error:', error);
        res.status(500).json(formatResponse(false, 'Failed to send password reset OTP', null, error.message));
    }
});

// Your existing password reset endpoint (unchanged)

// DEBUGGING VERSION - Add this temporarily to see what's happening

app.post('/api/auth/reset-password', [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('new_password').isLength({ min: 6 }),
    body('role').isIn(['buyer', 'seller','admin']).withMessage('Role must be buyer or seller')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, otp, new_password, role } = req.body;

        console.log('\n=== PASSWORD RESET DEBUGGING START ===');
        console.log('1. INPUT DATA:');
        console.log('   Email:', email);
        console.log('   OTP:', otp);
        console.log('   Role:', role);
        console.log('   New Password Length:', new_password.length);
        console.log('   New Password (first 3 chars):', new_password.substring(0, 3) + '***');

        // Check MySQL time
        const [timeCheck] = await db.execute('SELECT NOW() as mysql_now, UTC_TIMESTAMP() as mysql_utc');
        console.log('\n2. TIME CHECK:');
        console.log('   MySQL NOW():', timeCheck[0].mysql_now);
        console.log('   MySQL UTC_TIMESTAMP():', timeCheck[0].mysql_utc);
        console.log('   JavaScript Time:', new Date().toISOString());

        // Check all OTP records
        const [allOtpRecords] = await db.execute(
            'SELECT id, email, otp, type, expires_at, created_at, is_used, (expires_at > UTC_TIMESTAMP()) as is_valid_time FROM otp_verifications WHERE email = ? AND type = ? ORDER BY created_at DESC',
            [email, 'password_reset']
        );
        console.log('\n3. ALL OTP RECORDS FOR EMAIL:');
        console.log('   Total records found:', allOtpRecords.length);
        allOtpRecords.forEach((record, index) => {
            console.log(`   Record ${index + 1}:`, {
                id: record.id,
                otp: record.otp,
                expires_at: record.expires_at,
                is_used: record.is_used,
                is_valid_time: record.is_valid_time
            });
        });

        // Validate OTP
        const [otpRecords] = await db.execute(
            'SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND type = ? AND expires_at > UTC_TIMESTAMP() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
            [email, otp, 'password_reset']
        );

        console.log('\n4. OTP VALIDATION:');
        console.log('   Valid OTP records found:', otpRecords.length);

        if (otpRecords.length === 0) {
            console.log('   ❌ OTP VALIDATION FAILED');
            return res.status(400).json(formatResponse(false, 'Invalid or expired OTP'));
        }
        console.log('   ✅ OTP VALIDATION PASSED');

        // Check if user exists BEFORE password update
        const [usersBefore] = await db.execute(
            'SELECT id, email, role, password FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        console.log('\n5. USER VERIFICATION:');
        console.log('   Users found:', usersBefore.length);

        if (usersBefore.length === 0) {
            console.log('   ❌ USER NOT FOUND');
            return res.status(404).json(formatResponse(false, `No ${role} account found for this email`));
        }

        console.log('   ✅ USER FOUND');
        console.log('   User ID:', usersBefore[0].id);
        console.log('   Current Password Hash:', usersBefore[0].password);

        // Hash the new password and show the result
        const newPasswordHash = await hashPassword(new_password);
        console.log('\n6. PASSWORD HASHING:');
        console.log('   Original Password (first 3 chars):', new_password.substring(0, 3) + '***');
        console.log('   New Hash Generated:', newPasswordHash);
        console.log('   Hash Length:', newPasswordHash.length);

        // Update password with detailed result checking
        console.log('\n7. PASSWORD UPDATE:');
        console.log('   Executing UPDATE query...');

        const updateResult = await db.execute(
            'UPDATE users SET password = ? WHERE email = ? AND role = ?',
            [newPasswordHash, email, role]
        );

        console.log('   Update Result:', updateResult);
        console.log('   Affected Rows:', updateResult.affectedRows);
        console.log('   Changed Rows:', updateResult.changedRows);
        console.log('   Insert ID:', updateResult.insertId);
        console.log('   Warning Count:', updateResult.warningCount);

        // Verify the password was actually updated
        const [usersAfter] = await db.execute(
            'SELECT id, email, role, password FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        console.log('\n8. POST-UPDATE VERIFICATION:');
        console.log('   Users found after update:', usersAfter.length);
        if (usersAfter.length > 0) {
            console.log('   Password BEFORE update:', usersBefore[0].password);
            console.log('   Password AFTER update:', usersAfter[0].password);
            console.log('   Password actually changed?', usersBefore[0].password !== usersAfter[0].password);
            console.log('   New hash matches expected?', usersAfter[0].password === newPasswordHash);
        }

        // Mark OTP as used
        const otpUpdateResult = await db.execute(
            'UPDATE otp_verifications SET is_used = TRUE WHERE id = ?',
            [otpRecords[0].id]
        );

        console.log('\n9. OTP MARK AS USED:');
        console.log('   OTP Update Result:', otpUpdateResult);
        console.log('   OTP Affected Rows:', otpUpdateResult.affectedRows);

        // Clear sessions
        const sessionDeleteResult = await db.execute(
            'DELETE FROM user_sessions WHERE user_id = ?',
            [usersBefore[0].id]
        );

        console.log('\n10. SESSION CLEANUP:');
        console.log('   Sessions deleted:', sessionDeleteResult.affectedRows);

        console.log('\n=== PASSWORD RESET DEBUGGING END ===\n');

        // Final verification - let's check one more time
        const [finalCheck] = await db.execute(
            'SELECT password FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        if (finalCheck.length > 0 && finalCheck[0].password === newPasswordHash) {
            console.log('✅ FINAL VERIFICATION: Password successfully updated in database');
            res.status(200).json(formatResponse(true, `Password reset successfully for ${role} account`));
        } else {
            console.log('❌ FINAL VERIFICATION: Password was NOT updated in database');
            console.log('Expected hash:', newPasswordHash);
            console.log('Actual hash in DB:', finalCheck[0]?.password);
            res.status(500).json(formatResponse(false, 'Password update failed - database not updated'));
        }

    } catch (error) {
        console.error('\n❌ PASSWORD RESET ERROR:', error);
        console.error('Error Stack:', error.stack);
        res.status(500).json(formatResponse(false, 'Password reset failed', null, error.message));
    }
});
// Logout - No changes needed
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM user_sessions WHERE user_id = ?', [req.user.id]);
        res.status(200).json(formatResponse(true, 'Logged out successfully'));
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json(formatResponse(false, 'Logout failed', null, error.message));
    }
});
// ALTERNATIVE SOLUTION 1: Use UTC consistently

// ========================================
// SECTION 6: BUYER ROUTES
// ========================================

// GET /api/products/categories - List all categories
app.get('/api/products/categories', async (req, res) => {
  try {
    const [categories] = await dbPool.execute(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name'
    );
    sendResponse(res, 200, true, 'Categories retrieved successfully', categories);
  } catch (error) {
    console.error('Get categories error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve categories');
  }
});

// GET /api/products/by-category/:categoryId - Products by category
app.get('/api/products/by-category/:categoryId', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId, 10);
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        // Validate parameters
        if (isNaN(categoryId) || categoryId <= 0) {
            return sendResponse(res, 400, false, 'Invalid category ID');
        }

        if (isNaN(limit) || limit <= 0 || limit > 100) {
            return sendResponse(res, 400, false, 'Invalid limit parameter (must be between 1-100)');
        }

        if (isNaN(offset) || offset < 0) {
            return sendResponse(res, 400, false, 'Invalid page parameter');
        }

        console.log({ categoryId, limit, offset });

        // Method 1: Use string interpolation (recommended for MySQL LIMIT/OFFSET)
        const [products] = await dbPool.execute(
            `SELECT p.*, c.name as category_name,
                GROUP_CONCAT(CONCAT(pq.id, ':', pq.quantity, ':', pq.unit_type) SEPARATOR '|') as quantities
             FROM products p 
             JOIN categories c ON p.category_id = c.id 
             LEFT JOIN product_quantities pq ON p.id = pq.product_id
             WHERE p.category_id = ? AND p.is_active = TRUE 
             GROUP BY p.id
             ORDER BY p.name
             LIMIT ${limit} OFFSET ${offset}`,
            [categoryId]
        );

        // Optional: Get total count for pagination info
        const [countResult] = await dbPool.execute(
            `SELECT COUNT(DISTINCT p.id) as total 
             FROM products p 
             WHERE p.category_id = ? AND p.is_active = TRUE`,
            [categoryId]
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        sendResponse(res, 200, true, 'Products retrieved successfully', {
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Get products by category error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve products by category');
    }
});



// GET /api/products/search - Search products
app.get('/api/products/search', async (req, res) => {
    try {
        const { q = '', category = '', page = 1, limit = 20, sort = 'name', order = 'asc' } = req.query;

        // Parse and validate pagination parameters
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (parsedPage - 1) * parsedLimit;

        // Validate sort parameters
        const allowedSortFields = ['name', 'created_at', 'updated_at'];
        const allowedOrders = ['asc', 'desc'];
        const sortField = allowedSortFields.includes(sort) ? sort : 'name';
        const sortOrder = allowedOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';

        let query = `
            SELECT p.*, c.name as category_name,
                   GROUP_CONCAT(
                       CONCAT(pq.id, ':', pq.quantity, ':', pq.unit_type) 
                       ORDER BY pq.id 
                       SEPARATOR '|'
                   ) as quantities
            FROM products p 
            JOIN categories c ON p.category_id = c.id 
            LEFT JOIN product_quantities pq ON p.id = pq.product_id
            WHERE p.is_active = TRUE AND c.is_active = TRUE
        `;

        const params = [];

        if (q && q.trim()) {
            query += ` AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)`;
            const searchTerm = `%${q.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (category && !isNaN(parseInt(category, 10))) {
            query += ` AND p.category_id = ?`;
            params.push(parseInt(category, 10));
        }

        // Use string interpolation for GROUP BY, ORDER BY, LIMIT (MySQL 8.0.42 requirement)
        query += ` GROUP BY p.id, p.name, p.description, p.category_id, p.image, p.is_active, p.created_at, p.updated_at, c.name
                   ORDER BY p.${sortField} ${sortOrder}
                   LIMIT ${parsedLimit} OFFSET ${offset}`;

        console.log('Search query:', { q, category, page: parsedPage, limit: parsedLimit, sort: sortField, order: sortOrder });

        const [products] = await dbPool.execute(query, params);

        // Get total count for pagination info
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM products p 
            JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = TRUE AND c.is_active = TRUE
        `;

        const countParams = [];

        if (q && q.trim()) {
            countQuery += ` AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)`;
            const searchTerm = `%${q.trim()}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (category && !isNaN(parseInt(category, 10))) {
            countQuery += ` AND p.category_id = ?`;
            countParams.push(parseInt(category, 10));
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parsedLimit);

        // Process quantities safely
        const productsWithQuantities = products.map(product => ({
            ...product,
            quantities: product.quantities ? product.quantities.split('|').map(q => {
                const [id, quantity, unit_type] = q.split(':');
                return {
                    id: parseInt(id) || 0,
                    quantity: quantity || '',
                    unit_type: unit_type || 'piece'
                };
            }) : []
        }));

        sendResponse(res, 200, true, 'Search results retrieved successfully', {
            products: productsWithQuantities,
            pagination: {
                currentPage: parsedPage,
                totalPages,
                totalItems: total,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            searchParams: {
                query: q || null,
                category: category || null,
                sort: sortField,
                order: sortOrder.toLowerCase()
            }
        });
    } catch (error) {
        console.error('Search products error:', error);
        sendResponse(res, 500, false, 'Search failed', null, error.message);
    }
});

// GET /api/products/:productId - Product details
app.get('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const [products] = await dbPool.execute(
      `SELECT p.*, c.name as category_name FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ? AND p.is_active = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      return sendResponse(res, 404, false, 'Product not found');
    }

    const [quantities] = await dbPool.execute(
      'SELECT * FROM product_quantities WHERE product_id = ?',
      [productId]
    );

    const product = {
      ...products[0],
      quantities
    };

    sendResponse(res, 200, true, 'Product details retrieved successfully', product);
  } catch (error) {
    console.error('Get product details error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve product details');
  }
});

// ========================================
// Cart
// ========================================
// Add item to cart
app.post('/api/cart/add', authenticateToken, authorize(['buyer']), [
    body('product_id').isInt().withMessage('Valid product ID required'),
    body('quantity_id').isInt().withMessage('Valid quantity ID required'),
    body('requested_quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
    body('notes').optional().trim()
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const { product_id, quantity_id, requested_quantity, notes } = req.body;

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle existing items
        await connection.execute(
            `INSERT INTO cart_items (buyer_id, product_id, quantity_id, requested_quantity, notes) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       requested_quantity = VALUES(requested_quantity),
       notes = VALUES(notes),
       updated_at = CURRENT_TIMESTAMP`,
            [req.user.id, product_id, quantity_id, requested_quantity, notes || null]
        );

        sendResponse(res, 200, true, 'Item added to cart successfully');
    } catch (error) {
        console.error('Add to cart error:', error);
        sendResponse(res, 500, false, 'Failed to add item to cart');
    } finally {
        connection.release();
    }
});

// Get cart items for buyer
app.get('/api/cart', authenticateToken, authorize(['buyer']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const [cartItems] = await connection.execute(
            `SELECT 
        c.id as cart_item_id,
        c.product_id,
        c.quantity_id,
        c.requested_quantity,
        c.notes,
        c.created_at,
        c.updated_at,
        p.name as product_name,
        p.description as product_description,
        q.quantity as quantity_value,
        q.unit_type as quantity_unit
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     JOIN product_quantities q ON c.quantity_id = q.id
     WHERE c.buyer_id = ?
     ORDER BY c.updated_at DESC`,
            [req.user.id]
        );


        sendResponse(res, 200, true, 'Cart retrieved successfully', { items: cartItems });
    } catch (error) {
        console.error('Get cart error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve cart');
    } finally {
        connection.release();
    }
});

// Update cart item quantity
app.put('/api/cart/update/:cartItemId', authenticateToken, authorize(['buyer']), [
    param('cartItemId').isInt().withMessage('Valid cart item ID required'),
    body('requested_quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
    body('notes').optional().trim()
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const { cartItemId } = req.params;
        const { requested_quantity, notes } = req.body;

        const [result] = await connection.execute(
            `UPDATE cart_items 
       SET requested_quantity = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND buyer_id = ?`,
            [requested_quantity, notes || null, cartItemId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return sendResponse(res, 404, false, 'Cart item not found');
        }

        sendResponse(res, 200, true, 'Cart item updated successfully');
    } catch (error) {
        console.error('Update cart error:', error);
        sendResponse(res, 500, false, 'Failed to update cart item');
    } finally {
        connection.release();
    }
});

// Remove item from cart
app.delete('/api/cart/remove/:cartItemId', authenticateToken, authorize(['buyer']), [
    param('cartItemId').isInt().withMessage('Valid cart item ID required')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const { cartItemId } = req.params;

        const [result] = await connection.execute(
            'DELETE FROM cart_items WHERE id = ? AND buyer_id = ?',
            [cartItemId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return sendResponse(res, 404, false, 'Cart item not found');
        }

        sendResponse(res, 200, true, 'Item removed from cart successfully');
    } catch (error) {
        console.error('Remove from cart error:', error);
        sendResponse(res, 500, false, 'Failed to remove item from cart');
    } finally {
        connection.release();
    }
});

// Clear entire cart
app.delete('/api/cart/clear', authenticateToken, authorize(['buyer']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.execute(
            'DELETE FROM cart_items WHERE buyer_id = ?',
            [req.user.id]
        );

        sendResponse(res, 200, true, 'Cart cleared successfully');
    } catch (error) {
        console.error('Clear cart error:', error);
        sendResponse(res, 500, false, 'Failed to clear cart');
    } finally {
        connection.release();
    }
});


// ========================================
// Orders
// ========================================
// Fixed POST /api/buyer/orders/create-from-cart - Create order from cart
// BUYER APIs - Fixed to align with B2B marketplace logic

// Create order from cart - Fixed to not include price calculation initially

// Get buyer's orders
app.get('/api/orders/my-orders', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { status = '', page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit;

        if (parsedLimit <= 0 || parsedLimit > 100) {
            return sendResponse(res, 400, false, 'Invalid limit parameter (must be between 1-100)');
        }

        if (parsedPage <= 0) {
            return sendResponse(res, 400, false, 'Invalid page parameter');
        }

        let query = `
            SELECT o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                   o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                   o.notes, o.created_at, o.updated_at,
                   u.name as accepted_seller_name,
                   COUNT(q.id) as quotation_count
            FROM orders o 
            LEFT JOIN users u ON o.accepted_seller_id = u.id 
            LEFT JOIN quotations q ON o.id = q.order_id
            WHERE o.buyer_id = ?
        `;

        const params = [req.user.id];

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }

        query += ` GROUP BY o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                          o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                          o.notes, o.created_at, o.updated_at, u.name
                   ORDER BY o.created_at DESC 
                   LIMIT ${parsedLimit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        // Get total count for pagination info
        let countQuery = `
            SELECT COUNT(DISTINCT o.id) as total
            FROM orders o 
            WHERE o.buyer_id = ?
        `;

        const countParams = [req.user.id];

        if (status) {
            countQuery += ` AND o.status = ?`;
            countParams.push(status);
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parsedLimit);

        sendResponse(res, 200, true, 'Orders retrieved successfully', {
            orders,
            pagination: {
                currentPage: parsedPage,
                totalPages,
                totalItems: total,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            filters: {
                status: status || null
            }
        });
    } catch (error) {
        console.error('Get buyer orders error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve orders');
    }
});

app.get('/api/quotations/:quotationId/order', authenticateToken, async (req, res) => {
    try {
        const { quotationId } = req.params;

        const [quotations] = await dbPool.execute(
            'SELECT order_id FROM quotations WHERE id = ?',
            [quotationId]
        );

        if (quotations.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found');
        }

        sendResponse(res, 200, true, 'Order ID retrieved successfully', {
            order_id: quotations[0].order_id
        });

    } catch (error) {
        console.error('Get quotation order error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order information');
    }
});
// Cancel order - Fixed to handle stock restoration properly
app.put('/api/orders/:orderId/cancel', authenticateToken, authorize(['buyer']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Check if order exists and belongs to user
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        const order = orders[0];

        if (!['pending', 'in_progress'].includes(order.status)) {
            return sendResponse(res, 400, false, 'Cannot cancel order in current status');
        }

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
            ['cancelled', orderId]
        );

        // Cancel all quotations for this order
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = NOW() WHERE order_id = ?',
            ['cancelled', orderId]
        );

        // Close all active chats for this order
        await connection.execute(
            `UPDATE order_chat_participants 
             SET chat_status = 'closed', closed_at = NOW()
             WHERE order_id = ? AND chat_status = 'active'`,
            [orderId]
        );

        await connection.commit();
        sendResponse(res, 200, true, 'Order cancelled successfully');

    } catch (error) {
        await connection.rollback();
        console.error('Cancel order error:', error);
        sendResponse(res, 500, false, 'Failed to cancel order');
    } finally {
        connection.release();
    }
});

// Get quotations for an order

// Accept quotation - This is where the order gets its final price
app.post('/api/orders/:orderId/accept-quotation', authenticateToken, authorize(['buyer']), [
    body('quotation_id').isInt().withMessage('Valid quotation ID required')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { quotation_id } = req.body;

        // Verify order ownership and status
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        if (orders[0].status !== 'pending' && orders[0].status !== 'in_progress') {
            return sendResponse(res, 400, false, 'Cannot accept quotation for order in current status');
        }

        // Verify quotation exists and belongs to this order
        const [quotations] = await connection.execute(
            'SELECT * FROM quotations WHERE id = ? AND order_id = ? AND status = ?',
            [quotation_id, orderId, 'pending']
        );

        if (quotations.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found or already processed');
        }

        const quotation = quotations[0];

        // Update order with accepted seller and final total amount
        await connection.execute(
            'UPDATE orders SET status = ?, accepted_seller_id = ?, total_amount = ?, updated_at = NOW() WHERE id = ?',
            ['accepted', quotation.seller_id, quotation.total_amount, orderId]
        );

        // Accept the quotation
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = NOW() WHERE id = ?',
            ['accepted', quotation_id]
        );

        // Reject all other quotations for this order
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = NOW() WHERE order_id = ? AND id != ?',
            ['rejected', orderId, quotation_id]
        );

        // Close chats with other sellers (assuming closeOrderChat function exists)
        const [otherQuotations] = await connection.execute(
            'SELECT seller_id FROM quotations WHERE order_id = ? AND id != ?',
            [orderId, quotation_id]
        );

        for (const quote of otherQuotations) {
            // Close chat with rejected sellers
            await connection.execute(
                `UPDATE order_chat_participants 
                 SET chat_status = 'closed', closed_at = NOW()
                 WHERE order_id = ? AND seller_id = ? AND chat_status = 'active'`,
                [orderId, quote.seller_id]
            );
        }

        await connection.commit();
        sendResponse(res, 200, true, 'Quotation accepted successfully', {
            order_id: orderId,
            accepted_seller_id: quotation.seller_id,
            final_total_amount: quotation.total_amount
        });

    } catch (error) {
        await connection.rollback();
        console.error('Accept quotation error:', error);
        sendResponse(res, 500, false, 'Failed to accept quotation');
    } finally {
        connection.release();
    }
});

// Order History
app.get('/api/orders/history', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { start_date, end_date, status, page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit;

        if (parsedLimit <= 0 || parsedLimit > 100) {
            return sendResponse(res, 400, false, 'Invalid limit parameter (must be between 1-100)');
        }

        if (parsedPage <= 0) {
            return sendResponse(res, 400, false, 'Invalid page parameter');
        }

        let query = `
            SELECT o.*, u.name as accepted_seller_name
            FROM orders o 
            LEFT JOIN users u ON o.accepted_seller_id = u.id 
            WHERE o.buyer_id = ?
        `;

        const params = [req.user.id];

        if (start_date) {
            query += ` AND DATE(o.created_at) >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND DATE(o.created_at) <= ?`;
            params.push(end_date);
        }

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY o.created_at DESC LIMIT ${parsedLimit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        // Get total count for pagination info
        let countQuery = `
            SELECT COUNT(*) as total
            FROM orders o 
            WHERE o.buyer_id = ?
        `;

        const countParams = [req.user.id];

        if (start_date) {
            countQuery += ` AND DATE(o.created_at) >= ?`;
            countParams.push(start_date);
        }

        if (end_date) {
            countQuery += ` AND DATE(o.created_at) <= ?`;
            countParams.push(end_date);
        }

        if (status) {
            countQuery += ` AND o.status = ?`;
            countParams.push(status);
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parsedLimit);

        sendResponse(res, 200, true, 'Order history retrieved successfully', {
            orders,
            pagination: {
                currentPage: parsedPage,
                totalPages,
                totalItems: total,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            filters: {
                start_date: start_date || null,
                end_date: end_date || null,
                status: status || null
            }
        });
    } catch (error) {
        console.error('Get order history error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order history');
    }
});

// Get order details
app.get('/api/orders/:orderId/details', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { orderId } = req.params;

        // Get order details
        const [orders] = await dbPool.execute(
            `SELECT o.*, u.name as accepted_seller_name, u.phone as seller_phone,
                    u.address as seller_address
             FROM orders o 
             LEFT JOIN users u ON o.accepted_seller_id = u.id 
             WHERE o.id = ? AND o.buyer_id = ?`,
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        // Get order items with product details
        const [items] = await dbPool.execute(
            `SELECT oi.*, p.name as product_name, p.description as product_description,
                    pq.quantity, pq.unit_type, c.name as category_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN product_quantities pq ON oi.quantity_id = pq.id
             JOIN categories c ON p.category_id = c.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const orderDetails = {
            ...orders[0],
            items
        };

        sendResponse(res, 200, true, 'Order details retrieved successfully', orderDetails);
    } catch (error) {
        console.error('Get order details error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order details');
    }
});

// Reorder functionality - Creates new order from existing one
app.post('/api/orders/:orderId/reorder', authenticateToken, authorize(['buyer']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Get original order
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Original order not found');
        }

        const originalOrder = orders[0];

        // Create new order - starts fresh without price
        const [newOrderResult] = await connection.execute(
            `INSERT INTO orders (buyer_id, order_name, delivery_address, delivery_latitude, delivery_longitude, notes, status, total_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                `Reorder: ${originalOrder.order_name}`,
                originalOrder.delivery_address,
                originalOrder.delivery_latitude,
                originalOrder.delivery_longitude,
                originalOrder.notes,
                'pending',
                0 // Start with 0 amount, will be set when quotation is accepted
            ]
        );

        const newOrderId = newOrderResult.insertId;

        // Copy order items
        await connection.execute(
            `INSERT INTO order_items (order_id, product_id, quantity_id, requested_quantity, notes)
             SELECT ?, product_id, quantity_id, requested_quantity, notes
             FROM order_items WHERE order_id = ?`,
            [newOrderId, orderId]
        );

        await connection.commit();
        sendResponse(res, 201, true, 'Reorder created successfully', {
            orderId: newOrderId,
            message: 'New order created from previous order. Sellers can now submit quotations.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Reorder error:', error);
        sendResponse(res, 500, false, 'Failed to create reorder');
    } finally {
        connection.release();
    }
});
// ========================================
// Address
// ========================================

// GET /api/addresses/my-addresses - List addresses
app.get('/api/addresses/my-addresses', authenticateToken, async (req, res) => {
  try {
    const [addresses] = await dbPool.execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    sendResponse(res, 200, true, 'Addresses retrieved successfully', addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve addresses');
  }
});

// POST /api/addresses/add - Add new address

app.post('/api/addresses/add', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Address name is required'), // Added validation for name
  body('address_line').trim().notEmpty().withMessage('Address line required'),
  body('latitude').optional().isFloat().withMessage('Valid latitude required'),
  body('longitude').optional().isFloat().withMessage('Valid longitude required')
], handleValidationErrors, async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

      const {
          name,
          address_line,
          landmark = null,
          latitude = null,
          longitude = null,
          is_default = false
      } = req.body;
      // Destructure name

    // If this is set as default, remove default from other addresses
    if (is_default) {
      await connection.execute(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
        [req.user.id]
      );
    }

    const [result] = await connection.execute(
      'INSERT INTO user_addresses (user_id, name, address_line, landmark, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)', // Added name to INSERT
      [req.user.id, name, address_line, landmark, latitude, longitude, is_default] // Added name to values
    );

    await connection.commit();
    sendResponse(res, 201, true, 'Address added successfully', { addressId: result.insertId });

  } catch (error) {
    await connection.rollback();
    console.error('Add address error:', error);
    sendResponse(res, 500, false, 'Failed to add address');
  } finally {
    connection.release();
  }
});
// PUT /api/addresses/:addressId - Update address
app.put('/api/addresses/:addressId', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Address name is required'), // Added validation for name
  body('address_line').trim().notEmpty().withMessage('Address line required'),
  body('latitude').optional().isFloat().withMessage('Valid latitude required'),
  body('longitude').optional().isFloat().withMessage('Valid longitude required')
], handleValidationErrors, async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const { addressId } = req.params;
      const {
          name,
          address_line,
          landmark = null,
          latitude = null,
          longitude = null,
          is_default = false
      } = req.body;
      // Destructure name

    // Verify address ownership
    const [addresses] = await connection.execute(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );

    if (addresses.length === 0) {
      return sendResponse(res, 404, false, 'Address not found');
    }

    // If this is set as default, remove default from other addresses
    if (is_default) {
      await connection.execute(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?',
        [req.user.id, addressId]
      );
    }

    await connection.execute(
      'UPDATE user_addresses SET name = ?, address_line = ?, landmark = ?, latitude = ?, longitude = ?, is_default = ?, updated_at = NOW() WHERE id = ?', // Added name to UPDATE
      [name, address_line, landmark, latitude, longitude, is_default, addressId] // Added name to values
    );

    await connection.commit();
    sendResponse(res, 200, true, 'Address updated successfully');

  } catch (error) {
    await connection.rollback();
    console.error('Update address error:', error);
    sendResponse(res, 500, false, 'Failed to update address');
  } finally {
    connection.release();
  }
});

// DELETE /api/addresses/:addressId - Delete address
app.delete('/api/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const [result] = await dbPool.execute(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Address not found');
    }

    sendResponse(res, 200, true, 'Address deleted successfully');
  } catch (error) {
    console.error('Delete address error:', error);
    sendResponse(res, 500, false, 'Failed to delete address');
  }
});
// GET /api/orders/:orderId/track - Track order status
app.get('/api/orders/:orderId/track', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { orderId } = req.params;

        const [orders] = await dbPool.execute(
            `SELECT o.*, u.name as seller_name, u.phone as seller_phone
             FROM orders o 
             LEFT JOIN users u ON o.accepted_seller_id = u.id 
             WHERE o.id = ? AND o.buyer_id = ?`,
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        // Get order timeline/status history if you have a table for it
        const orderTracking = {
            ...orders[0],
            timeline: [
                { status: 'pending', timestamp: orders[0].created_at, description: 'Order placed' },
                ...(orders[0].status !== 'pending' ? [{ status: orders[0].status, timestamp: orders[0].updated_at, description: `Order ${orders[0].status}` }] : [])
            ]
        };

        sendResponse(res, 200, true, 'Order tracking retrieved successfully', orderTracking);
    } catch (error) {
        console.error('Track order error:', error);
        sendResponse(res, 500, false, 'Failed to track order');
    }
});



// ========================================
// GENERAL ORDER APIs (Both Buyer and Seller)
// ========================================

// GET /api/orders/status-counts - Get order status counts
app.get('/api/orders/status-counts', authenticateToken, async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'buyer') {
            query = `
                SELECT 
                    status,
                    COUNT(*) as count
                FROM orders 
                WHERE buyer_id = ?
                GROUP BY status
            `;
            params = [req.user.id];
        } else if (req.user.role === 'seller') {
            query = `
                SELECT 
                    status,
                    COUNT(*) as count
                FROM orders 
                WHERE accepted_seller_id = ?
                GROUP BY status
            `;
            params = [req.user.id];
        } else {
            return sendResponse(res, 403, false, 'Unauthorized');
        }

        const [statusCounts] = await dbPool.execute(query, params);

        // Convert to object for easier frontend consumption
        const counts = {};
        statusCounts.forEach(row => {
            counts[row.status] = row.count;
        });

        sendResponse(res, 200, true, 'Order status counts retrieved successfully', counts);
    } catch (error) {
        console.error('Get order status counts error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order status counts');
    }
});


app.post('/api/buyer/orders/create-from-cart', authenticateToken, authorize(['buyer']), [
    body('order_name').notEmpty().withMessage('Order name is required'),
    body('delivery_address').notEmpty().withMessage('Delivery address is required'),
    body('delivery_latitude').optional().isDecimal().withMessage('Valid latitude required'),
    body('delivery_longitude').optional().isDecimal().withMessage('Valid longitude required'),
    body('general_notes').optional().trim(),
    body('productNotes').optional().isObject().withMessage('Product notes must be an object')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            order_name,
            delivery_address,
            delivery_latitude,
            delivery_longitude,
            general_notes,
            productNotes
        } = req.body;

        const buyer_id = req.user.id;

        // Get cart items without price calculations (sellers will quote prices)
        const [cartItems] = await connection.execute(
            `SELECT 
                ci.product_id, 
                ci.quantity_id, 
                ci.requested_quantity, 
                ci.notes as cart_notes,
                p.name as product_name, 
                p.description as product_description,
                q.quantity as quantity_value,
                q.unit_type as quantity_unit
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             JOIN product_quantities q ON ci.quantity_id = q.id
             WHERE ci.buyer_id = ?`,
            [buyer_id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            return sendResponse(res, 400, false, 'Cart is empty');
        }

        // Prepare general notes for the main 'orders' table
        const finalGeneralNotes = (general_notes && general_notes.trim()) ? general_notes.trim() : null;

        // Insert into orders table - No total_amount initially (will be set when quotation is accepted)
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (
                buyer_id, 
                order_name, 
                delivery_address, 
                delivery_latitude, 
                delivery_longitude, 
                status, 
                total_amount, 
                notes, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
                buyer_id,
                order_name,
                delivery_address,
                delivery_latitude || null,
                delivery_longitude || null,
                'pending',
                0, // Initial amount is 0, will be updated when quotation is accepted
                finalGeneralNotes
            ]
        );

        const order_id = orderResult.insertId;

        // Insert into order_items table with proper note handling
        for (const item of cartItems) {
            // Debug logging
            console.log(`Processing item - Product ID: ${item.product_id}, Quantity ID: ${item.quantity_id}, Cart Notes: "${item.cart_notes}"`);
            console.log(`ProductNotes received:`, productNotes);

            // Get item-specific note - priority: productNotes > cart_notes > null
            let itemNote = null;

            // First check if productNotes has a note for this specific quantity_id (since that's the unique identifier)
            if (productNotes && productNotes[item.quantity_id]) {
                const productNote = productNotes[item.quantity_id];
                console.log(`Found productNote for quantity_id ${item.quantity_id}:`, productNote);

                if (typeof productNote === 'string' && productNote.trim()) {
                    itemNote = productNote.trim();
                } else if (typeof productNote === 'object' && productNote.notes && productNote.notes.trim()) {
                    itemNote = productNote.notes.trim();
                }
            }
            // Fallback: check if productNotes uses product_id as key
            else if (productNotes && productNotes[item.product_id]) {
                const productNote = productNotes[item.product_id];
                console.log(`Found productNote for product_id ${item.product_id}:`, productNote);

                if (typeof productNote === 'string' && productNote.trim()) {
                    itemNote = productNote.trim();
                } else if (typeof productNote === 'object' && productNote.notes && productNote.notes.trim()) {
                    itemNote = productNote.notes.trim();
                }
            }

            // If no productNote found, use cart notes
            if (!itemNote && item.cart_notes && item.cart_notes.trim()) {
                itemNote = item.cart_notes.trim();
                console.log(`Using cart notes for quantity_id ${item.quantity_id}: "${itemNote}"`);
            }

            console.log(`Final note for quantity_id ${item.quantity_id}: "${itemNote}"`);

            await connection.execute(
                `INSERT INTO order_items (
                    order_id, 
                    product_id, 
                    quantity_id, 
                    requested_quantity, 
                    notes, 
                    created_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    order_id,
                    item.product_id,
                    item.quantity_id,
                    item.requested_quantity,
                    itemNote
                ]
            );
        }

        // Clear cart after order creation
        await connection.execute(
            'DELETE FROM cart_items WHERE buyer_id = ?',
            [buyer_id]
        );

        await connection.commit();
        sendResponse(res, 201, true, 'Order created successfully', {
            order_id: order_id,
            order_name: order_name,
            total_amount: 0, // Will be updated when quotation is accepted
            status: 'pending',
            delivery_address: delivery_address
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create order from cart error:', error);
        sendResponse(res, 500, false, 'Failed to create order', null, error.message);
    } finally {
        connection.release();
    }
});
// ========================================
// SECTION 7: SELLER ROUTES
// ========================================

// GET /api/seller/orders/available - Fixed GROUP BY clause
// BUYER APIs - Fixed to align with B2B marketplace logic

// Create order from cart - Fixed to not include price calculation initially

// Get buyer's orders
app.get('/api/orders/my-orders', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { status = '', page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit;

        if (parsedLimit <= 0 || parsedLimit > 100) {
            return sendResponse(res, 400, false, 'Invalid limit parameter (must be between 1-100)');
        }

        if (parsedPage <= 0) {
            return sendResponse(res, 400, false, 'Invalid page parameter');
        }

        let query = `
            SELECT o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                   o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                   o.notes, o.created_at, o.updated_at,
                   u.name as accepted_seller_name,
                   COUNT(q.id) as quotation_count
            FROM orders o 
            LEFT JOIN users u ON o.accepted_seller_id = u.id 
            LEFT JOIN quotations q ON o.id = q.order_id
            WHERE o.buyer_id = ?
        `;

        const params = [req.user.id];

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }

        query += ` GROUP BY o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                          o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                          o.notes, o.created_at, o.updated_at, u.name
                   ORDER BY o.created_at DESC 
                   LIMIT ${parsedLimit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        // Get total count for pagination info
        let countQuery = `
            SELECT COUNT(DISTINCT o.id) as total
            FROM orders o 
            WHERE o.buyer_id = ?
        `;

        const countParams = [req.user.id];

        if (status) {
            countQuery += ` AND o.status = ?`;
            countParams.push(status);
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parsedLimit);

        sendResponse(res, 200, true, 'Orders retrieved successfully', {
            orders,
            pagination: {
                currentPage: parsedPage,
                totalPages,
                totalItems: total,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            filters: {
                status: status || null
            }
        });
    } catch (error) {
        console.error('Get buyer orders error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve orders');
    }
});

// Cancel order - Fixed to handle stock restoration properly
app.put('/api/orders/:orderId/cancel', authenticateToken, authorize(['buyer']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Check if order exists and belongs to user
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        const order = orders[0];

        if (!['pending', 'in_progress'].includes(order.status)) {
            return sendResponse(res, 400, false, 'Cannot cancel order in current status');
        }

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
            ['cancelled', orderId]
        );

        // Cancel all quotations for this order
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = NOW() WHERE order_id = ?',
            ['cancelled', orderId]
        );

        // Close all active chats for this order
        await connection.execute(
            `UPDATE order_chat_participants 
             SET chat_status = 'closed', closed_at = NOW()
             WHERE order_id = ? AND chat_status = 'active'`,
            [orderId]
        );

        await connection.commit();
        sendResponse(res, 200, true, 'Order cancelled successfully');

    } catch (error) {
        await connection.rollback();
        console.error('Cancel order error:', error);
        sendResponse(res, 500, false, 'Failed to cancel order');
    } finally {
        connection.release();
    }
});

app.get('/api/orders/:orderId/quotations', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { orderId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = (page - 1) * limit;

        // Verify order ownership and get delivery coordinates
        const [orders] = await dbPool.execute(
            `SELECT delivery_latitude, delivery_longitude 
             FROM orders 
             WHERE id = ? AND buyer_id = ?`,
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        const { delivery_latitude, delivery_longitude } = orders[0];

        // Get total count for pagination
        const [countResult] = await dbPool.execute(
            `SELECT COUNT(*) as count FROM quotations 
             WHERE order_id = ? AND status = 'pending'`,
            [orderId]
        );

        const total = countResult[0].count;
        const totalPages = Math.ceil(total / limit);

        // Get quotations with seller coordinates
        const [quotations] = await dbPool.execute(
            `SELECT q.*, 
                    u.name AS seller_name, 
                    u.address AS seller_address,
                    u.latitude AS seller_latitude, 
                    u.longitude AS seller_longitude
             FROM quotations q
             JOIN users u ON q.seller_id = u.id
             WHERE q.order_id = ? AND q.status = 'pending'
             ORDER BY q.total_amount ASC
             LIMIT ${limit} OFFSET ${offset}`,
            [orderId]
        );

        // Haversine distance calculator
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return null;

            const R = 6371; // Earth radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return Math.round(R * c * 100) / 100; // Round to 2 decimals
        };

        // Add distance to each quotation
        const quotationsWithDistance = quotations.map(q => {
            const distance_km = calculateDistance(
                parseFloat(q.seller_latitude),
                parseFloat(q.seller_longitude),
                parseFloat(delivery_latitude),
                parseFloat(delivery_longitude)
            );

            return {
                ...q,
                distance_km
            };
        });

        sendResponse(res, 200, true, 'Quotations retrieved successfully', {
            page,
            limit,
            total,
            totalPages,
            quotations: quotationsWithDistance
        });

    } catch (error) {
        console.error('Get quotations with distance error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve quotations');
    }
});

app.get('/api/quotations/:quotationId/details', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { quotationId } = req.params;

        // Hardcoded pagination
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Check if the quotation belongs to the authenticated buyer and get basic quotation info
        const [quotationCheck] = await dbPool.execute(
            `SELECT q.id, q.notes, q.total_amount, q.discount, q.seller_id,
                    o.delivery_latitude, o.delivery_longitude,
                    s.name as seller_name, s.email as seller_email, s.phone as seller_phone,
                    s.address as seller_address, s.latitude as seller_latitude, s.longitude as seller_longitude
             FROM quotations q
             JOIN orders o ON q.order_id = o.id
             JOIN users s ON q.seller_id = s.id
             WHERE q.id = ? AND o.buyer_id = ?`,
            [quotationId, req.user.id]
        );

        if (quotationCheck.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found or access denied');
        }

        const quotationInfo = quotationCheck[0];

        // Calculate distance using Haversine formula
        let distance = null;
        if (quotationInfo.seller_latitude && quotationInfo.seller_longitude &&
            quotationInfo.delivery_latitude && quotationInfo.delivery_longitude) {

            const R = 6371; // Earth's radius in kilometers
            const dLat = (quotationInfo.delivery_latitude - quotationInfo.seller_latitude) * Math.PI / 180;
            const dLon = (quotationInfo.delivery_longitude - quotationInfo.seller_longitude) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(quotationInfo.seller_latitude * Math.PI / 180) * Math.cos(quotationInfo.delivery_latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance = Math.round(R * c * 100) / 100; // 2 decimal places
        }

        // Get detailed quotation items
        const [items] = await dbPool.execute(
            `SELECT 
                qi.id as quotation_item_id,
                qi.price_per_unit,
                qi.available_quantity,
                qi.is_available,
                qi.total_price,
                p.id as product_id,
                p.name as product_name,
                p.description as product_description,
                p.image as product_image,
                pq.id as quantity_id,
                pq.quantity,
                pq.unit_type,
                oi.requested_quantity,
                oi.id as order_item_id
             FROM quotation_items qi
             JOIN order_items oi ON qi.order_item_id = oi.id
             JOIN product_quantities pq ON oi.quantity_id = pq.id
             JOIN products p ON pq.product_id = p.id
             WHERE qi.quotation_id = ?
             ORDER BY p.name ASC, pq.quantity ASC
             LIMIT 50`,
            [quotationId]
        );

        // Group items by product
        const productGroups = {};
        let grandTotal = 0;

        items.forEach(item => {
            const productId = item.product_id;
            const productName = item.product_name;

            if (!productGroups[productId]) {
                productGroups[productId] = {
                    product_id: productId,
                    product_name: productName,
                    product_description: item.product_description,
                    product_image: item.product_image,
                    quantities: [],
                    product_total: 0
                };
            }

            const perUnitPrice = item.available_quantity > 0
                ? Math.round((item.total_price / item.available_quantity) * 100) / 100
                : 0;

            const quantityDetail = {
                quotation_item_id: item.quotation_item_id,
                quantity_id: item.quantity_id,
                quantity_size: item.quantity,
                unit_type: item.unit_type,
                requested_quantity: item.requested_quantity,
                available_quantity: item.available_quantity,
                price_per_unit: perUnitPrice,
                quoted_price_per_unit: item.price_per_unit,
                total_price: item.total_price,
                is_available: item.is_available
            };

            productGroups[productId].quantities.push(quantityDetail);
            productGroups[productId].product_total += parseFloat(item.total_price);
            grandTotal += parseFloat(item.total_price);
        });

        const productsArray = Object.values(productGroups);

        // Get total count for pagination
        const [countResult] = await dbPool.execute(
            `SELECT COUNT(DISTINCT pq.product_id) as count 
             FROM quotation_items qi
             JOIN order_items oi ON qi.order_item_id = oi.id
             JOIN product_quantities pq ON oi.quantity_id = pq.id
             WHERE qi.quotation_id = ?`,
            [quotationId]
        );

        const total = countResult[0].count;
        const totalPages = Math.ceil(total / limit);

        const responseData = {
            quotation_info: {
                quotation_id: quotationId,
                seller_notes: quotationInfo.notes,
                total_amount: quotationInfo.total_amount,
                discount: quotationInfo.discount,
                calculated_grand_total: Math.round(grandTotal * 100) / 100
            },
            seller_info: {
                seller_id: quotationInfo.seller_id,
                name: quotationInfo.seller_name,
                email: quotationInfo.seller_email,
                phone: quotationInfo.seller_phone,
                address: quotationInfo.seller_address,
                coordinates: {
                    latitude: quotationInfo.seller_latitude,
                    longitude: quotationInfo.seller_longitude
                }
            },
            delivery_info: {
                coordinates: {
                    latitude: quotationInfo.delivery_latitude,
                    longitude: quotationInfo.delivery_longitude
                },
                distance_km: distance
            },
            pagination: {
                page,
                limit,
                total,
                totalPages
            },
            products: productsArray
        };

        sendResponse(res, 200, true, 'Quotation items retrieved successfully', responseData);

    } catch (error) {
        console.error('Get quotation items with pagination error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve quotation items');
    }
});

app.get('/api/orders/:orderId/quotation-summary', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { orderId } = req.params;

        // Verify order ownership
        const [orders] = await dbPool.execute(
            'SELECT id FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );
        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        // Get all order items
        const [orderItems] = await dbPool.execute(
            'SELECT id, requested_quantity FROM order_items WHERE order_id = ?',
            [orderId]
        );
        const totalOrderItems = orderItems.length;

        if (totalOrderItems === 0) {
            return sendResponse(res, 200, true, 'No items in the order');
        }

        // Get all quotations for the order
        const [quotations] = await dbPool.execute(
            'SELECT * FROM quotations WHERE order_id = ? AND status = "pending"',
            [orderId]
        );

        const result = [];

        for (const quotation of quotations) {
            const [quotationItems] = await dbPool.execute(
                `SELECT qi.*, oi.requested_quantity
                 FROM quotation_items qi
                 JOIN order_items oi ON qi.order_item_id = oi.id
                 WHERE qi.quotation_id = ?`,
                [quotation.id]
            );

            let fullMatch = 0;
            let partialMatch = 0;
            let missing = 0;

            const matchedOrderItemIds = new Set();

            for (const item of quotationItems) {
                matchedOrderItemIds.add(item.order_item_id);

                if (item.available_quantity >= item.requested_quantity) {
                    fullMatch++;
                } else if (item.available_quantity > 0) {
                    partialMatch++;
                } else {
                    missing++;
                }
            }

            const unmatchedCount = totalOrderItems - matchedOrderItemIds.size;
            missing += unmatchedCount;

            let status = '❌ Missing items';
            if (missing === 0 && partialMatch === 0) {
                status = '✅ Full match';
            } else if (missing === 0) {
                status = '⚠️ Partial match';
            }

            result.push({
                quotation_id: quotation.id,
                seller_id: quotation.seller_id,
                total_amount: quotation.total_amount,
                match_status: status,
                counts: {
                    full: fullMatch,
                    partial: partialMatch,
                    missing: missing
                }
            });
        }

        sendResponse(res, 200, true, 'Quotation match summary fetched successfully', result);

    } catch (err) {
        console.error('Quotation match summary error:', err);
        sendResponse(res, 500, false, 'Internal server error');
    }
});



// Accept quotation - This is where the order gets its final price
app.post('/api/orders/:orderId/accept-quotation', authenticateToken, authorize(['buyer']), [
    body('quotation_id').isInt().withMessage('Valid quotation ID required')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { quotation_id } = req.body;

        // Verify order ownership and status
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        if (orders[0].status !== 'pending' && orders[0].status !== 'in_progress') {
            return sendResponse(res, 400, false, 'Cannot accept quotation for order in current status');
        }

        // Verify quotation exists and belongs to this order
        const [quotations] = await connection.execute(
            'SELECT * FROM quotations WHERE id = ? AND order_id = ? AND status = ?',
            [quotation_id, orderId, 'pending']
        );

        if (quotations.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found or already processed');
        }

        const quotation = quotations[0];

        // Update order with accepted seller and final total amount
        await connection.execute(
            'UPDATE orders SET status = ?, accepted_seller_id = ?, total_amount = ?, updated_at = NOW() WHERE id = ?',
            ['accepted', quotation.seller_id, quotation.total_amount, orderId]
        );

        // Accept the quotation
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = NOW() WHERE id = ?',
            ['accepted', quotation_id]
        );

        // Reject all other quotations for this order
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = NOW() WHERE order_id = ? AND id != ?',
            ['rejected', orderId, quotation_id]
        );

        // Close chats with other sellers (assuming closeOrderChat function exists)
        const [otherQuotations] = await connection.execute(
            'SELECT seller_id FROM quotations WHERE order_id = ? AND id != ?',
            [orderId, quotation_id]
        );

        for (const quote of otherQuotations) {
            // Close chat with rejected sellers
            await connection.execute(
                `UPDATE order_chat_participants 
                 SET chat_status = 'closed', closed_at = NOW()
                 WHERE order_id = ? AND seller_id = ? AND chat_status = 'active'`,
                [orderId, quote.seller_id]
            );
        }

        await connection.commit();
        sendResponse(res, 200, true, 'Quotation accepted successfully', {
            order_id: orderId,
            accepted_seller_id: quotation.seller_id,
            final_total_amount: quotation.total_amount
        });

    } catch (error) {
        await connection.rollback();
        console.error('Accept quotation error:', error);
        sendResponse(res, 500, false, 'Failed to accept quotation');
    } finally {
        connection.release();
    }
});

// Order History
app.get('/api/orders/history', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { start_date, end_date, status, page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const offset = (parsedPage - 1) * parsedLimit;

        if (parsedLimit <= 0 || parsedLimit > 100) {
            return sendResponse(res, 400, false, 'Invalid limit parameter (must be between 1-100)');
        }

        if (parsedPage <= 0) {
            return sendResponse(res, 400, false, 'Invalid page parameter');
        }

        let query = `
            SELECT o.*, u.name as accepted_seller_name
            FROM orders o 
            LEFT JOIN users u ON o.accepted_seller_id = u.id 
            WHERE o.buyer_id = ?
        `;

        const params = [req.user.id];

        if (start_date) {
            query += ` AND DATE(o.created_at) >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND DATE(o.created_at) <= ?`;
            params.push(end_date);
        }

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY o.created_at DESC LIMIT ${parsedLimit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        // Get total count for pagination info
        let countQuery = `
            SELECT COUNT(*) as total
            FROM orders o 
            WHERE o.buyer_id = ?
        `;

        const countParams = [req.user.id];

        if (start_date) {
            countQuery += ` AND DATE(o.created_at) >= ?`;
            countParams.push(start_date);
        }

        if (end_date) {
            countQuery += ` AND DATE(o.created_at) <= ?`;
            countParams.push(end_date);
        }

        if (status) {
            countQuery += ` AND o.status = ?`;
            countParams.push(status);
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parsedLimit);

        sendResponse(res, 200, true, 'Order history retrieved successfully', {
            orders,
            pagination: {
                currentPage: parsedPage,
                totalPages,
                totalItems: total,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            filters: {
                start_date: start_date || null,
                end_date: end_date || null,
                status: status || null
            }
        });
    } catch (error) {
        console.error('Get order history error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order history');
    }
});

// Get order details
app.get('/api/orders/:orderId/details', authenticateToken, authorize(['buyer']), async (req, res) => {
    try {
        const { orderId } = req.params;

        // Get order details
        const [orders] = await dbPool.execute(
            `SELECT o.*, u.name as accepted_seller_name, u.phone as seller_phone,
                    u.address as seller_address
             FROM orders o 
             LEFT JOIN users u ON o.accepted_seller_id = u.id 
             WHERE o.id = ? AND o.buyer_id = ?`,
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        // Get order items with product details
        const [items] = await dbPool.execute(
            `SELECT oi.*, p.name as product_name, p.description as product_description,
                    pq.quantity, pq.unit_type, c.name as category_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN product_quantities pq ON oi.quantity_id = pq.id
             JOIN categories c ON p.category_id = c.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const orderDetails = {
            ...orders[0],
            items
        };

        sendResponse(res, 200, true, 'Order details retrieved successfully', orderDetails);
    } catch (error) {
        console.error('Get order details error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order details');
    }
});

// Reorder functionality - Creates new order from existing one
app.post('/api/orders/:orderId/reorder', authenticateToken, authorize(['buyer']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Get original order
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Original order not found');
        }

        const originalOrder = orders[0];

        // Create new order - starts fresh without price
        const [newOrderResult] = await connection.execute(
            `INSERT INTO orders (buyer_id, order_name, delivery_address, delivery_latitude, delivery_longitude, notes, status, total_amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                `Reorder: ${originalOrder.order_name}`,
                originalOrder.delivery_address,
                originalOrder.delivery_latitude,
                originalOrder.delivery_longitude,
                originalOrder.notes,
                'pending',
                0 // Start with 0 amount, will be set when quotation is accepted
            ]
        );

        const newOrderId = newOrderResult.insertId;

        // Copy order items
        await connection.execute(
            `INSERT INTO order_items (order_id, product_id, quantity_id, requested_quantity, notes)
             SELECT ?, product_id, quantity_id, requested_quantity, notes
             FROM order_items WHERE order_id = ?`,
            [newOrderId, orderId]
        );

        await connection.commit();
        sendResponse(res, 201, true, 'Reorder created successfully', {
            orderId: newOrderId,
            message: 'New order created from previous order. Sellers can now submit quotations.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Reorder error:', error);
        sendResponse(res, 500, false, 'Failed to create reorder');
    } finally {
        connection.release();
    }
});
// Analytics Routes
// SELLER APIs - Complete and Fixed

// Get available orders for sellers to quote on
app.get('/api/seller/orders/available', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { max_distance = 50 } = req.query;

        // Hardcoded pagination
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const sellerLat = req.user.latitude;
        const sellerLon = req.user.longitude;

        let query = `
            SELECT o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                   o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                   o.notes, o.created_at, o.updated_at,
                   u.name as buyer_name,
                   COUNT(q.id) as quotation_count,
                   (6371 * acos(cos(radians(?)) * cos(radians(o.delivery_latitude)) * 
                    cos(radians(o.delivery_longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(o.delivery_latitude)))) AS distance
            FROM orders o 
            JOIN users u ON o.buyer_id = u.id 
            LEFT JOIN quotations q ON o.id = q.order_id
            WHERE o.status IN ('pending', 'in_progress')
            AND o.id NOT IN (SELECT order_id FROM quotations WHERE seller_id = ?)
            GROUP BY o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                     o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                     o.notes, o.created_at, o.updated_at, u.name
        `;

        const params = [sellerLat, sellerLon, sellerLat, req.user.id];

        const distanceFloat = parseFloat(max_distance);
        if (!isNaN(distanceFloat)) {
            query += ` HAVING distance <= ?`;
            params.push(distanceFloat);
        }

        // Hardcoded limit and offset
        query += ` ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        sendResponse(res, 200, true, 'Available orders retrieved successfully', orders);
    } catch (error) {
        console.error('Get available orders error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve available orders', null, error.message);
    }
});
app.get('/api/seller/orders/filter', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { max_distance = 50, min_date, max_date, buyer_name } = req.query;

        // Hardcoded pagination
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const sellerLat = req.user.latitude;
        const sellerLon = req.user.longitude;

        let query = `
            SELECT o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                   o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                   o.notes, o.created_at, o.updated_at,
                   u.name as buyer_name,
                   COUNT(q.id) as quotation_count,
                   (6371 * acos(cos(radians(?)) * cos(radians(o.delivery_latitude)) * 
                    cos(radians(o.delivery_longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(o.delivery_latitude)))) AS distance
            FROM orders o 
            JOIN users u ON o.buyer_id = u.id 
            LEFT JOIN quotations q ON o.id = q.order_id
            WHERE o.status IN ('pending', 'in_progress')
            AND o.id NOT IN (SELECT order_id FROM quotations WHERE seller_id = ?)
        `;

        const params = [sellerLat, sellerLon, sellerLat, req.user.id];

        if (min_date) {
            query += ` AND DATE(o.created_at) >= ?`;
            params.push(min_date);
        }

        if (max_date) {
            query += ` AND DATE(o.created_at) <= ?`;
            params.push(max_date);
        }

        if (buyer_name) {
            query += ` AND u.name LIKE ?`;
            params.push(`%${buyer_name}%`);
        }

        query += ` GROUP BY o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                          o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                          o.notes, o.created_at, o.updated_at, u.name`;

        if (sellerLat && sellerLon) {
            query += ` HAVING distance <= ?`;
            params.push(parseFloat(max_distance));
        }

        // Hardcoded limit and offset
        query += ` ORDER BY distance ASC, o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        sendResponse(res, 200, true, 'Filtered orders retrieved successfully', orders);
    } catch (error) {
        console.error('Filter orders error:', error);
        sendResponse(res, 500, false, 'Failed to filter orders');
    }
});

// Get detailed order view for sellers
app.get('/api/seller/orders/:orderId/details', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { orderId } = req.params;

        // Get order details
        const [orders] = await dbPool.execute(
            `SELECT o.*, u.name as buyer_name, u.phone as buyer_phone
             FROM orders o 
             JOIN users u ON o.buyer_id = u.id 
             WHERE o.id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found');
        }

        // Get order items - these are what the seller needs to quote on
        const [items] = await dbPool.execute(
            `SELECT oi.*, p.name as product_name, p.description as product_description,
                    pq.quantity, pq.unit_type, c.name as category_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN product_quantities pq ON oi.quantity_id = pq.id
             JOIN categories c ON p.category_id = c.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const orderDetails = {
            ...orders[0],
            items
        };

        sendResponse(res, 200, true, 'Order details retrieved successfully', orderDetails);
    } catch (error) {
        console.error('Get order details error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order details');
    }
});

// Create quotation - This is where sellers set their prices
app.post('/api/seller/quotations/create', authenticateToken, authorize(['seller']), [
    body('order_id').isInt().withMessage('Valid order ID required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.order_item_id').isInt().withMessage('Valid order item ID required'),
    body('items.*.price_per_unit').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('items.*.available_quantity').isInt({ min: 0 }).withMessage('Valid available quantity required'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Valid discount amount required')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { order_id, items, discount = 0, notes } = req.body;

        // Check if order exists and is quotable
        const [orders] = await dbPool.execute(
            'SELECT * FROM orders WHERE id = ? AND status IN (?, ?)',
            [order_id, 'pending', 'in_progress']
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found or not available for quotation');
        }

        // Check if seller already quoted for this order
        const [existingQuotations] = await connection.execute(
            'SELECT id FROM quotations WHERE order_id = ? AND seller_id = ?',
            [order_id, req.user.id]
        );

        if (existingQuotations.length > 0) {
            return sendResponse(res, 409, false, 'You have already submitted a quotation for this order');
        }

        // Calculate total amount based on seller's prices
        let totalAmount = 0;
        for (const item of items) {
            const [orderItems] = await connection.execute(
                'SELECT requested_quantity FROM order_items WHERE id = ? AND order_id = ?',
                [item.order_item_id, order_id]
            );

            if (orderItems.length === 0) {
                return sendResponse(res, 400, false, `Order item ${item.order_item_id} not found`);
            }

            const requestedQty = orderItems[0].requested_quantity;
            const availableQty = Math.min(requestedQty, item.available_quantity);
            totalAmount += item.price_per_unit * availableQty;
        }

        totalAmount -= discount;

        // Create quotation
        const [quotationResult] = await connection.execute(
            'INSERT INTO quotations (order_id, seller_id, total_amount, discount, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [order_id, req.user.id, totalAmount, discount, notes, 'pending']
        );

        const quotationId = quotationResult.insertId;

        // Add quotation items with seller's prices
        for (const item of items) {
            const [orderItems] = await connection.execute(
                'SELECT requested_quantity FROM order_items WHERE id = ? AND order_id = ?',
                [item.order_item_id, order_id]
            );

            const requestedQty = orderItems[0].requested_quantity;
            const availableQty = Math.min(requestedQty, item.available_quantity);
            const totalPrice = item.price_per_unit * availableQty;

            await connection.execute(
                'INSERT INTO quotation_items (quotation_id, order_item_id, price_per_unit, available_quantity, is_available, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [quotationId, item.order_item_id, item.price_per_unit, item.available_quantity, item.available_quantity > 0, totalPrice]
            );
        }

        // Update order status to in_progress (since quotations are being received)
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['in_progress', order_id]
        );

        // Create chat participants for buyer-seller communication
        await connection.execute(
            `INSERT INTO order_chat_participants (order_id, buyer_id, seller_id, quotation_id, chat_status, created_at) 
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [order_id, orders[0].buyer_id, req.user.id, quotationId, 'active']
        );

        await connection.commit();
        sendResponse(res, 201, true, 'Quotation created successfully', {
            quotationId,
            totalAmount,
            message: 'Quotation submitted successfully. Buyer will review and decide.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create quotation error:', error);
        sendResponse(res, 500, false, 'Failed to create quotation');
    } finally {
        connection.release();
    }
});

// Get seller's quotations
app.get('/api/seller/quotations/my-quotations', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { status = '' } = req.query;

        // Hardcoded pagination
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        let query = `
            SELECT q.*, o.order_name, o.delivery_address, u.name as buyer_name
            FROM quotations q 
            JOIN orders o ON q.order_id = o.id 
            JOIN users u ON o.buyer_id = u.id 
            WHERE q.seller_id = ?
        `;

        const params = [req.user.id];

        if (status) {
            query += ` AND q.status = ?`;
            params.push(status);
        }

        // Hardcoded LIMIT and OFFSET in SQL
        query += ` ORDER BY q.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [quotations] = await dbPool.execute(query, params);

        sendResponse(res, 200, true, 'Quotations retrieved successfully', quotations);
    } catch (error) {
        console.error('Get quotations error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve quotations');
    }
});


// Get quotation details
app.get('/api/seller/quotations/:quotationId/details', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { quotationId } = req.params;

        // Get quotation details
        const [quotations] = await dbPool.execute(
            `SELECT q.*, o.order_name, o.delivery_address, u.name as buyer_name
             FROM quotations q 
             JOIN orders o ON q.order_id = o.id 
             JOIN users u ON o.buyer_id = u.id 
             WHERE q.id = ? AND q.seller_id = ?`,
            [quotationId, req.user.id]
        );

        if (quotations.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found');
        }

        // Get quotation items with prices
        const [items] = await dbPool.execute(
            `SELECT qi.*, oi.product_id, oi.quantity_id, oi.requested_quantity,
                    p.name as product_name, pq.quantity, pq.unit_type
             FROM quotation_items qi
             JOIN order_items oi ON qi.order_item_id = oi.id
             JOIN products p ON oi.product_id = p.id
             JOIN product_quantities pq ON oi.quantity_id = pq.id
             WHERE qi.quotation_id = ?`,
            [quotationId]
        );

        const quotationDetails = {
            ...quotations[0],
            items
        };

        sendResponse(res, 200, true, 'Quotation details retrieved successfully', quotationDetails);
    } catch (error) {
        console.error('Get quotation details error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve quotation details');
    }
});

// Edit quotation (only if still pending)
app.put('/api/seller/quotations/:quotationId/edit', authenticateToken, authorize(['seller']), [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.price_per_unit').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('items.*.available_quantity').isInt({ min: 0 }).withMessage('Valid available quantity required'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Valid discount amount required')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { quotationId } = req.params;
        const { items, discount = 0, notes } = req.body;

        // Check if quotation exists and belongs to seller
        const [quotations] = await connection.execute(
            'SELECT * FROM quotations WHERE id = ? AND seller_id = ? AND status = ?',
            [quotationId, req.user.id, 'pending']
        );

        if (quotations.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found or cannot be edited');
        }

        // Calculate new total amount
        let totalAmount = 0;
        for (const item of items) {
            const [orderItems] = await connection.execute(
                'SELECT requested_quantity FROM order_items WHERE id = ?',
                [item.order_item_id]
            );

            if (orderItems.length === 0) {
                return sendResponse(res, 400, false, `Order item ${item.order_item_id} not found`);
            }

            const requestedQty = orderItems[0].requested_quantity;
            const availableQty = Math.min(requestedQty, item.available_quantity);
            totalAmount += item.price_per_unit * availableQty;
        }

        totalAmount -= discount;

        // Update quotation
        await connection.execute(
            'UPDATE quotations SET total_amount = ?, discount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [totalAmount, discount, notes, quotationId]
        );

        // Delete existing quotation items
        await connection.execute(
            'DELETE FROM quotation_items WHERE quotation_id = ?',
            [quotationId]
        );

        // Add updated quotation items
        for (const item of items) {
            const [orderItems] = await connection.execute(
                'SELECT requested_quantity FROM order_items WHERE id = ?',
                [item.order_item_id]
            );

            const requestedQty = orderItems[0].requested_quantity;
            const availableQty = Math.min(requestedQty, item.available_quantity);
            const totalPrice = item.price_per_unit * availableQty;

            await connection.execute(
                'INSERT INTO quotation_items (quotation_id, order_item_id, price_per_unit, available_quantity, is_available, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [quotationId, item.order_item_id, item.price_per_unit, item.available_quantity, item.available_quantity > 0, totalPrice]
            );
        }

        await connection.commit();
        sendResponse(res, 200, true, 'Quotation updated successfully', { totalAmount });

    } catch (error) {
        await connection.rollback();
        console.error('Edit quotation error:', error);
        sendResponse(res, 500, false, 'Failed to update quotation');
    } finally {
        connection.release();
    }
});

// Cancel quotation
app.delete('/api/seller/quotations/:quotationId/cancel', authenticateToken, authorize(['seller']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { quotationId } = req.params;

        // Check if quotation exists and belongs to seller
        const [quotations] = await connection.execute(
            'SELECT q.*, o.buyer_id FROM quotations q JOIN orders o ON q.order_id = o.id WHERE q.id = ? AND q.seller_id = ? AND q.status = ?',
            [quotationId, req.user.id, 'pending']
        );

        if (quotations.length === 0) {
            return sendResponse(res, 404, false, 'Quotation not found or cannot be cancelled');
        }

        const quotation = quotations[0];

        // Update quotation status
        await connection.execute(
            'UPDATE quotations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['cancelled', quotationId]
        );

        // Close the chat between this seller and buyer for this order
        await connection.execute(
            `UPDATE order_chat_participants 
             SET chat_status = 'closed', closed_at = CURRENT_TIMESTAMP
             WHERE order_id = ? AND seller_id = ? AND buyer_id = ? AND chat_status = 'active'`,
            [quotation.order_id, req.user.id, quotation.buyer_id]
        );

        await connection.commit();
        sendResponse(res, 200, true, 'Quotation cancelled successfully');

    } catch (error) {
        await connection.rollback();
        console.error('Cancel quotation error:', error);
        sendResponse(res, 500, false, 'Failed to cancel quotation');
    } finally {
        connection.release();
    }
});

// Get accepted orders (orders where seller's quotation was accepted)
// Get accepted orders (orders where seller's quotation was accepted)
app.get('/api/seller/orders/accepted', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        // Hardcoded pagination values
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [orders] = await dbPool.execute(
            `SELECT o.*, u.name as buyer_name, u.phone as buyer_phone,
                    q.total_amount as accepted_quotation_amount
             FROM orders o 
             JOIN users u ON o.buyer_id = u.id 
             JOIN quotations q ON o.id = q.order_id 
                 AND q.seller_id = ? 
                 AND q.status = 'accepted'
             WHERE o.accepted_seller_id = ? 
               AND o.status IN ('accepted', 'completed')
             ORDER BY o.updated_at DESC 
             LIMIT ${limit} OFFSET ${offset}`, // direct values, no placeholders
            [req.user.id, req.user.id]
        );

        sendResponse(res, 200, true, 'Accepted orders retrieved successfully', orders);
    } catch (error) {
        console.error('Get accepted orders error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve accepted orders');
    }
});


// Mark order as completed
app.put('/api/seller/orders/:orderId/complete', authenticateToken, authorize(['seller']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Check if order exists and belongs to seller
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND accepted_seller_id = ? AND status = ?',
            [orderId, req.user.id, 'accepted']
        );

        if (orders.length === 0) {
            return sendResponse(res, 404, false, 'Order not found or cannot be completed');
        }

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['completed', orderId]
        );

        // Close chat when order is completed
        await connection.execute(
            `UPDATE order_chat_participants 
             SET chat_status = 'closed', closed_at = CURRENT_TIMESTAMP
             WHERE order_id = ? AND chat_status = 'active'`,
            [orderId]
        );

        await connection.commit();
        sendResponse(res, 200, true, 'Order marked as completed');
    } catch (error) {
        await connection.rollback();
        console.error('Complete order error:', error);
        sendResponse(res, 500, false, 'Failed to complete order');
    } finally {
        connection.release();
    }
});

// Get seller's order history
app.get('/api/seller/orders/history', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { start_date, end_date, status } = req.query;

        // Hardcoded pagination
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, u.name as buyer_name, q.total_amount as quotation_amount
            FROM orders o 
            JOIN users u ON o.buyer_id = u.id 
            JOIN quotations q ON o.id = q.order_id AND q.seller_id = ?
            WHERE o.accepted_seller_id = ?
        `;

        const params = [req.user.id, req.user.id];

        if (start_date) {
            query += ` AND DATE(o.created_at) >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND DATE(o.created_at) <= ?`;
            params.push(end_date);
        }

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }

        // Directly embedding limit and offset (not placeholders)
        query += ` ORDER BY o.updated_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);

        sendResponse(res, 200, true, 'Order history retrieved successfully', orders);
    } catch (error) {
        console.error('Get order history error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order history');
    }
});

// Get quotation statistics for analytics
app.get('/api/seller/analytics/quotation-stats', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const [stats] = await dbPool.execute(
            `SELECT 
                COUNT(*) as total_quotations,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotations,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotations,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotations,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_quotations,
                ROUND((COUNT(CASE WHEN status = 'accepted' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 2) as acceptance_rate,
                COALESCE(SUM(CASE WHEN status = 'accepted' THEN total_amount END), 0) as total_accepted_value
             FROM quotations 
             WHERE seller_id = ?`,
            [req.user.id]
        );

        sendResponse(res, 200, true, 'Quotation statistics retrieved successfully', stats[0]);
    } catch (error) {
        console.error('Get quotation stats error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve quotation statistics');
    }
});
// GET /api/seller/analytics/dashboard - Sales overview
app.get('/api/seller/analytics/dashboard', authenticateToken, authorize(['seller']), async (req, res) => {
  try {
    // Get basic stats
    const [stats] = await dbPool.execute(`
      SELECT 
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as total_completed_orders,
        COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) as active_orders,
        SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE NULL END) as avg_order_value
      FROM orders o 
      WHERE o.accepted_seller_id = ?
    `, [req.user.id]);

    // Get recent orders
    const [recentOrders] = await dbPool.execute(`
      SELECT o.*, u.name as buyer_name
      FROM orders o 
      JOIN users u ON o.buyer_id = u.id 
      WHERE o.accepted_seller_id = ? 
      ORDER BY o.updated_at DESC 
      LIMIT 5
    `, [req.user.id]);

    // Get quotation stats
    const [quotationStats] = await dbPool.execute(`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotations
      FROM quotations 
      WHERE seller_id = ?
    `, [req.user.id]);

    const dashboard = {
      stats: stats[0],
      recentOrders,
      quotationStats: quotationStats[0]
    };

    sendResponse(res, 200, true, 'Dashboard data retrieved successfully', dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve dashboard data');
  }
});

app.get('/api/seller/analytics/enhanced-dashboard', authenticateToken, authorize(['seller']), async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period) || 30;

        // Enhanced stats with window functions (MySQL 8.0.42 feature)
        const [enhancedStats] = await dbPool.execute(`
            WITH daily_stats AS (
                SELECT 
                    DATE(o.updated_at) as order_date,
                    COUNT(o.id) as daily_orders,
                    COALESCE(SUM(o.total_amount), 0) as daily_revenue
                FROM orders o 
                WHERE o.accepted_seller_id = ? 
                AND o.status = 'completed'
                AND o.updated_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(o.updated_at)
            ),
            revenue_trend AS (
                SELECT 
                    order_date,
                    daily_revenue,
                    LAG(daily_revenue) OVER (ORDER BY order_date) as prev_day_revenue,
                    AVG(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
                FROM daily_stats
            )
            SELECT 
                COUNT(DISTINCT ds.order_date) as active_days,
                COALESCE(SUM(ds.daily_orders), 0) as total_orders,
                COALESCE(SUM(ds.daily_revenue), 0) as total_revenue,
                COALESCE(AVG(ds.daily_revenue), 0) as avg_daily_revenue,
                COALESCE(MAX(ds.daily_revenue), 0) as best_day_revenue,
                (
                    SELECT daily_revenue 
                    FROM revenue_trend 
                    WHERE order_date = (SELECT MAX(order_date) FROM daily_stats)
                ) as latest_day_revenue,
                (
                    SELECT moving_avg 
                    FROM revenue_trend 
                    WHERE order_date = (SELECT MAX(order_date) FROM daily_stats)
                ) as current_moving_avg
            FROM daily_stats ds
        `, [req.user.id, days]);

        // Get quotation performance
        const [quotationStats] = await dbPool.execute(`
            SELECT 
                COUNT(*) as total_quotations,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotations,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotations,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotations,
                ROUND(
                    (COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
                    2
                ) as acceptance_rate
            FROM quotations 
            WHERE seller_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `, [req.user.id, days]);

        // Get top products
        const [topProducts] = await dbPool.execute(`
            SELECT 
                p.name,
                p.id,
                COUNT(oi.id) as order_count,
                SUM(oi.requested_quantity) as total_quantity_sold,
                COALESCE(SUM(qi.total_price), 0) as product_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            JOIN quotation_items qi ON oi.id = qi.order_item_id
            JOIN quotations q ON qi.quotation_id = q.id
            WHERE o.accepted_seller_id = ? 
            AND o.status = 'completed'
            AND q.seller_id = ?
            AND o.updated_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY p.id, p.name
            ORDER BY product_revenue DESC
            LIMIT 10
        `, [req.user.id, req.user.id, days]);

        const dashboard = {
            periodDays: days,
            stats: enhancedStats[0] || {},
            quotationStats: quotationStats[0] || {},
            topProducts: topProducts || []
        };

        sendResponse(res, 200, true, 'Enhanced dashboard data retrieved successfully', dashboard);
    } catch (error) {
        console.error('Get enhanced dashboard error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve enhanced dashboard data', null, error.message);
    }
});

// GET /api/seller/analytics/sales - Revenue analytics
app.get('/api/seller/analytics/sales', authenticateToken, authorize(['seller']), async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let query, groupBy;

    if (period === 'daily') {
      query = `
        SELECT DATE(o.updated_at) as period,
               COUNT(*) as order_count,
               SUM(o.total_amount) as revenue
        FROM orders o 
        WHERE o.accepted_seller_id = ? 
        AND o.status = 'completed' 
        AND YEAR(o.updated_at) = ?
        GROUP BY DATE(o.updated_at)
        ORDER BY period DESC
      `;
    } else if (period === 'weekly') {
      query = `
        SELECT YEARWEEK(o.updated_at) as period,
               COUNT(*) as order_count,
               SUM(o.total_amount) as revenue
        FROM orders o 
        WHERE o.accepted_seller_id = ? 
        AND o.status = 'completed' 
        AND YEAR(o.updated_at) = ?
        GROUP BY YEARWEEK(o.updated_at)
        ORDER BY period DESC
      `;
    } else {
      query = `
        SELECT MONTH(o.updated_at) as period,
               COUNT(*) as order_count,
               SUM(o.total_amount) as revenue
        FROM orders o 
        WHERE o.accepted_seller_id = ? 
        AND o.status = 'completed' 
        AND YEAR(o.updated_at) = ?
        GROUP BY MONTH(o.updated_at)
        ORDER BY period DESC
      `;
    }

    const [salesData] = await dbPool.execute(query, [req.user.id, year]);

    sendResponse(res, 200, true, 'Sales analytics retrieved successfully', salesData);
  } catch (error) {
    console.error('Get sales analytics error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve sales analytics');
  }
});

// GET /api/seller/analytics/products - Product performance
app.get('/api/seller/analytics/products', authenticateToken, authorize(['seller']), async (req, res) => {
  try {
    const [productStats] = await dbPool.execute(`
      SELECT p.name, p.id,
             COUNT(oi.id) as order_count,
             SUM(oi.requested_quantity) as total_quantity_sold,
             AVG(qi.price_per_unit) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN quotation_items qi ON oi.id = qi.order_item_id
      JOIN quotations q ON qi.quotation_id = q.id
      WHERE o.accepted_seller_id = ? 
      AND o.status = 'completed'
      AND q.seller_id = ?
      GROUP BY p.id, p.name
      ORDER BY order_count DESC
      LIMIT 20
    `, [req.user.id, req.user.id]);

    sendResponse(res, 200, true, 'Product analytics retrieved successfully', productStats);
  } catch (error) {
    console.error('Get product analytics error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve product analytics');
  }
});

// GET /api/seller/analytics/custom-range - Custom date analytics
app.get('/api/seller/analytics/custom-range', authenticateToken, authorize(['seller']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return sendResponse(res, 400, false, 'Start date and end date are required');
    }

    const [analytics] = await dbPool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        COUNT(DISTINCT o.buyer_id) as unique_customers
      FROM orders o 
      WHERE o.accepted_seller_id = ? 
      AND o.status = 'completed'
      AND DATE(o.updated_at) BETWEEN ? AND ?
    `, [req.user.id, start_date, end_date]);

    // Daily breakdown
    const [dailyBreakdown] = await dbPool.execute(`
      SELECT DATE(o.updated_at) as date,
             COUNT(*) as orders,
             SUM(o.total_amount) as revenue
      FROM orders o 
      WHERE o.accepted_seller_id = ? 
      AND o.status = 'completed'
      AND DATE(o.updated_at) BETWEEN ? AND ?
      GROUP BY DATE(o.updated_at)
      ORDER BY date
    `, [req.user.id, start_date, end_date]);

    const result = {
      summary: analytics[0],
      dailyBreakdown
    };

    sendResponse(res, 200, true, 'Custom range analytics retrieved successfully', result);
  } catch (error) {
    console.error('Get custom range analytics error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve custom range analytics');
  }
});

// ========================================
// SECTION 8: ADMIN ROUTES
// ========================================

// POST /api/admin/create-admin - Create new admin
app.post('/api/admin/create-admin', authenticateToken, authorize(['admin']), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, email, phone, password } = req.body;

    // Check if user already exists
      const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND role = ?',
          [email, 'admin']
      );


      if (existingUsers.length > 0) {
      return sendResponse(res, 409, false, 'User already exists with this email');
    }

    // Create admin user
      const newHash = await hashPassword(password);
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, phone, password, role, is_verified, email_verified_at) VALUES (?, ?, ?, ?, ?, TRUE, NOW())',
      [name, email, phone, newHash, 'admin']
    );

    await connection.commit();
    sendResponse(res, 201, true, 'Admin created successfully', { adminId: result.insertId });

  } catch (error) {
    await connection.rollback();
    console.error('Create admin error:', error);
    sendResponse(res, 500, false, 'Failed to create admin');
  } finally {
    connection.release();
  }
});

// GET /api/admin/users/buyers - List all buyers (FIXED)
app.get('/api/admin/users/buyers', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', is_active, is_suspended } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.created_at,
                u.updated_at,
                u.phone,
                u.address,
                u.is_active,
                u.is_suspended,
                COUNT(o.id) AS total_orders,
                COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.buyer_id
            WHERE u.role = 'buyer'
        `;

        const params = [];

        // Search filter
        if (search && search.trim() !== '') {
            query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Active filter
        if (is_active !== undefined) {
            query += ` AND u.is_active = ?`;
            params.push(is_active);
        }

        // Suspended filter
        if (is_suspended !== undefined) {
            query += ` AND u.is_suspended = ?`;
            params.push(is_suspended);
        }

        query += `
            GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.updated_at, u.phone, u.address
            ORDER BY u.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        console.log('Executing query:', query);
        console.log('With parameters:', params);

        const [buyers] = await dbPool.execute(query, params);

        // Count Query
        let countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE u.role = 'buyer'
        `;
        const countParams = [];

        if (search && search.trim() !== '') {
            countQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (is_active !== undefined) {
            countQuery += ` AND u.is_active = ?`;
            countParams.push(is_active);
        }

        if (is_suspended !== undefined) {
            countQuery += ` AND u.is_suspended = ?`;
            countParams.push(is_suspended);
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;

        const response = {
            buyers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };

        sendResponse(res, 200, true, 'Buyers retrieved successfully', response);
    } catch (error) {
        console.error('Get buyers error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve buyers');
    }
});

// GET /api/admin/users/sellers - List all sellers (FIXED)
app.get('/api/admin/users/sellers', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.created_at,
                u.updated_at,
                u.phone,
                u.address,
                u.is_active,
                u.is_suspended,
                COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS total_orders_completed,
                COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_revenue,
                COUNT(DISTINCT q.id) AS total_quotations
            FROM users u 
            LEFT JOIN orders o ON u.id = o.accepted_seller_id
            LEFT JOIN quotations q ON u.id = q.seller_id
            WHERE u.role = 'seller'
        `;

        const params = [];

        if (search.trim() !== '') {
            query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // ✅ Filter by status (active/suspended)
        if (status === 'active') {
            query += ` AND u.is_active = 1 AND u.is_suspended = 0`;
        } else if (status === 'suspended') {
            query += ` AND u.is_suspended = 1`;
        }

        query += `
            GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.updated_at, u.phone, u.address
            ORDER BY u.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        const [sellers] = await dbPool.execute(query, params);

        // Count query
        let countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE u.role = 'seller'
        `;
        const countParams = [];

        if (search.trim() !== '') {
            countQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }

        // ✅ Apply same status filter to count query
        if (status === 'active') {
            countQuery += ` AND u.is_active = 1 AND u.is_suspended = 0`;
        } else if (status === 'suspended') {
            countQuery += ` AND u.is_suspended = 1`;
        }

        const [countResult] = await dbPool.execute(countQuery, countParams);
        const total = countResult[0].total;

        const response = {
            sellers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };

        sendResponse(res, 200, true, 'Sellers retrieved successfully', response);
    } catch (error) {
        console.error('Get sellers error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve sellers');
    }
});


// GET /api/admin/users/admins - List all admins
app.get('/api/admin/users/admins', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const [admins] = await dbPool.execute(
      'SELECT id, name, email, phone, is_active, is_suspended, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
      ['admin']
    );

    sendResponse(res, 200, true, 'Admins retrieved successfully', admins);
  } catch (error) {
    console.error('Get admins error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve admins');
  }
});

// PUT /api/admin/users/:userId/suspend - Suspend user
app.put('/api/admin/users/:userId/suspend', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Check if user exists and is not an admin
        const [users] = await dbPool.execute(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found');
        }

        const user = users[0];

        if (user.role === 'admin') {
            return sendResponse(res, 400, false, 'Cannot suspend admin users');
        }

        // 2. Suspend user
        await dbPool.execute(
            'UPDATE users SET is_suspended = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
            [1, 0, userId]
        );

        // 3. Invalidate sessions
        await dbPool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);

        // 4. Send Suspension Email
        const subject = '⛔ Account Suspended Notification';

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 30px;">
                    <h2 style="color: #d9534f;">Account Suspension Notice</h2>
                    <p>Dear <strong>${user.name}</strong>,</p>
                    <p>We regret to inform you that your account registered as a <strong style="color: #5bc0de;">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong> has been <strong style="color: #d9534f;">suspended</strong> by the admin.</p>
                    <p>This action was taken due to violation of our platform's policies or guidelines.</p>
                    <p>If you believe this is a mistake or you wish to appeal the suspension, please contact our support team.</p>
                    <hr />
                    <p style="font-size: 14px; color: #888;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        `;

        await sendEmail(user.email, subject, htmlContent);

        return sendResponse(res, 200, true, 'User suspended and notified via email');

    } catch (error) {
        console.error('Suspend user error:', error);
        sendResponse(res, 500, false, 'Failed to suspend user');
    }
});


// PUT /api/admin/users/:userId/activate - Activate user
app.put('/api/admin/users/:userId/activate', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Check if user exists and is not an admin
        const [users] = await dbPool.execute(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found');
        }

        const user = users[0];

        if (user.role === 'admin') {
            return sendResponse(res, 400, false, 'Cannot activate admin users');
        }

        // 2. Activate user
        await dbPool.execute(
            'UPDATE users SET is_suspended = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
            [0, 1, userId]
        );

        // 3. Send Activation Email
        const subject = '✅ Account Activated Notification';

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 30px;">
                    <h2 style="color: #5cb85c;">Account Reactivation Notice</h2>
                    <p>Dear <strong>${user.name}</strong>,</p>
                    <p>We’re pleased to inform you that your account as a <strong style="color: #5bc0de;">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong> has been <strong style="color: #5cb85c;">successfully reactivated</strong> by the admin.</p>
                    <p>You may now log in and resume your activities on the platform.</p>
                    <hr />
                    <p style="font-size: 14px; color: #888;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        `;

        await sendEmail(user.email, subject, htmlContent);

        return sendResponse(res, 200, true, 'User activated and notified via email');

    } catch (error) {
        console.error('Activate user error:', error);
        sendResponse(res, 500, false, 'Failed to activate user');
    }
});

app.delete('/api/admin/users/:userId/remove', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Check user exists
        const [users] = await dbPool.execute(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found');
        }

        const user = users[0];

        // 2. Prevent deleting admins
        if (user.role === 'admin') {
            return sendResponse(res, 400, false, 'Cannot delete admin users');
        }

        // 3. Delete user sessions
        await dbPool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);

        // 4. Delete user
        await dbPool.execute('DELETE FROM users WHERE id = ?', [userId]);

        // 5. Send Deletion Email
        const subject = 'Account Deleted by Admin';
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 600px; margin: auto;">
          <h2 style="color: #e74c3c;">Your Account Has Been Deleted</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We would like to inform you that your account registered as <strong>${user.role}</strong> has been permanently <b>deleted</b> by the admin.</p>
          <p>If you believe this was done in error, please contact our support team immediately.</p>
          <hr />
          <p style="color: #888;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

        await sendEmail(user.email, subject, htmlContent);

        return sendResponse(res, 200, true, 'User deleted and notified via email');

    } catch (err) {
        console.error('❌ Error deleting user:', err);
        return sendResponse(res, 500, false, 'Server error while deleting user');
    }
});
app.post('/api/admin/send-custom-email', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { targetType, userId, subject, bodyText, imageUrl } = req.body;

        if (!targetType || !subject || !bodyText) {
            return sendResponse(res, 400, false, 'Missing required fields');
        }

        let recipients = [];

        // 1. Determine recipients
        if (targetType === 'single') {
            if (!userId) return sendResponse(res, 400, false, 'userId is required for single target');
            const [userRows] = await dbPool.execute(
                'SELECT email, name FROM users WHERE id = ? AND is_active = 1',
                [userId]
            );
            if (userRows.length === 0) return sendResponse(res, 404, false, 'User not found or inactive');
            recipients.push(userRows[0]);
        } else if (targetType === 'active_buyers') {
            const [buyers] = await dbPool.execute(
                'SELECT email, name FROM users WHERE role = "buyer" AND is_active = 1'
            );
            recipients = buyers;
        } else if (targetType === 'active_sellers') {
            const [sellers] = await dbPool.execute(
                'SELECT email, name FROM users WHERE role = "seller" AND is_active = 1'
            );
            recipients = sellers;
        } else {
            return sendResponse(res, 400, false, 'Invalid targetType');
        }

        // 2. Construct Email HTML
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 25px; border-radius: 10px;">
          <h2>${subject}</h2>
          <p>${bodyText}</p>
          ${imageUrl ? `<img src="${imageUrl}" alt="Promo" style="max-width:100%; margin-top: 15px;" />` : ''}
        </div>
      </div>
    `;

        // 3. Send Email to Each Recipient
        for (const user of recipients) {
            await sendEmail(user.email, subject, htmlContent);
        }

        return sendResponse(res, 200, true, `Emails sent to ${recipients.length} user(s)`);

    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return sendResponse(res, 500, false, 'Email sending failed');
    }
});


// Product & Category Management

// POST /api/admin/products/add - Add product
app.post('/api/admin/products/add', authenticateToken, authorize(['admin']), [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Product name required'),
  body('category_id').isInt().withMessage('Valid category ID required'),
  body('quantities').isArray({ min: 1 }).withMessage('At least one quantity variant required'),
  body('quantities.*.quantity').notEmpty().withMessage('Quantity value required'),
  body('quantities.*.unit_type').isIn(['weight', 'volume', 'piece']).withMessage('Valid unit type required')
], handleValidationErrors, async (req, res) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, category_id, image, quantities } = req.body;

    // Create product
    const [productResult] = await connection.execute(
      'INSERT INTO products (name, description, category_id, image) VALUES (?, ?, ?, ?)',
      [name, description, category_id, image]
    );

    const productId = productResult.insertId;

    // Add quantity variants
    for (const quantity of quantities) {
      await connection.execute(
        'INSERT INTO product_quantities (product_id, quantity, unit_type) VALUES (?, ?, ?)',
        [productId, quantity.quantity, quantity.unit_type]
      );
    }

    await connection.commit();
    sendResponse(res, 201, true, 'Product added successfully', { productId });

  } catch (error) {
    await connection.rollback();
    console.error('Add product error:', error);
    sendResponse(res, 500, false, 'Failed to add product');
  } finally {
    connection.release();
  }
});

// PUT /api/admin/products/:productId/edit - Edit product
app.put('/api/admin/products/:productId/edit',
    authenticateToken,
    authorize(['admin']),
    [
        // Product field validations
        body('name').optional().trim().isLength({ min: 1, max: 255 }),
        body('category_id').optional().isInt(),
        body('image').optional().isString(),
        body('is_active').optional().isBoolean(),
        body('description').optional().isString(),

        // Update quantity
        body('update_quantity.id').optional().isInt(),
        body('update_quantity.quantity').optional().notEmpty(),
        body('update_quantity.unit_type').optional().isIn(['weight', 'volume', 'piece']),

        // Add multiple quantities
        body('add_quantities').optional().isArray(),
        body('add_quantities.*.quantity').optional().notEmpty(),
        body('add_quantities.*.unit_type').optional().isIn(['weight', 'volume', 'piece']),

        // Delete quantities
        body('delete_quantity_ids').optional().isArray(),
        body('delete_quantity_ids.*').optional().isInt()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { productId } = req.params;
            const {
                name,
                description,
                category_id,
                image,
                is_active = true,
                update_quantity,
                add_quantities,
                delete_quantity_ids
            } = req.body;

            // 1. Update product table
            if (name || description || category_id || image) {
                const [result] = await dbPool.execute(
                    `UPDATE products SET 
                        name = COALESCE(?, name), 
                        description = COALESCE(?, description), 
                        category_id = COALESCE(?, category_id), 
                        image = COALESCE(?, image), 
                        is_active = ?, 
                        updated_at = NOW()
                    WHERE id = ?`,
                    [name, description, category_id, image, is_active, productId]
                );

                if (result.affectedRows === 0) {
                    return sendResponse(res, 404, false, 'Product not found');
                }
            }

            // 2. Delete specified quantities
            if (delete_quantity_ids && Array.isArray(delete_quantity_ids) && delete_quantity_ids.length > 0) {
                const placeholders = delete_quantity_ids.map(() => '?').join(',');
                await dbPool.execute(
                    `DELETE FROM product_quantities WHERE id IN (${placeholders}) AND product_id = ?`,
                    [...delete_quantity_ids, productId]
                );
            }

            // 3. Update existing quantity
            if (update_quantity && update_quantity.id && update_quantity.quantity && update_quantity.unit_type) {
                const [updateResult] = await dbPool.execute(
                    `UPDATE product_quantities 
                     SET quantity = ?, unit_type = ?, updated_at = NOW() 
                     WHERE id = ? AND product_id = ?`,
                    [update_quantity.quantity, update_quantity.unit_type, update_quantity.id, productId]
                );
            }

            // 4. Add new quantities
            if (add_quantities && Array.isArray(add_quantities)) {
                for (const { quantity, unit_type } of add_quantities) {
                    if (quantity && unit_type) {
                        await dbPool.execute(
                            'INSERT INTO product_quantities (product_id, quantity, unit_type, created_at) VALUES (?, ?, ?, NOW())',
                            [productId, quantity, unit_type]
                        );
                    }
                }
            }

            return sendResponse(res, 200, true, 'Update successful');
        } catch (error) {
            console.error('Error updating product:', error);
            return sendResponse(res, 500, false, 'Internal server error');
        }
    }
);


// DELETE /api/admin/products/:productId/remove - Remove product
app.delete('/api/admin/products/:productId/remove',authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { productId } = req.params;

    const [result] = await dbPool.execute(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Product not found');
    }

    sendResponse(res, 200, true, 'Product removed successfully');
  } catch (error) {
    console.error('Remove product error:', error);
    sendResponse(res, 500, false, 'Failed to remove product');
  }
});
app.get('/api/admin/products/stats', async (req, res) => {
    try {
        // 1. Product Status Count
        const [statusResult] = await db.query(`
      SELECT is_active, COUNT(*) AS count 
      FROM products 
      GROUP BY is_active
    `);

        const statusCount = {
            active: 0,
            inactive: 0,
        };

        statusResult.forEach((row) => {
            if (row.is_active === 1) {
                statusCount.active = row.count;
            } else {
                statusCount.inactive = row.count;
            }
        });

        // 2. Products by Category
        const [categoryResult] = await db.query(`
      SELECT 
        c.name AS category_name, 
        c.icon, 
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p 
        ON p.category_id = c.id 
        AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY product_count DESC
    `);

        // 3. Products added in last 7 days
        const [recentResult] = await db.query(`
      SELECT COUNT(*) AS count 
      FROM products 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

        const stats = {
            productStatus: statusCount,
            productsByCategory: categoryResult,
            newProductsLast7Days: recentResult[0]?.count || 0,
        };

        // Final response
        return sendResponse(res, 200, true, 'Product stats fetched', stats);
    } catch (err) {
        console.error('Stats error:', err);
        return sendResponse(res, 500, false, 'Something went wrong', null, err.message);
    }
});




// GET /api/admin/products
app.get('/api/admin/products', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category_id,
            is_active,
            search,
            sort_by = 'created_at',
            sort_order = 'DESC',
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const filters = [];
        const values = [];

        if (category_id) {
            filters.push('p.category_id = ?');
            values.push(category_id);
        }

        if (is_active === '1' || is_active === '0') {
            filters.push('p.is_active = ?');
            values.push(is_active);
        }

        if (search) {
            filters.push('p.name LIKE ?');
            values.push(`%${search}%`);
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        // Get total count
        const [countRows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM products p
      ${whereClause}
    `, values);
        const total = countRows[0].total;

        // Get paginated products
        const [products] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.image,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

        // Get quantity info for each product
        for (const product of products) {
            const [quantities] = await db.query(`
        SELECT id, product_id, quantity, unit_type, created_at
        FROM product_quantities
        WHERE product_id = ?
      `, [product.id]);

            product.quantities = quantities;
        }

        // Send response
        return res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});



app.get('/api/admin/products/categories', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const [categories] = await dbPool.execute(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.is_active,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.icon, c.is_active
      ORDER BY c.name ASC
    `);

        sendResponse(res, 200, true, 'Categories retrieved successfully', { categories });

    } catch (error) {
        console.error('Get categories error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve categories');
    }
});


app.get('/api/admin/products/:productId', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { productId } = req.params;

        // Get product details
        const [productRows] = await dbPool.execute(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.image,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

        if (productRows.length === 0) {
            return sendResponse(res, 404, false, 'Product not found');
        }

        const product = productRows[0];

        // Get product quantities
        const [quantities] = await dbPool.execute(`
      SELECT id, product_id, quantity, unit_type, created_at
      FROM product_quantities 
      WHERE product_id = ?
      ORDER BY created_at ASC
    `, [productId]);

        product.quantities = quantities;

        sendResponse(res, 200, true, 'Product retrieved successfully', { product });

    } catch (error) {
        console.error('Get product error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve product');
    }
});


app.patch('/api/admin/products/:productId/status', authenticateToken, authorize(['admin']), [
    body('is_active').isBoolean().withMessage('is_active must be a boolean value')
], handleValidationErrors, async (req, res) => {
    try {
        const { productId } = req.params;
        const { is_active } = req.body;

        const [result] = await dbPool.execute(
            'UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [is_active, productId]
        );

        if (result.affectedRows === 0) {
            return sendResponse(res, 404, false, 'Product not found');
        }

        const action = is_active ? 'activated' : 'suspended';
        sendResponse(res, 200, true, `Product ${action} successfully`);

    } catch (error) {
        console.error('Update product status error:', error);
        sendResponse(res, 500, false, 'Failed to update product status');
    }
});

app.patch('/api/admin/products/bulk-status', authenticateToken, authorize(['admin']), [
    body('product_ids').isArray({ min: 1 }).withMessage('At least one product ID required'),
    body('product_ids.*').isInt().withMessage('Each product ID must be valid'),
    body('is_active').isBoolean().withMessage('is_active must be a boolean value')
], handleValidationErrors, async (req, res) => {
    try {
        const { product_ids, is_active } = req.body;

        const placeholders = product_ids.map(() => '?').join(',');
        const [result] = await dbPool.execute(
            `UPDATE products SET is_active = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
            [is_active, ...product_ids]
        );

        const action = is_active ? 'activated' : 'suspended';
        sendResponse(res, 200, true, `${result.affectedRows} products ${action} successfully`, {
            updated_count: result.affectedRows
        });

    } catch (error) {
        console.error('Bulk update product status error:', error);
        sendResponse(res, 500, false, 'Failed to update products status');
    }
});


// GET /api/admin/products/stats


// POST /api/admin/categories/add - Add category
app.post('/api/admin/categories/add', authenticateToken, authorize(['admin']), [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Category name required')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const [result] = await dbPool.execute(
      'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description, icon]
    );

    sendResponse(res, 201, true, 'Category added successfully', { categoryId: result.insertId });
  } catch (error) {
    console.error('Add category error:', error);
    sendResponse(res, 500, false, 'Failed to add category');
  }
});



// PUT /api/admin/categories/:categoryId/edit - Edit category
app.put('/api/admin/categories/:categoryId/edit', authenticateToken, authorize(['admin']), [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Category name required')
], handleValidationErrors, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, icon, is_active = true } = req.body;

    const [result] = await dbPool.execute(
      'UPDATE categories SET name = ?, description = ?, icon = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, description, icon, is_active, categoryId]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Category not found');
    }

    sendResponse(res, 200, true, 'Category updated successfully');
  } catch (error) {
    console.error('Edit category error:', error);
    sendResponse(res, 500, false, 'Failed to update category');
  }
});

// DELETE /api/admin/categories/:categoryId/remove - Remove category
app.delete('/api/admin/categories/:categoryId/remove', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if category has products
    const [products] = await dbPool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [categoryId]
    );

    if (products[0].count > 0) {
      return sendResponse(res, 400, false, 'Cannot remove category with existing products');
    }

    const [result] = await dbPool.execute(
      'DELETE FROM categories WHERE id = ?',
      [categoryId]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Category not found');
    }

    sendResponse(res, 200, true, 'Category removed successfully');
  } catch (error) {
    console.error('Remove category error:', error);
    sendResponse(res, 500, false, 'Failed to remove category');
  }
});






app.get('/api/admin/categories/display',authenticateToken, authorize(['admin']), async (req, res) => {
    let connection = null;

    try {
        console.log('🔍 Categories Display API - Request received');
        console.log('📝 Query parameters:', req.query);

        // Hardcode pagination values
        const pageNum = 1;
        const limitNum = 20;
        const offset = 0;

        console.log('📊 Hardcoded pagination:', {
            page: pageNum,
            limit: limitNum,
            offset: offset
        });

        const {
            is_active,
            search,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        console.log('🔧 Filter parameters:', {
            is_active,
            search,
            sort_by,
            sort_order
        });

        // Get connection from pool for transaction safety
        connection = await dbPool.getConnection();
        console.log('✅ Database connection acquired');

        // Build WHERE clause and parameters
        let whereConditions = [];
        let baseParams = [];

        if (is_active !== undefined && is_active !== null && is_active !== '') {
            console.log('➕ Adding is_active filter:', is_active);
            whereConditions.push('c.is_active = ?');
            baseParams.push(is_active === 'true' ? 1 : 0);
        }

        if (search && search.trim() && search.trim().length > 0) {
            console.log('🔍 Adding search filter:', search.trim());
            whereConditions.push('(c.name LIKE ? OR c.description LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            baseParams.push(searchTerm, searchTerm);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        console.log('📋 WHERE clause:', whereClause);
        console.log('📋 Base parameters:', baseParams);

        // Validate sort parameters
        const validSortColumns = ['name', 'created_at', 'updated_at', 'product_count'];
        const validSortOrders = ['ASC', 'DESC'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

        console.log('📊 Sort parameters:', {
            requested_sort_by: sort_by,
            requested_sort_order: sort_order,
            final_sort_column: sortColumn,
            final_sort_direction: sortDirection
        });

        // Step 1: Get total count with proper error handling
        console.log('🔢 Getting total count...');
        const countQuery = `SELECT COUNT(*) as total FROM categories c ${whereClause}`;
        console.log('📝 Count Query:', countQuery);
        console.log('📝 Count Params:', baseParams);

        let totalCategories = 0;
        try {
            const [countResult] = await connection.execute(countQuery, baseParams);
            totalCategories = countResult[0]?.total || 0;
            console.log('✅ Total categories count:', totalCategories);
        } catch (countError) {
            console.error('❌ Error in count query:', {
                message: countError.message,
                code: countError.code,
                errno: countError.errno,
                sql: countQuery,
                params: baseParams
            });
            throw new Error(`Count query failed: ${countError.message}`);
        }

        if (totalCategories === 0) {
            console.log('ℹ️ No categories found, returning empty result');
            const emptyResponse = {
                categories: [],
                pagination: {
                    current_page: pageNum,
                    total_pages: 0,
                    total_categories: 0,
                    per_page: limitNum,
                    has_next_page: false,
                    has_prev_page: false
                },
                filters: {
                    is_active: is_active !== undefined ? (is_active === 'true') : null,
                    search: search || null
                }
            };

            return sendResponse(res, 200, true, 'No categories found', emptyResponse);
        }

        // Step 2: Get categories with proper GROUP BY for MySQL 8.0.42
        console.log('📋 Getting categories with pagination...');

        // Build ORDER BY clause
        let orderByClause;
        if (sortColumn === 'product_count') {
            orderByClause = `ORDER BY product_count ${sortDirection}`;
        } else {
            orderByClause = `ORDER BY c.${sortColumn} ${sortDirection}`;
        }

        // MySQL 8.0.42 compatible query with explicit GROUP BY
        const categoriesQuery = `
            SELECT 
                c.id,
                c.name,
                c.description,
                c.icon,
                c.is_active,
                c.created_at,
                c.updated_at,
                COUNT(p.id) as product_count,
                COUNT(CASE WHEN p.is_active = 1 THEN 1 END) as active_product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            ${whereClause}
            GROUP BY c.id, c.name, c.description, c.icon, c.is_active, c.created_at, c.updated_at
            ${orderByClause}
            LIMIT ${limitNum} OFFSET ${offset}
        `;

        console.log('📝 Categories Query:', categoriesQuery);
        console.log('📝 Categories Params:', baseParams);

        let categories = [];
        try {
            // Use only baseParams (no LIMIT/OFFSET params since they're hardcoded)
            const [categoriesResult] = await connection.execute(categoriesQuery, baseParams);
            categories = categoriesResult || [];
            console.log('✅ Categories retrieved:', categories.length);

            // Log sample category for debugging
            if (categories.length > 0) {
                console.log('📄 Sample category:', {
                    id: categories[0].id,
                    name: categories[0].name,
                    product_count: categories[0].product_count,
                    is_active: categories[0].is_active
                });
            }
        } catch (categoriesError) {
            console.error('❌ Error in categories query:', {
                message: categoriesError.message,
                code: categoriesError.code,
                errno: categoriesError.errno,
                sql: categoriesQuery,
                params: baseParams
            });
            throw new Error(`Categories query failed: ${categoriesError.message}`);
        }

        // Step 3: Calculate pagination metadata
        console.log('📊 Calculating pagination metadata...');
        const totalPages = Math.ceil(totalCategories / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const paginationMeta = {
            current_page: pageNum,
            total_pages: totalPages,
            total_categories: totalCategories,
            per_page: limitNum,
            has_next_page: hasNextPage,
            has_prev_page: hasPrevPage
        };

        console.log('📊 Pagination metadata:', paginationMeta);

        // Step 4: Format response data
        const responseData = {
            categories: categories.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description || null,
                icon: category.icon || null,
                is_active: Boolean(category.is_active),
                created_at: category.created_at,
                updated_at: category.updated_at,
                product_count: parseInt(category.product_count) || 0,
                active_product_count: parseInt(category.active_product_count) || 0
            })),
            pagination: paginationMeta,
            filters: {
                is_active: is_active !== undefined ? (is_active === 'true') : null,
                search: search || null
            },
            debug_info: {
                query_executed: true,
                where_clause: whereClause,
                parameters_used: baseParams.length,
                sort_column: sortColumn,
                sort_direction: sortDirection
            }
        };

        console.log('✅ Response data prepared:', {
            categories_count: responseData.categories.length,
            total_categories: responseData.pagination.total_categories,
            current_page: responseData.pagination.current_page
        });

        // Release connection
        if (connection) {
            connection.release();
            console.log('🔗 Database connection released');
        }

        return sendResponse(res, 200, true, 'Categories retrieved successfully', responseData);

    } catch (error) {
        console.error('❌ Categories Display API - Critical Error:', {
            name: error.name,
            message: error.message,
            code: error.code || 'NO_CODE',
            errno: error.errno || 'NO_ERRNO',
            stack: error.stack,
            sql: error.sql || 'NO_SQL',
            sqlMessage: error.sqlMessage || 'NO_SQL_MESSAGE',
            timestamp: new Date().toISOString()
        });

        // Detailed error logging for debugging
        if (error.code) {
            console.error('🔍 MySQL Error Details:', {
                error_code: error.code,
                error_number: error.errno,
                sql_state: error.sqlState,
                sql_message: error.sqlMessage
            });
        }

        // Release connection if it exists
        if (connection) {
            try {
                connection.release();
                console.log('🔗 Database connection released (error case)');
            } catch (releaseError) {
                console.error('❌ Error releasing connection:', releaseError.message);
            }
        }

        // Return appropriate error response
        const errorMessage = process.env.NODE_ENV === 'development'
            ? `Failed to retrieve categories: ${error.message}`
            : 'Failed to retrieve categories';

        return sendResponse(res, 500, false, errorMessage, null);
    }
});


app.get('/api/admin/categories/:categoryId', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Get category details with product count
        const [categoryRows] = await dbPool.execute(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count,
        COUNT(CASE WHEN p.is_active = 1 THEN 1 END) as active_product_count,
        COUNT(CASE WHEN p.is_active = 0 THEN 1 END) as suspended_product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.description, c.icon, c.is_active, c.created_at, c.updated_at
    `, [categoryId]);

        if (categoryRows.length === 0) {
            return sendResponse(res, 404, false, 'Category not found');
        }

        const category = categoryRows[0];

        // Get recent products in this category (last 5)
        const [recentProducts] = await dbPool.execute(`
      SELECT 
        id, name, is_active, created_at
      FROM products 
      WHERE category_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [categoryId]);

        category.recent_products = recentProducts;

        sendResponse(res, 200, true, 'Category retrieved successfully', { category });

    } catch (error) {
        console.error('Get category error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve category');
    }
});

app.patch('/api/admin/categories/:categoryId/status', authenticateToken, authorize(['admin']), [
    body('is_active').isBoolean().withMessage('is_active must be a boolean value')
], handleValidationErrors, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { is_active } = req.body;

        // If suspending category, check if it has active products
        if (!is_active) {
            const [activeProducts] = await dbPool.execute(
                'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1',
                [categoryId]
            );

            if (activeProducts[0].count > 0) {
                return sendResponse(res, 400, false,
                    `Cannot suspend category with ${activeProducts[0].count} active products. Please suspend products first.`
                );
            }
        }

        const [result] = await dbPool.execute(
            'UPDATE categories SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [is_active, categoryId]
        );

        if (result.affectedRows === 0) {
            return sendResponse(res, 404, false, 'Category not found');
        }

        const action = is_active ? 'activated' : 'suspended';
        sendResponse(res, 200, true, `Category ${action} successfully`);

    } catch (error) {
        console.error('Update category status error:', error);
        sendResponse(res, 500, false, 'Failed to update category status');
    }
});


app.patch('/api/admin/categories/bulk-status', authenticateToken, authorize(['admin']), [
    body('category_ids').isArray({ min: 1 }).withMessage('At least one category ID required'),
    body('category_ids.*').isInt().withMessage('Each category ID must be valid'),
    body('is_active').isBoolean().withMessage('is_active must be a boolean value')
], handleValidationErrors, async (req, res) => {
    try {
        const { category_ids, is_active } = req.body;

        // If suspending categories, check for active products
        if (!is_active) {
            const placeholders = category_ids.map(() => '?').join(',');
            const [activeProducts] = await dbPool.execute(
                `SELECT c.name, COUNT(p.id) as active_count 
         FROM categories c 
         LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
         WHERE c.id IN (${placeholders})
         GROUP BY c.id, c.name
         HAVING active_count > 0`,
                category_ids
            );

            if (activeProducts.length > 0) {
                const categoriesWithProducts = activeProducts.map(cat => `${cat.name} (${cat.active_count} products)`).join(', ');
                return sendResponse(res, 400, false,
                    `Cannot suspend categories with active products: ${categoriesWithProducts}`
                );
            }
        }

        const placeholders = category_ids.map(() => '?').join(',');
        const [result] = await dbPool.execute(
            `UPDATE categories SET is_active = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
            [is_active, ...category_ids]
        );

        const action = is_active ? 'activated' : 'suspended';
        sendResponse(res, 200, true, `${result.affectedRows} categories ${action} successfully`, {
            updated_count: result.affectedRows
        });

    } catch (error) {
        console.error('Bulk update category status error:', error);
        sendResponse(res, 500, false, 'Failed to update categories status');
    }
});

app.get('/api/admin/ca/stats', async (req, res) => {
    try {
        // Get category counts by status
        const [statusStats] = await dbPool.execute(`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM categories 
      GROUP BY is_active
    `);

        // Get top categories by product count
        const [topCategories] = await dbPool.execute(`
      SELECT 
        c.name,
        c.icon,
        c.is_active,
        COUNT(p.id) as product_count,
        COUNT(CASE WHEN p.is_active = 1 THEN 1 END) as active_product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.icon, c.is_active
      ORDER BY product_count DESC
      LIMIT 10
    `);

        // Get recent categories (last 7 days)
        const [recentCategories] = await dbPool.execute(`
      SELECT COUNT(*) as count
      FROM categories 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

        // Get empty categories (no products)
        const [emptyCategories] = await dbPool.execute(`
      SELECT COUNT(*) as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.is_active = 1 AND p.id IS NULL
    `);

        const stats = {
            total_categories: statusStats.reduce((sum, stat) => sum + stat.count, 0),
            active_categories: statusStats.find(s => s.is_active === 1)?.count || 0,
            suspended_categories: statusStats.find(s => s.is_active === 0)?.count || 0,
            recent_categories: recentCategories[0].count,
            empty_categories: emptyCategories[0].count,
            top_categories: topCategories
        };

        sendResponse(res, 200, true, 'Category statistics retrieved successfully', { stats });

    } catch (error) {
        console.error('Get category stats error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve category statistics');
    }
});

app.get('/api/admin/cate/search', async (req, res) => {
    try {
        const { q, active_only = 'false' } = req.query;

        if (!q || q.trim().length < 2) {
            return sendResponse(res, 400, false, 'Search query must be at least 2 characters');
        }

        let whereClause = 'WHERE (c.name LIKE ? OR c.description LIKE ?)';
        let params = [`%${q.trim()}%`, `%${q.trim()}%`];

        if (active_only === 'true') {
            whereClause += ' AND c.is_active = 1';
        }

        const [categories] = await dbPool.execute(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.is_active,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      ${whereClause}
      GROUP BY c.id, c.name, c.description, c.icon, c.is_active
      ORDER BY c.name ASC
      LIMIT 20
    `, params);

        sendResponse(res, 200, true, 'Categories found successfully', { categories });

    } catch (error) {
        console.error('Search categories error:', error);
        sendResponse(res, 500, false, 'Failed to search categories');
    }
});

// POST /api/admin/categories/:categoryId/duplicate - Duplicate category



app.post('/api/admin/users/bulk-action', authenticateToken, authorize(['admin']), [
    body('action').isIn(['suspend', 'activate', 'delete']).withMessage('Invalid action'),
    body('user_ids').isArray({ min: 1 }).withMessage('At least one user ID required'),
    body('user_ids.*').isInt().withMessage('Valid user IDs required')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { action, user_ids } = req.body;

        // Prevent action on admin users
        const [adminUsers] = await connection.execute(
            `SELECT id FROM users WHERE id IN (${user_ids.map(() => '?').join(',')}) AND role = 'admin'`,
            user_ids
        );

        if (adminUsers.length > 0) {
            await connection.rollback();
            return sendResponse(res, 400, false, 'Cannot perform bulk actions on admin users');
        }

        let query, params, successMessage;

        switch (action) {
            case 'suspend':
                query = `UPDATE users SET is_suspended = TRUE, updated_at = UTC_TIMESTAMP() WHERE id IN (${user_ids.map(() => '?').join(',')})`;
                params = user_ids;
                successMessage = 'Users suspended successfully';

                // Clear sessions for suspended users
                await connection.execute(
                    `DELETE FROM user_sessions WHERE user_id IN (${user_ids.map(() => '?').join(',')})`,
                    user_ids
                );
                break;

            case 'activate':
                query = `UPDATE users SET is_suspended = FALSE, is_active = TRUE, updated_at = UTC_TIMESTAMP() WHERE id IN (${user_ids.map(() => '?').join(',')})`;
                params = user_ids;
                successMessage = 'Users activated successfully';
                break;

            case 'delete':
                query = `DELETE FROM users WHERE id IN (${user_ids.map(() => '?').join(',')})`;
                params = user_ids;
                successMessage = 'Users deleted successfully';
                break;
        }

        const [result] = await connection.execute(query, params);

        await connection.commit();
        sendResponse(res, 200, true, successMessage, { affectedRows: result.affectedRows });

    } catch (error) {
        await connection.rollback();
        console.error('Bulk action error:', error);
        sendResponse(res, 500, false, 'Bulk action failed', null, error.message);
    } finally {
        connection.release();
    }
});
app.post('/api/admin/system/cleanup', authenticateToken, authorize(['admin']), async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const cleanupResults = {};

        // Clean expired sessions
        const [sessionCleanup] = await connection.execute(
            'DELETE FROM user_sessions WHERE expires_at < UTC_TIMESTAMP()'
        );
        cleanupResults.expired_sessions = sessionCleanup.affectedRows;

        // Clean expired OTPs
        const [otpCleanup] = await connection.execute(
            'DELETE FROM otp_verifications WHERE expires_at < UTC_TIMESTAMP()'
        );
        cleanupResults.expired_otps = otpCleanup.affectedRows;

        // Clean old used OTPs (older than 24 hours)
        const [oldOtpCleanup] = await connection.execute(
            'DELETE FROM otp_verifications WHERE is_used = TRUE AND created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)'
        );
        cleanupResults.old_used_otps = oldOtpCleanup.affectedRows;

        // Optimize tables for MySQL 8.0.42
        await connection.execute('OPTIMIZE TABLE users, orders, products, quotations');
        cleanupResults.tables_optimized = true;

        await connection.commit();
        sendResponse(res, 200, true, 'System cleanup completed successfully', cleanupResults);

    } catch (error) {
        await connection.rollback();
        console.error('System cleanup error:', error);
        sendResponse(res, 500, false, 'System cleanup failed', null, error);
    } finally {
        connection.release();
    }
});


// Analytics Routes

// GET /api/admin/analytics/revenue - Platform revenue
app.get('/api/admin/analytics/revenue', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let query;

    if (period === 'daily') {
      query = `
        SELECT DATE(o.updated_at) as period,
               COUNT(*) as order_count,
               SUM(o.total_amount) as revenue
        FROM orders o 
        WHERE o.status = 'completed' 
        AND YEAR(o.updated_at) = ?
        GROUP BY DATE(o.updated_at)
        ORDER BY period DESC
      `;
    } else if (period === 'weekly') {
      query = `
        SELECT YEARWEEK(o.updated_at) as period,
               COUNT(*) as order_count,
               SUM(o.total_amount) as revenue
        FROM orders o 
        WHERE o.status = 'completed' 
        AND YEAR(o.updated_at) = ?
        GROUP BY YEARWEEK(o.updated_at)
        ORDER BY period DESC
      `;
    } else {
      query = `
        SELECT MONTH(o.updated_at) as period,
               COUNT(*) as order_count,
               SUM(o.total_amount) as revenue
        FROM orders o 
        WHERE o.status = 'completed' 
        AND YEAR(o.updated_at) = ?
        GROUP BY MONTH(o.updated_at)
        ORDER BY period DESC
      `;
    }

    const [revenueData] = await dbPool.execute(query, [year]);

    sendResponse(res, 200, true, 'Revenue analytics retrieved successfully', revenueData);
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve revenue analytics');
  }
});

// GET /api/admin/analytics/active-users - User activity stats
app.get('/api/admin/analytics/active-users', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    // Get user counts
    const [userStats] = await dbPool.execute(`
      SELECT 
        COUNT(CASE WHEN role = 'buyer' THEN 1 END) as total_buyers,
        COUNT(CASE WHEN role = 'seller' THEN 1 END) as total_sellers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN is_active = TRUE AND is_suspended = FALSE THEN 1 END) as active_users,
        COUNT(CASE WHEN is_suspended = TRUE THEN 1 END) as suspended_users
      FROM users
    `);

    // Get recent registrations (last 30 days)
    const [recentRegistrations] = await dbPool.execute(`
      SELECT DATE(created_at) as date, 
             COUNT(*) as registrations,
             role
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at), role
      ORDER BY date DESC
    `);

    // Get active users (users who logged in recently)
    const [activeUsers] = await dbPool.execute(`
      SELECT COUNT(DISTINCT us.user_id) as active_users_count
      FROM user_sessions us
      WHERE us.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const result = {
      userStats: userStats[0],
      recentRegistrations,
      activeUsersCount: activeUsers[0].active_users_count
    };

    sendResponse(res, 200, true, 'User activity stats retrieved successfully', result);
  } catch (error) {
    console.error('Get user activity error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve user activity stats');
  }
});

// GET /api/admin/analytics/business-metrics - Business KPIs
app.get('/api/admin/analytics/business-metrics', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    // Overall platform stats
    const [platformStats] = await dbPool.execute(`
      SELECT 
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as total_completed_orders,
        COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN o.status = 'in_progress' THEN 1 END) as in_progress_orders,
        SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as total_platform_revenue,
        AVG(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE NULL END) as avg_order_value,
        COUNT(DISTINCT o.buyer_id) as unique_buyers,
        COUNT(DISTINCT o.accepted_seller_id) as active_sellers
      FROM orders o
    `);

    // Quotation metrics
    const [quotationMetrics] = await dbPool.execute(`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotations,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotations,
        (COUNT(CASE WHEN status = 'accepted' THEN 1 END) / COUNT(*) * 100) as acceptance_rate
      FROM quotations
    `);

    // Top performing categories
    const [topCategories] = await dbPool.execute(`
      SELECT c.name, c.id,
             COUNT(oi.id) as total_orders,
             SUM(o.total_amount) as category_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY category_revenue DESC
      LIMIT 10
    `);

    // Top performing sellers
    const [topSellers] = await dbPool.execute(`
      SELECT u.name, u.id,
             COUNT(o.id) as completed_orders,
             SUM(o.total_amount) as total_revenue,
             AVG(o.total_amount) as avg_order_value
      FROM users u
      JOIN orders o ON u.id = o.accepted_seller_id
      WHERE u.role = 'seller' AND o.status = 'completed'
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    const metrics = {
      platformStats: platformStats[0],
      quotationMetrics: quotationMetrics[0],
      topCategories,
      topSellers
    };

    sendResponse(res, 200, true, 'Business metrics retrieved successfully', metrics);
  } catch (error) {
    console.error('Get business metrics error:', error);
    sendResponse(res, 500, false, 'Failed to retrieve business metrics');
  }
});

app.get('/api/admin/analytics/order-distribution', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const [rows] = await dbPool.execute(`
      SELECT 
        delivery_latitude AS lat,
        delivery_longitude AS lng,
        COUNT(*) AS order_count
      FROM orders
      WHERE status = 'completed'
      GROUP BY delivery_latitude, delivery_longitude
    `);

        sendResponse(res, 200, true, 'Order distribution retrieved successfully', rows);
    } catch (error) {
        console.error('Get order distribution error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve order distribution');
    }
});
app.get('/api/admin/analytics/seller-locations', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const [rows] = await dbPool.execute(`
      SELECT 
        id, name, latitude AS lat, longitude AS lng
      FROM users
      WHERE role = 'seller' AND is_active = 1 AND is_suspended = 0 AND latitude IS NOT NULL AND longitude IS NOT NULL
    `);

        sendResponse(res, 200, true, 'Seller locations retrieved successfully', rows);
    } catch (error) {
        console.error('Get seller locations error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve seller locations');
    }
});

// ========================================
// Extra
// ========================================

app.get('/api/orders/advanced-filter', authenticateToken, async (req, res) => {
    try {
        const {
            status,
            start_date,
            end_date,
            min_amount,
            max_amount,
            search,
            page = 1,
            limit = 20,
            sort = 'created_at',
            order = 'desc'
        } = req.query;

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (parsedPage - 1) * parsedLimit;

        // Validate sort parameters
        const allowedSortFields = ['created_at', 'updated_at', 'total_amount', 'order_name'];
        const allowedOrders = ['asc', 'desc'];
        const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
        const sortOrder = allowedOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

        let query, countQuery, params, countParams;

        if (req.user.role === 'buyer') {
            query = `
                SELECT o.*, 
                       u.name as accepted_seller_name,
                       COUNT(DISTINCT q.id) as quotation_count
                FROM orders o 
                LEFT JOIN users u ON o.accepted_seller_id = u.id 
                LEFT JOIN quotations q ON o.id = q.order_id
                WHERE o.buyer_id = ?
            `;
            countQuery = `
                SELECT COUNT(DISTINCT o.id) as total
                FROM orders o 
                WHERE o.buyer_id = ?
            `;
            params = [req.user.id];
            countParams = [req.user.id];
        } else if (req.user.role === 'seller') {
            query = `
                SELECT o.*, 
                       u.name as buyer_name,
                       q.status as my_quotation_status,
                       q.total_amount as my_quotation_amount
                FROM orders o 
                JOIN users u ON o.buyer_id = u.id 
                LEFT JOIN quotations q ON o.id = q.order_id AND q.seller_id = ?
                WHERE o.accepted_seller_id = ? OR q.seller_id = ?
            `;
            countQuery = `
                SELECT COUNT(DISTINCT o.id) as total
                FROM orders o 
                LEFT JOIN quotations q ON o.id = q.order_id AND q.seller_id = ?
                WHERE o.accepted_seller_id = ? OR q.seller_id = ?
            `;
            params = [req.user.id, req.user.id, req.user.id];
            countParams = [req.user.id, req.user.id, req.user.id];
        } else {
            return sendResponse(res, 403, false, 'Unauthorized role');
        }

        // Add filters
        if (status) {
            query += ` AND o.status = ?`;
            countQuery += ` AND o.status = ?`;
            params.push(status);
            countParams.push(status);
        }

        if (start_date) {
            query += ` AND DATE(o.created_at) >= ?`;
            countQuery += ` AND DATE(o.created_at) >= ?`;
            params.push(start_date);
            countParams.push(start_date);
        }

        if (end_date) {
            query += ` AND DATE(o.created_at) <= ?`;
            countQuery += ` AND DATE(o.created_at) <= ?`;
            params.push(end_date);
            countParams.push(end_date);
        }

        if (min_amount) {
            query += ` AND o.total_amount >= ?`;
            countQuery += ` AND o.total_amount >= ?`;
            params.push(parseFloat(min_amount));
            countParams.push(parseFloat(min_amount));
        }

        if (max_amount) {
            query += ` AND o.total_amount <= ?`;
            countQuery += ` AND o.total_amount <= ?`;
            params.push(parseFloat(max_amount));
            countParams.push(parseFloat(max_amount));
        }

        if (search) {
            query += ` AND (o.order_name LIKE ? OR o.notes LIKE ?)`;
            countQuery += ` AND (o.order_name LIKE ? OR o.notes LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        // Add GROUP BY for buyer queries
        if (req.user.role === 'buyer') {
            query += ` GROUP BY o.id, o.buyer_id, o.order_name, o.delivery_address, o.delivery_latitude, 
                               o.delivery_longitude, o.status, o.accepted_seller_id, o.total_amount, 
                               o.notes, o.created_at, o.updated_at, u.name`;
        }

        // Add sorting and pagination
        query += ` ORDER BY o.${sortField} ${sortOrder} LIMIT ${parsedLimit} OFFSET ${offset}`;

        const [orders] = await dbPool.execute(query, params);
        const [countResult] = await dbPool.execute(countQuery, countParams);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parsedLimit);

        sendResponse(res, 200, true, 'Filtered orders retrieved successfully', {
            orders,
            pagination: {
                currentPage: parsedPage,
                totalPages,
                totalItems: total,
                itemsPerPage: parsedLimit,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            filters: {
                status: status || null,
                start_date: start_date || null,
                end_date: end_date || null,
                min_amount: min_amount ? parseFloat(min_amount) : null,
                max_amount: max_amount ? parseFloat(max_amount) : null,
                search: search || null,
                sort: sortField,
                order: sortOrder.toLowerCase()
            }
        });

    } catch (error) {
        console.error('Advanced filter orders error:', error);
        sendResponse(res, 500, false, 'Failed to filter orders', null, error.message);
    }
});


// ========================================
// SECTION 10: PROFILE ROUTES

// ========================================

// GET /api/profile/me - Get user profile

app.get('/api/profile/me', authenticateToken, (req, res) => {
    const { password: _, date_of_birth, ...rest } = req.user;

    const formattedDOB = date_of_birth
        ? new Date(date_of_birth).toISOString().split('T')[0]
        : null;

    const userWithoutPassword = {
        ...rest,
        date_of_birth: formattedDOB,
    };

    sendResponse(res, 200, true, 'Profile retrieved successfully', userWithoutPassword);
});


// PUT /api/profile/update - Update profile

app.put('/api/profile/update', authenticateToken, [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
    body('date_of_birth').optional().isDate().withMessage('Valid date required'),
    body('address').optional().trim().isLength({ min: 1 }).withMessage('Valid address required'),
    body('latitude').optional().isFloat().withMessage('Valid latitude required'),
    body('longitude').optional().isFloat().withMessage('Valid longitude required')
], handleValidationErrors, async (req, res) => {
    try {
        const { role, id } = req.user;

        const allowedFieldsByRole = {
            buyer: ['name', 'phone', 'gender', 'date_of_birth'],
            seller: ['name', 'phone', 'gender', 'date_of_birth', 'address', 'latitude', 'longitude'],
            admin: ['name', 'email', 'phone'],
        };

        const allowedFields = allowedFieldsByRole[role] || [];

        const updates = [];
        const values = [];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        });

        if (updates.length === 0) {
            return sendResponse(res, 400, false, 'No valid fields to update for this role');
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await dbPool.execute(query, values);

        sendResponse(res, 200, true, 'Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        sendResponse(res, 500, false, 'Failed to update profile');
    }
});
app.put('/api/prokils/upkates', authenticateToken, [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
    body('date_of_birth').optional().isDate().withMessage('Valid date required'),
], handleValidationErrors, async (req, res) => {
    try {
        const { role, id } = req.user;

        const allowedFieldsByRole = {
            buyer: ['name', 'phone', 'gender', 'date_of_birth'],
            seller: ['name', 'phone', 'gender', 'date_of_birth', 'address', 'latitude', 'longitude'],
            admin: ['name', 'email', 'phone'],
        };

        const allowedFields = allowedFieldsByRole[role] || [];

        const updates = [];
        const values = [];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        });

        if (updates.length === 0) {
            return sendResponse(res, 400, false, 'No valid fields to update for this role');
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await dbPool.execute(query, values);

        sendResponse(res, 200, true, 'Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        sendResponse(res, 500, false, 'Failed to update profile');
    }
});


// POST /api/profile/change-password

// POST /api/profile/change-password - Change password
app.post('/api/profile/change-password', authenticateToken, [
    body('current_password').notEmpty().withMessage('Current password required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { current_password, new_password } = req.body;

        // 1. Verify current password using the verification function
        //    It's crucial to AWAIT the verification.
        const isCurrentPasswordCorrect = await verifyPasswordWithMigration(current_password, req.user.password);

        if (!isCurrentPasswordCorrect) {
            return sendResponse(res, 400, false, 'Current password is incorrect');
        }

        // 2. Hash the new password (and AWAIT it)
        const newPasswordHash = await hashPassword(new_password);
        await connection.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        // Invalidate all sessions except current
        const authHeader = req.headers['authorization'];
        const currentToken = authHeader && authHeader.split(' ')[1];
        const currentTokenHash = crypto.createHash('md5').update(currentToken).digest('hex');

        await connection.execute(
            'DELETE FROM user_sessions WHERE user_id = ? AND token_hash != ?',
            [req.user.id, currentTokenHash]
        );

        await connection.commit();
        sendResponse(res, 200, true, 'Password changed successfully');

    } catch (error) {
        await connection.rollback();
        console.error('Change password error:', error);
        sendResponse(res, 500, false, 'Failed to change password');
    } finally {
        connection.release();
    }
});

// POST /api/profile/upload-avatar

app.post('/api/profile/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return sendResponse(res, 400, false, 'No file uploaded');
        }

        const profilePicPath = `/uploads/profiles/${req.file.filename}`;

        await dbPool.execute(
            'UPDATE users SET profile_pic = ?, updated_at = NOW() WHERE id = ?',
            [profilePicPath, req.user.id]
        );

        sendResponse(res, 200, true, 'Profile picture uploaded successfully', { profilePic: profilePicPath });
    } catch (error) {
        console.error('Upload avatar error:', error);
        sendResponse(res, 500, false, 'Failed to upload profile picture');
    }
});


// DELETE /api/profile/delete-account

app.delete('/api/profile/delete-account', authenticateToken, [
    body('password').notEmpty().withMessage('Password required for account deletion')
], handleValidationErrors, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        const { password } = req.body;
        const [userRows] = await connection.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = userRows[0];

        if (!user) {
            await connection.rollback();
            return sendResponse(res, 404, false, 'User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await connection.rollback();
            return sendResponse(res, 400, false, 'Incorrect password');
        }

        const [activeOrders] = await connection.execute(
            'SELECT COUNT(*) as count FROM orders WHERE (buyer_id = ? OR accepted_seller_id = ?) AND status IN (?, ?, ?)',
            [req.user.id, req.user.id, 'pending', 'in_progress', 'accepted']
        );

        if (activeOrders[0].count > 0) {
            await connection.rollback();
            return sendResponse(res, 400, false, 'Cannot delete account with active orders');
        }

        await connection.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
        await connection.commit();

        sendResponse(res, 200, true, 'Account deleted successfully');
    } catch (error) {
        await connection.rollback();
        console.error('Delete account error:', error);
        sendResponse(res, 500, false, 'Failed to delete account');
    } finally {
        connection.release();
    }
});

// ========================================
// Chat System
// ========================================


const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = verifyToken(token);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
};

// Verify if user can participate in order chat
async function verifyOrderChatParticipation(userId, orderId) {
    const [result] = await dbPool.execute(
        `SELECT 1 FROM order_chat_participants 
     WHERE order_id = ? AND (buyer_id = ? OR seller_id = ?) AND chat_status = 'active'`,
        [orderId, userId, userId]
    );

    return result.length > 0;
}

// Get order chat information
async function getOrderChatInfo(userId, orderId) {
    // Hardcoded limit and offset
    const limit = 10;
    const offset = 0;

    const [result] = await dbPool.execute(
        `SELECT 
           ocp.order_id,
           ocp.buyer_id,
           ocp.seller_id,
           o.order_name,
           CASE 
             WHEN ocp.buyer_id = ? THEN ocp.seller_id
             ELSE ocp.buyer_id
           END as receiver_id,
           CASE 
             WHEN ocp.buyer_id = ? THEN seller.name
             ELSE buyer.name
           END as receiver_name,
           CASE 
             WHEN ocp.buyer_id = ? THEN buyer.name
             ELSE seller.name
           END as sender_name
         FROM order_chat_participants ocp
         JOIN orders o ON ocp.order_id = o.id
         JOIN users buyer ON ocp.buyer_id = buyer.id
         JOIN users seller ON ocp.seller_id = seller.id
         WHERE ocp.order_id = ? 
           AND (ocp.buyer_id = ? OR ocp.seller_id = ?)
           AND ocp.chat_status = 'active'
         ORDER BY ocp.order_id DESC
         LIMIT ${limit} OFFSET ${offset}`, // Hardcoded directly in the SQL string
        [userId, userId, userId, orderId, userId, userId] // Proper parameter order
    );

    return result.length > 0 ? {
        orderId: result[0].order_id,
        buyerId: result[0].buyer_id,
        sellerId: result[0].seller_id,
        orderName: result[0].order_name,
        receiverId: result[0].receiver_id,
        receiverName: result[0].receiver_name,
        senderName: result[0].sender_name
    } : null;
}

// Save order message
async function saveOrderMessage({ orderId, senderId, receiverId, message, messageType = 'text', fileUrl = null }) {
    const [result] = await dbPool.execute(
        `INSERT INTO order_messages (order_id, sender_id, receiver_id, message, message_type, file_url, is_read, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW(), NOW())`,
        [orderId, senderId, receiverId, message, messageType, fileUrl]
    );

    const [savedMessage] = await dbPool.execute(
        `SELECT om.*, u.name as sender_name 
     FROM order_messages om
     JOIN users u ON om.sender_id = u.id
     WHERE om.id = ?`,
        [result.insertId]
    );

    return savedMessage[0];
}

// Get order messages with pagination
async function getOrderMessages(orderId, page) {
    const offset = (page - 1) * 20; // Hardcoded limit to 20

    const [messages] = await dbPool.execute(
        `SELECT 
            om.*, 
            u.name AS sender_name
         FROM order_messages om
         JOIN users u ON om.sender_id = u.id
         WHERE om.order_id = ?
         ORDER BY om.created_at DESC
         LIMIT 20 OFFSET ${offset}` // <-- Hardcoded limit and offset
        , [orderId]);

    return messages.reverse(); // To return in chronological order
}

// Get total message count for an order
async function getOrderMessagesCount(orderId) {
    const [result] = await dbPool.execute(
        'SELECT COUNT(*) as count FROM order_messages WHERE order_id = ?',
        [orderId]
    );

    return result[0].count;
}
// Mark messages as read
async function markOrderMessagesAsRead(orderId, userId) {
    const [result] = await dbPool.execute(
        `UPDATE order_messages 
     SET is_read = TRUE, updated_at = NOW() 
     WHERE order_id = ? AND receiver_id = ? AND is_read = FALSE`,
        [orderId, userId]
    );

    return result.affectedRows;
}

// Get unread message count
async function getUnreadMessageCount(orderId, userId) {
    const [result] = await dbPool.execute(
        'SELECT COUNT(*) as count FROM order_messages WHERE order_id = ? AND receiver_id = ? AND is_read = FALSE',
        [orderId, userId]
    );

    return result[0].count;
}


// Get user's order chats
async function getUserOrderChats(userId, page = 1) {
    const offset = (page - 1) * 20; // Hardcoded limit

    const [chats] = await dbPool.execute(
        `SELECT 
           ocp.order_id,
           o.order_name,
           o.status AS order_status,
           CASE 
             WHEN ocp.buyer_id = ? THEN seller.name
             ELSE buyer.name
           END AS other_party_name,
           CASE 
             WHEN ocp.buyer_id = ? THEN 'seller'
             ELSE 'buyer'
           END AS other_party_type,
           (SELECT COUNT(*) FROM order_messages 
            WHERE order_id = ocp.order_id AND receiver_id = ? AND is_read = FALSE) AS unread_count,
           (SELECT message FROM order_messages 
            WHERE order_id = ocp.order_id ORDER BY created_at DESC LIMIT 1) AS last_message,
           (SELECT created_at FROM order_messages 
            WHERE order_id = ocp.order_id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
           ocp.created_at
         FROM order_chat_participants ocp
         JOIN orders o ON ocp.order_id = o.id
         JOIN users buyer ON ocp.buyer_id = buyer.id
         JOIN users seller ON ocp.seller_id = seller.id
         WHERE (ocp.buyer_id = ? OR ocp.seller_id = ?) AND ocp.chat_status = 'active'
         ORDER BY COALESCE(last_message_time, ocp.created_at) DESC
         LIMIT 20 OFFSET ${offset}`, // Hardcoded limit, inline offset
        [userId, userId, userId, userId, userId]
    );

    return chats;
}

// Create chat participants when quotation is created
async function createOrderChatParticipants(orderId, buyerId, sellerId, quotationId = null) {
    try {
        await dbPool.execute(
            `INSERT IGNORE INTO order_chat_participants (order_id, buyer_id, seller_id, quotation_id)
       VALUES (?, ?, ?, ?)`,
            [orderId, buyerId, sellerId, quotationId]
        );
    } catch (error) {
        console.error('Error creating chat participants:', error);
    }
}

// Close chat when order is completed/cancelled or quotation is rejected
async function closeOrderChat(orderId, buyerId, sellerId) {
    try {
        await dbPool.execute(
            `UPDATE order_chat_participants 
       SET chat_status = 'closed', closed_at = NOW()
       WHERE order_id = ? AND buyer_id = ? AND seller_id = ?`,
            [orderId, buyerId, sellerId]
        );
    } catch (error) {
        console.error('Error closing chat:', error);
    }
}

// Send push notification (implement based on your notification system)
async function sendMessageNotification(receiverId, messageData) {
    // Implement push notification logic here
    // This could be Firebase FCM, email, SMS, etc.
    console.log('Sending notification to user:', receiverId, messageData);
}

// 5. ADD SOCKET.IO CONNECTION HANDLING (after your middleware setup)

io.use(authenticateSocket);

// Socket connection handling
io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join order-specific chat rooms
    socket.on('join_order_chat', async (data) => {
        const { orderId } = data;

        try {
            // Verify user can participate in this order chat
            const canParticipate = await verifyOrderChatParticipation(socket.userId, orderId);

            if (canParticipate) {
                socket.join(`order_${orderId}`);
                socket.emit('joined_order_chat', { orderId, success: true });

                // Send recent messages
                const recentMessages = await getOrderMessages(orderId, 1, 20);
                socket.emit('order_messages_history', { orderId, messages: recentMessages });
            } else {
                socket.emit('joined_order_chat', { orderId, success: false, error: 'Not authorized' });
            }
        } catch (error) {
            socket.emit('joined_order_chat', { orderId, success: false, error: 'Server error' });
        }
    });

    // Handle sending messages
    socket.on('send_order_message', async (data) => {
        const { orderId, message, messageType = 'text', fileUrl = null, fileName = null } = data;

        try {
            // Verify user can send message to this order
            const chatInfo = await getOrderChatInfo(socket.userId, orderId);

            if (!chatInfo) {
                socket.emit('message_error', { error: 'Not authorized to send message' });
                return;
            }

            // For file messages, message can be empty or contain a caption
            if (messageType !== 'text' && !fileUrl) {
                socket.emit('message_error', { error: 'File URL required for file messages' });
                return;
            }

            // Save message to database using fixed function
            const savedMessage = await saveOrderMessage({
                orderId,
                senderId: socket.userId,
                receiverId: chatInfo.receiverId,
                message: message || (fileName ? `Sent a file: ${fileName}` : 'Sent a file'),
                messageType,
                fileUrl
            });

            // Emit to all participants in the order chat
            io.to(`order_${orderId}`).emit('new_order_message', {
                ...savedMessage,
                sender_name: chatInfo.senderName,
                fileName // Include original filename for display
            });

            // Send push notification to receiver
            let notificationMessage;
            switch (messageType) {
                case 'image':
                    notificationMessage = 'Sent an image';
                    break;
                case 'file':
                    notificationMessage = fileName ? `Sent a file: ${fileName}` : 'Sent a file';
                    break;
                default:
                    notificationMessage = message;
            }

            await sendMessageNotification(chatInfo.receiverId, {
                orderId,
                senderName: chatInfo.senderName,
                message: notificationMessage,
                orderName: chatInfo.orderName
            });

        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    })
    // Handle marking messages as read
    socket.on('mark_messages_read', async (data) => {
        const { orderId } = data;

        try {
            await markOrderMessagesAsRead(orderId, socket.userId);

            // Notify other participants that messages were read
            socket.to(`order_${orderId}`).emit('messages_marked_read', {
                orderId,
                readByUserId: socket.userId
            });
        } catch (error) {
            console.error('Mark messages read error:', error);
        }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
        const { orderId } = data;
        socket.to(`order_${orderId}`).emit('user_typing', {
            orderId,
            userId: socket.userId,
            typing: true
        });
    });

    socket.on('typing_stop', (data) => {
        const { orderId } = data;
        socket.to(`order_${orderId}`).emit('user_typing', {
            orderId,
            userId: socket.userId,
            typing: false
        });
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
    });
});

// 6. ADD CHAT API ENDPOINTS (add these with your other routes)

// GET /api/orders/:orderId/messages - Get order messages with pagination

// ✅ FIXED: PUT /api/orders/:orderId/messages/mark-read - Mark messages as read (was individual message)
app.put('/api/orders/:orderId/messages/mark-read', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Verify user has access to this order's chat
        const [participants] = await dbPool.execute(
            `SELECT ocp.* FROM order_chat_participants ocp 
       WHERE ocp.order_id = ? AND (ocp.buyer_id = ? OR ocp.seller_id = ?) AND ocp.chat_status = 'active'`,
            [orderId, req.user.id, req.user.id]
        );

        if (participants.length === 0) {
            return sendResponse(res, 403, false, 'Not authorized to access this chat');
        }

        // Mark all unread messages as read for this user
        const [result] = await dbPool.execute(
            `UPDATE order_messages 
       SET is_read = TRUE, updated_at = NOW() 
       WHERE order_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [orderId, req.user.id]
        );

        // Notify other participants via socket
        io.to(`order_${orderId}`).emit('messages_marked_read', {
            orderId,
            readByUserId: req.user.id,
            markedCount: result.affectedRows
        });

        sendResponse(res, 200, true, `${result.affectedRows} messages marked as read`);
    } catch (error) {
        console.error('Mark messages read error:', error);
        sendResponse(res, 500, false, 'Failed to mark messages as read');
    }
});

// ✅ FIXED: GET /api/orders/:orderId/messages/history - Get message history (was quotation-based)
app.get('/api/orders/:orderId/messages/history', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Hardcoded pagination for MySQL 8.0.42 compatibility
        const limit = 50;
        const offset = 0; // Fixed to page 1 (offset = 0)

        // Verify access
        const [participants] = await dbPool.execute(
            `SELECT ocp.* FROM order_chat_participants ocp 
             WHERE ocp.order_id = ? AND (ocp.buyer_id = ? OR ocp.seller_id = ?)`,
            [orderId, req.user.id, req.user.id]
        );

        if (participants.length === 0) {
            return sendResponse(res, 403, false, 'Not authorized to access this chat history');
        }

        // Get message history (hardcoded limit and offset)
        const [messages] = await dbPool.execute(
            `SELECT om.*, u.name as sender_name
             FROM order_messages om 
             JOIN users u ON om.sender_id = u.id 
             WHERE om.order_id = ? 
             ORDER BY om.created_at DESC 
             LIMIT 50 OFFSET 0`,  // <-- hardcoded
            [orderId]
        );

        // Get total count
        const [countResult] = await dbPool.execute(
            'SELECT COUNT(*) as total FROM order_messages WHERE order_id = ?',
            [orderId]
        );

        const result = {
            messages: messages.reverse(), // oldest to newest
            pagination: {
                currentPage: 1, // hardcoded
                totalMessages: countResult[0].total,
                hasNextPage: countResult[0].total > 50,
                hasPreviousPage: false
            }
        };

        sendResponse(res, 200, true, 'Message history retrieved successfully', result);
    } catch (error) {
        console.error('Get message history error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve message history');
    }
});

app.get('/api/orders/:orderId/messages', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Hardcoded pagination values
        const page = 1; // Always fetch first page
        const limit = 20; // Fixed limit per request
        const offset = 0; // Since page = 1, offset = (1 - 1) * 20 = 0

        // Verify user has access to this order's chat
        const [participants] = await dbPool.execute(
            `SELECT ocp.* FROM order_chat_participants ocp 
             WHERE ocp.order_id = ? AND (ocp.buyer_id = ? OR ocp.seller_id = ?) AND ocp.chat_status = 'active'`,
            [orderId, req.user.id, req.user.id]
        );

        if (participants.length === 0) {
            return sendResponse(res, 403, false, 'Not authorized to access this chat');
        }

        // Get messages with fixed limit and offset
        const [messages] = await dbPool.execute(
            `SELECT om.*, u.name as sender_name
             FROM order_messages om 
             JOIN users u ON om.sender_id = u.id 
             WHERE om.order_id = ? 
             ORDER BY om.created_at DESC 
             LIMIT ${limit} OFFSET ${offset}`, // Hardcoded values
            [orderId]
        );

        // Get total count for pagination
        const [countResult] = await dbPool.execute(
            'SELECT COUNT(*) as total FROM order_messages WHERE order_id = ?',
            [orderId]
        );

        const result = {
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                currentPage: page,
                totalMessages: countResult[0].total,
                hasNextPage: (page * limit) < countResult[0].total
            }
        };

        sendResponse(res, 200, true, 'Messages retrieved successfully', result);
    } catch (error) {
        console.error('Get order messages error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve messages');
    }
});


// ✅ FIXED: POST /api/orders/:orderId/messages - Send message (was separate /api/messages/send)
app.post('/api/orders/:orderId/messages', authenticateToken, [
    body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message must be max 1000 characters'),
    body('message_type').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
    body('file_url').optional().notEmpty().withMessage('File URL required for file messages'),
    body('file_name').optional().trim()
], handleValidationErrors, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { message, message_type = 'text', file_url = null, file_name = null } = req.body;

        // Get chat info and verify access
        const chatInfo = await getOrderChatInfo(req.user.id, orderId);

        if (!chatInfo) {
            return sendResponse(res, 403, false, 'Not authorized to send message to this order');
        }

        // Validate message content
        if (message_type === 'text' && (!message || message.trim().length === 0)) {
            return sendResponse(res, 400, false, 'Message content required for text messages');
        }

        if ((message_type === 'image' || message_type === 'file') && !file_url) {
            return sendResponse(res, 400, false, 'File URL required for file messages');
        }

        // Save message with fixed table name
        const messageText = message || (file_name ? `Sent a file: ${file_name}` : 'Sent a file');

        const [result] = await dbPool.execute(
            `INSERT INTO order_messages (order_id, sender_id, receiver_id, message, message_type, file_url, is_read, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW(), NOW())`,
            [orderId, req.user.id, chatInfo.receiverId, messageText, message_type, file_url]
        );

        // Get the saved message with sender info
        const [savedMessage] = await dbPool.execute(
            `SELECT om.*, u.name as sender_name 
       FROM order_messages om
       JOIN users u ON om.sender_id = u.id
       WHERE om.id = ?`,
            [result.insertId]
        );

        // Emit to socket clients
        io.to(`order_${orderId}`).emit('new_order_message', {
            ...savedMessage[0],
            fileName: file_name
        });

        // Send push notification
        let notificationMessage;
        switch (message_type) {
            case 'image':
                notificationMessage = 'Sent an image';
                break;
            case 'file':
                notificationMessage = file_name ? `Sent a file: ${file_name}` : 'Sent a file';
                break;
            default:
                notificationMessage = message;
        }

        await sendMessageNotification(chatInfo.receiverId, {
            orderId,
            senderName: req.user.name,
            message: notificationMessage,
            orderName: chatInfo.orderName
        });

        sendResponse(res, 201, true, 'Message sent successfully', savedMessage[0]);

    } catch (error) {
        console.error('Send message error:', error);
        sendResponse(res, 500, false, 'Failed to send message');
    }
});


// GET /api/orders/:orderId/chat-info - Get chat participants and status
app.get('/api/orders/:orderId/chat-info', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const chatInfo = await getOrderChatInfo(req.user.id, orderId);

        if (!chatInfo) {
            return sendResponse(res, 403, false, 'Not authorized to access this chat');
        }

        // Get unread message count
        const unreadCount = await getUnreadMessageCount(orderId, req.user.id);

        sendResponse(res, 200, true, 'Chat info retrieved successfully', {
            ...chatInfo,
            unreadCount
        });

    } catch (error) {
        console.error('Get chat info error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve chat info');
    }
});

// GET /api/orders/my-chats - Get all active chats for user (with hardcoded pagination for MySQL 8.0.42)
app.get('/api/orders/my-chats', authenticateToken, async (req, res) => {
    try {
        const page = 1; // Hardcoded for MySQL compatibility
        const limit = 20;
        const offset = (page - 1) * limit;

        const chats = await getUserOrderChats(req.user.id, offset, limit);

        sendResponse(res, 200, true, 'Chats retrieved successfully', chats);

    } catch (error) {
        console.error('Get user chats error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve chats');
    }
});

app.post('/api/orders/:orderId/upload-file', authenticateToken, chatUpload.single('file'), async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!req.file) {
            return sendResponse(res, 400, false, 'No file uploaded');
        }

        // Verify user can access this order's chat
        const canAccess = await verifyOrderChatParticipation(req.user.id, orderId);

        if (!canAccess) {
            return sendResponse(res, 403, false, 'Not authorized to upload files to this chat');
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;

        // Determine message type based on file type
        let messageType = 'file';
        if (req.file.mimetype.startsWith('image/')) {
            messageType = 'image';
        }

        const fileInfo = {
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            messageType,
            mimeType: req.file.mimetype
        };

        sendResponse(res, 200, true, 'File uploaded successfully', fileInfo);
    } catch (error) {
        console.error('File upload error:', error);
        sendResponse(res, 500, false, 'File upload failed');
    }
});


// ========================================
// SECTION 11: ERROR HANDLING & SERVER STARTUP
// ========================================

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendResponse(res, 400, false, 'File too large. Maximum size is 5MB');
    }
    return sendResponse(res, 400, false, 'File upload error');
  }

  sendResponse(res, 500, false, 'Internal server error');
});

// 404 handler
app.use('*', (req, res) => {
  sendResponse(res, 404, false, 'Endpoint not found');
});

// Cleanup expired sessions and OTPs
setInterval(async () => {
  try {
    await dbPool.execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
    await dbPool.execute('DELETE FROM otp_verifications WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour

// Initialize and start server
async function startServer() {
    try {
        await initializeDatabase();

        server.listen(PORT, '0.0.0.0', () => { // ✅ Correct
            console.log(`🚀 Grocery Delivery Server running on port ${PORT}`);
            console.log(`📱 API Base URL: http://0.0.0.0:${PORT}/api`);
            console.log(`📊 Database: Connected to ${dbConfig.database}`);
            console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📤 Received SIGTERM. Shutting down gracefully...');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📤 Received SIGINT. Shutting down gracefully...');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});
