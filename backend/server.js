import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import https from 'https';
import crypto from 'crypto';
import { createClient } from 'redis';
import { connectDB } from './services/db.js';
import User from './models/Users.js'; // Your User model
import argon2 from 'argon2';

await connectDB();

const app = express();

const options = {
  cert: fs.readFileSync('./localhost+2.pem'),
  key: fs.readFileSync('./localhost+2-key.pem'),
};

app.use(cookieParser());
app.use(cors({
  origin: 'https://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.on('error', err => console.error('Redis Client Error', err));
await redisClient.connect();

function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

// --- REGISTER ---
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = new User({ email, passwordHash: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const lockoutKey = `lockout:${email}`;
    const attemptsKey = `attempts:${email}`;

    // Check lockout status
    if (await redisClient.exists(lockoutKey)) {
      return res.status(403).json({
        error: "Account is temporarily locked. Try again in 15 minutes."
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Increment attempts counter on failed login
      const attempts = await redisClient.incr(attemptsKey);
      if (attempts === 1) {
        await redisClient.expire(attemptsKey, 900); // 15 minutes
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      const attempts = await redisClient.incr(attemptsKey);
      if (attempts === 1) {
        await redisClient.expire(attemptsKey, 900);
      }
      if (attempts >= 5) {
        await redisClient.setEx(lockoutKey, 900, 'locked');
        return res.status(403).json({
          error: "Too many failed attempts. Account locked for 15 minutes."
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Success: clear attempts and lockout
    await redisClient.del([attemptsKey, lockoutKey]);

    // Generate and set session cookie
    const sessionId = generateSessionId();
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
});

https.createServer(options, app).listen(3001, () => {
  console.log('✅ HTTPS Server running at https://localhost:3001');
});
