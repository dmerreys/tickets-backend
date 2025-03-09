import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Faltan datos requeridos' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Usuario ya existe' });
    }

    const user = new User({ name, email, password, role: role || 'usuario', phone });
    await user.save();

    const payload = { userId: user._id, role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error al registrar usuario:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Faltan credenciales' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const payload = { userId: user._id, role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error al iniciar sesión:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

export default router;