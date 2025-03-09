import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Precarga de usuarios (solo admin)
router.post('/preload', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const users = [
      { name: 'Juan Pérez', email: 'juan.perez@tickets.com', password: 'tech123', role: 'tecnico', phone: '123456789', specialties: ['Aplicaciones Tiendas'] },
      { name: 'María Gómez', email: 'maria.gomez@tickets.com', password: 'tech123', role: 'tecnico', phone: '987654321', specialties: ['Equipos & Periféricos'] },
      { name: 'Carlos López', email: 'carlos.lopez@tickets.com', password: 'tech123', role: 'tecnico', phone: '456789123', specialties: ['Aplicaciones Administrativas'] },
      { name: 'Admin Principal', email: 'admin@tickets.com', password: 'admin123', role: 'admin', phone: '111222333', specialties: [] },
      { name: 'Laura Martínez', email: 'laura.martinez@tickets.com', password: 'tech123', role: 'tecnico', phone: '555666777', pecialtiess: ['General'] },
      { name: 'Pedro Sánchez', email: 'pedro.sanchez@tickets.com', password: 'tech123', role: 'tecnico', phone: '888999000', specialties: ['CLA'] },
      { name: 'Sofía Ramírez', email: 'sofia.ramirez@tickets.com', password: 'tech123', role: 'tecnico', phone: '222333444', specialties: ['Cambios'] },
      { name: 'Diego Torres', email: 'diego.torres@tickets.com', password: 'tech123', role: 'tecnico', phone: '777888999', specialties: ['Aplicaciones Tiendas', 'General'] },
      { name: 'Ana Morales', email: 'ana.morales@tickets.com', password: 'tech123', role: 'tecnico', phone: '444555666', specialties: ['Equipos & Periféricos', 'CLA'] },
      { name: 'Luis Fernández', email: 'luis.fernandez@tickets.com', password: 'tech123', role: 'tecnico', phone: '999000111', specialties: ['Aplicaciones Administrativas', 'Cambios'] },
    ];

    const hashedUsers = await Promise.all(users.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return { ...user, password: hashedPassword };
    }));

    await User.deleteMany({ email: { $in: users.map(u => u.email) } });
    const insertedUsers = await User.insertMany(hashedUsers);
    console.log('Usuarios precargados:', insertedUsers.length);
    res.status(201).json(insertedUsers);
  } catch (err) {
    console.error('Error al precargar usuarios:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

export default router;