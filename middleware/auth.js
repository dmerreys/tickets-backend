import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  let token;

  // Verificar si el token viene en x-auth-token o Authorization
  if (req.header('x-auth-token')) {
    token = req.header('x-auth-token');
  } else if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer ')) {
    token = req.header('Authorization').split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('name email role');
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    req.user = { ...decoded, name: user.name, email: user.email };
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