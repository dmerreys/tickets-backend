import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import serviceRoutes from './routes/services.js';
import usersRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Cargar variables de entorno
config();

// Middleware esencial
app.use(cors());
app.use(json());

// Log básico para cada petición
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Función para conectar a MongoDB con reintentos
const connectToMongoDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Conectado a MongoDB');
      break; // Si se conecta, salir del bucle
    } catch (err) {
      console.error('Error al conectar a MongoDB:', err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('No se pudo conectar a MongoDB tras varios intentos. La app seguirá funcionando sin DB.');
        break;
      }
      console.log(`Reintentando conexión a MongoDB (${retries} intentos restantes)...`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos antes de reintentar
    }
  }
};

// Iniciar conexión a MongoDB
connectToMongoDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', usersRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('API de Ticket System funcionando');
});

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  console.log('Ruta no encontrada:', req.method, req.url);
  res.status(404).send('Cannot ' + req.method + ' ' + req.url);
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error no manejado:`, err.stack);
  res.status(500).json({ msg: 'Error interno del servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err.stack);
  // No se termina el proceso, permitimos que siga corriendo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo de promesa no manejado:', reason.stack || reason);
  // No se termina el proceso
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});