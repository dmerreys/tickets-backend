import { Schema, model } from 'mongoose';

const worklogSchema = new Schema({
  type: {
    type: String,
    enum: ['Resuelto', 'Trabajo', 'Primer Contacto', 'Nota del Cliente', 'Actualizar'],
    required: true
  },
  timeSpent: { type: Number, required: true }, // En minutos
  workDate: { type: Date, default: Date.now },
  contact: { type: String },
  solution: { type: String },
  cause: { type: String },
  resolution: { type: String },
  additionalAnalysts: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const ticketSchema = new Schema({
  ticketId: { type: String, unique: true }, // Nuevo campo para ID personalizado
  title: { type: String, required: true },
  description: { type: String, required: true },
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  priority: { type: String, enum: ['baja', 'media', 'alta'], default: 'media' },
  status: { type: String, enum: ['abierto', 'en progreso', 'resuelto', 'cerrado'], default: 'abierto' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  slaDeadline: { type: Date, required: true },
  slaBreached: { type: Boolean, default: false },
  phone: { type: String },
  email: { type: String },
  organization: { type: String },
  impact: { type: String, enum: ['Bajo', 'Medio', 'Alto'] },
  urgency: { type: String, enum: ['Baja', 'Media', 'Alta'] },
  severity: { type: String },
  additionalInfo: { type: String },
  contact: { type: String },
  teamviewer: { type: String },
  provider: { type: String },
  system: { type: String },
  closeCode: { type: String },
  worklog: [worklogSchema],
  relatedTickets: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }], // Nuevo campo para tickets relacionados
}, { timestamps: true });

// Verificar si el SLA se ha incumplido antes de guardar
ticketSchema.pre('save', function(next) {
  const now = new Date();
  if (this.status !== 'resuelto' && this.status !== 'cerrado' && now > this.slaDeadline) {
    this.slaBreached = true;
  }
  next();
});

export default model('Ticket', ticketSchema);