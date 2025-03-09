import express from 'express';
import Ticket from '../models/Ticket.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Crear un ticket
router.post('/', authMiddleware, async (req, res) => {
  const {
    title, description, service, serviceId, priority, phone, email, organization, impact, urgency,
    severity, additionalInfo, contact, teamviewer, provider, system, relatedTickets
  } = req.body;

  try {
    const serviceToUse = service || serviceId;
    if (!serviceToUse) {
      return res.status(400).json({ msg: 'El ID del servicio es requerido' });
    }

    const serviceDoc = await Service.findById(serviceToUse);
    if (!serviceDoc) {
      return res.status(400).json({ msg: 'Servicio no encontrado' });
    }

    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + serviceDoc.sla.resolutionTime);

    let assignedTo = null;
    if (!req.body.assignedTo) {
      const technicians = await User.find({ role: 'tecnico' });
      if (technicians.length > 0) {
        const technicianWorkload = await Promise.all(
          technicians.map(async (tech) => {
            const activeTickets = await Ticket.countDocuments({
              assignedTo: tech._id,
              status: { $nin: ['resuelto', 'cerrado'] },
            });
            const specialties = tech.specialties || [];
            const categoryMatch = specialties.includes(serviceDoc.category) ? 1 : 0;
            return {
              tech,
              score: (1 / (activeTickets + 1)) + categoryMatch,
            };
          })
        );
        const bestTech = technicianWorkload.reduce((max, current) =>
          current.score > max.score ? current : max
        );
        assignedTo = bestTech.tech._id;
        console.log(`Asignado a: ${bestTech.tech.name} con puntaje ${bestTech.score} (Categoría: ${serviceDoc.category})`);
      }
    }

    const ticketId = `IC-2025-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const ticket = new Ticket({
      ticketId,
      title,
      description,
      service: serviceToUse,
      priority: priority || 'media',
      createdBy: req.user.userId,
      assignedTo,
      slaDeadline,
      phone,
      email,
      organization,
      impact,
      urgency,
      severity,
      additionalInfo,
      contact,
      teamviewer,
      provider,
      system,
      relatedTickets: relatedTickets || [],
    });

    serviceDoc.popularity += 1;
    await serviceDoc.save();
    await ticket.save();

    if (relatedTickets?.length > 0) {
      await Ticket.updateMany(
        { ticketId: { $in: relatedTickets } },
        { $push: { relatedTickets: ticket.ticketId } }
      );
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('Error al crear ticket:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Obtener todos los tickets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const tickets = await Ticket.find()
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .skip((page - 1) * limit)
      .limit(limit);
    const totalTickets = await Ticket.countDocuments();
    res.json({
      tickets,
      currentPage: page,
      totalPages: Math.ceil(totalTickets / limit),
      totalTickets,
    });
  } catch (err) {
    console.error('Error al obtener tickets:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Obtener mis tickets creados
router.get('/my-tickets', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.userId })
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    res.json(tickets);
  } catch (err) {
    console.error('Error al obtener mis tickets:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Obtener tickets asignados a mí
router.get('/my-assigned', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.userId })
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    res.json(tickets);
  } catch (err) {
    console.error('Error al obtener tickets asignados:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Obtener un ticket por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket no encontrado' });
    }
    res.json(ticket);
  } catch (err) {
    console.error('Error al obtener ticket por ID:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Actualizar un ticket
router.put('/:id', authMiddleware, async (req, res) => {
  const {
    title, description, priority, status, assignedTo, phone, email, organization,
    impact, urgency, severity, additionalInfo, contact, teamviewer, provider, system, closeCode, relatedTickets
  } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket no encontrado' });
    }

    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user.userId && ticket.assignedTo?.toString() !== req.user.userId) {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.priority = priority || ticket.priority;
    ticket.status = status || ticket.status;
    ticket.assignedTo = assignedTo || ticket.assignedTo;
    ticket.phone = phone || ticket.phone;
    ticket.email = email || ticket.email;
    ticket.organization = organization || ticket.organization;
    ticket.impact = impact || ticket.impact;
    ticket.urgency = urgency || ticket.urgency;
    ticket.severity = severity || ticket.severity;
    ticket.additionalInfo = additionalInfo || ticket.additionalInfo;
    ticket.contact = contact || ticket.contact;
    ticket.teamviewer = teamviewer || ticket.teamviewer;
    ticket.provider = provider || ticket.provider;
    ticket.system = system || ticket.system;
    ticket.closeCode = closeCode || ticket.closeCode;
    ticket.relatedTickets = relatedTickets || ticket.relatedTickets;

    await ticket.save();

    if (relatedTickets?.length > 0) {
      await Ticket.updateMany(
        { ticketId: { $in: relatedTickets } },
        { $push: { relatedTickets: ticket.ticketId } }
      );
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    res.json(populatedTicket);
  } catch (err) {
    console.error('Error al actualizar ticket:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Agregar un worklog a un ticket
router.post('/:id/worklog', authMiddleware, async (req, res) => {
  const { type, timeSpent, workDate, contact, solution, cause, resolution, additionalAnalysts } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket no encontrado' });
    }

    const isCreator = ticket.createdBy.toString() === req.user.userId;
    const isAssigned = ticket.assignedTo?.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isCreator && !isAssigned && !isAdmin) {
      return res.status(403).json({ msg: 'No autorizado para agregar registro de trabajo' });
    }

    ticket.worklog.push({
      type,
      timeSpent,
      workDate: workDate || Date.now(),
      contact,
      solution,
      cause,
      resolution,
      additionalAnalysts: additionalAnalysts || [],
    });

    await ticket.save();
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('service', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    res.json(populatedTicket);
  } catch (err) {
    console.error('Error al agregar worklog:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Obtener servicios
router.get('/services', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    console.error('Error al obtener servicios:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

export default router;