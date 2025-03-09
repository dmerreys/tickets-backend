import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  console.log('Middleware de autenticación ejecutado');
  console.log('Headers recibidos:', req.headers);

  let token = req.header('x-auth-token');

  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    console.log('Authorization header encontrado:', authHeader);
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    console.log('No se encontró token');
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  console.log('Token recibido:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);

    const user = await User.findById(decoded.userId).select('name email role');
    if (!user) {
      console.log('Usuario no encontrado en la DB');
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    req.user = { ...decoded, name: user.name, email: user.email };
    console.log('Usuario autenticado:', req.user);

    res.set('X-User-Name', user.name);
    res.set('X-User-Email', user.email);
    res.set('X-User-Role', user.role);

    next();
  } catch (err) {
    console.error('Error al verificar token:', err.message);
    res.status(401).json({ msg: 'Token inválido' });
  }
};

export default authMiddleware;