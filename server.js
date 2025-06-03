import express, { json } from 'express';
import { verify } from 'argon2';
import cors from 'cors';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import https from 'https';
import crypto from 'crypto';
import mongoose from 'mongoose';

const app = express();
const options = {
  cert: fs.readFileSync('./localhost+2.pem'),
  key: fs.readFileSync('./localhost+2-key.pem'),
};

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: 'https://localhost:3000',
  methods: 'GET, POST, PUT, DELETE',
  credentials: true,
}));
app.use(json());

// Redis setup
const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.on('error', err => console.log('Redis Client Error', err));

try {
  await redisClient.connect();
  console.log('Redis connected');
} catch (err) {
  console.error('Redis connection failed:', err);
}

if (!redisClient.isOpen) {
  await redisClient.connect();
}

// Generate session ID (secure)
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

mongoose.connect('mongodb://localhost:27017/authdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);


// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const lockoutKey = `lockout:${email}`;
  const attemptsKey = `attempts:${email}`;

  try {
    // Check if account is locked
    const isLockedOut = await redisClient.exists(lockoutKey);
    if (isLockedOut) {
      return res.status(403).json({
        error: "Account is temporarily locked. Try again in 15 minutes."
      });
    }

    // Validate user
    const user = await User.findOne({ email });
    const isValid = user && await verify(user.password, password);

    if (!isValid) {
      const attempts = await redisClient.incr(attemptsKey);
      if (attempts === 1) {
        await redisClient.expire(attemptsKey, 900); // 15 min
      }

      if (attempts >= 5) {
        await redisClient.setEx(lockoutKey, 900, 'locked');
        return res.status(403).json({
          error: "Too many failed attempts. Account locked for 15 minutes."
        });
      }

      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Success: Clear attempts and lock
    await redisClient.del([attemptsKey, lockoutKey]);

    // Generate and set sessionId cookie
    const sessionId = generateSessionId();
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000,
    });

    return res.json({ success: true });

  } catch (err) {
    console.error('🔥 Login error:', err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Start HTTPS server
https.createServer(options, app).listen(3001, () => {
  console.log('✅ HTTPS Server running at https://localhost:3001');
});
