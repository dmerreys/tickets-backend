import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();



export default router;