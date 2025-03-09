import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import serviceRoutes from './routes/services.js';

import usersRoutes from './routes/users.js'; // Añadir esta línea
const app = express();
const PORT = process.env.PORT || 5000;

config();

// Middleware
app.use(cors());
app.use(json());

// Log para cada petición
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Conexión a MongoDB
connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.log('Error al conectar a MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/services', serviceRoutes);

app.use('/api/users', usersRoutes); // Añadir esta línea

app.get('/', (req, res) => {
  res.send('API de Ticket System funcionando');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log('Ruta no encontrada:', req.method, req.url);
  res.status(404).send('Cannot ' + req.method + ' ' + req.url);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});