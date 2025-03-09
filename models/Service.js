import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: { // Nueva categoría para clasificar servicios
    type: String,
    enum: ['Aplicaciones Administrativas', 'Aplicaciones Tiendas', 'Cambios', 'CLA', 'Equipos & Periféricos', 'General'],
    required: true
  },
  sla: {
    responseTime: { type: Number, required: true }, // En horas
    resolutionTime: { type: Number, required: true } // En horas
  },
  popularity: { // Contador de solicitudes
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default model('Service', serviceSchema);