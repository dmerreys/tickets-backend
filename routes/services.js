import express from 'express';
import Service from '../models/Service.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Precargar servicios
router.post('/preload', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    //servicios mesa gpf
    const services = [
      { name: 'Entrada DNS Público', category: 'Aplicaciones Administrativas', description: 'Configuración o fallo en entradas DNS públicas.', sla: { responseTime: 1, resolutionTime: 4 }, popularity: 60 },
      { name: 'Falla Descarga Orden - OMS', category: 'Aplicaciones Administrativas', description: 'Error al descargar órdenes en el sistema OMS.', sla: { responseTime: 2, resolutionTime: 6 }, popularity: 70 },
      { name: 'Fallas Acceso a Office 365', category: 'Aplicaciones Tiendas', description: 'Problemas de autenticación o acceso a Office 365 en tiendas.', sla: { responseTime: 1, resolutionTime: 2 }, popularity: 150 },
      { name: 'Fallas de Equipo', category: 'General', description: 'Fallas generales en equipos de cómputo.', sla: { responseTime: 4, resolutionTime: 12 }, popularity: 90 },
      { name: 'Fallas del Sistema', category: 'Equipos & Periféricos', description: 'Errores en sistemas operativos o software básico.', sla: { responseTime: 2, resolutionTime: 8 }, popularity: 100 },
      { name: 'Fallas Impresoras Multifunción', category: 'General', description: 'Problemas con impresoras multifuncionales.', sla: { responseTime: 2, resolutionTime: 6 }, popularity: 80 },
      { name: 'Fallas VPN', category: 'Equipos & Periféricos', description: 'Conexión VPN caída o intermitente.', sla: { responseTime: 0.5, resolutionTime: 1 }, popularity: 120 },
      { name: 'Novedades BI Publisher Enterprise', category: 'General', description: 'Actualizaciones o fallas en BI Publisher.', sla: { responseTime: 4, resolutionTime: 12 }, popularity: 40 },
      { name: 'Novedades Geo Promotion', category: 'CLA', description: 'Actualización o fallo en Geo Promotion.', sla: { responseTime: 2, resolutionTime: 6 }, popularity: 50 },
      { name: 'Novedades Impresora Etiquetas', category: 'Aplicaciones Tiendas', description: 'Fallas o configuración de impresoras de etiquetas.', sla: { responseTime: 2, resolutionTime: 4 }, popularity: 90 },
      { name: 'Novedades MOM', category: 'CLA', description: 'Actualización o fallo en MOM.', sla: { responseTime: 4, resolutionTime: 10 }, popularity: 30 },
      { name: 'Novedades Portal Administrativo', category: 'Aplicaciones Administrativas', description: 'Fallas o mejoras en el portal administrativo.', sla: { responseTime: 2, resolutionTime: 8 }, popularity: 60 },
      { name: 'Novedades RMS', category: 'CLA', description: 'Actualización o fallo en RMS.', sla: { responseTime: 4, resolutionTime: 12 }, popularity: 45 },
      { name: 'Novedades Smart BI', category: 'CLA', description: 'Fallas o mejoras en Smart BI.', sla: { responseTime: 4, resolutionTime: 10 }, popularity: 35 },
      { name: 'Novedades Wamas', category: 'CLA', description: 'Actualización o fallo en Wamas.', sla: { responseTime: 4, resolutionTime: 12 }, popularity: 25 },
      { name: 'Novedades WMS', category: 'CLA', description: 'Fallas o mejoras en WMS.', sla: { responseTime: 4, resolutionTime: 12 }, popularity: 30 },
      { name: 'Otras Fallas', category: 'CLA', description: 'Fallas no clasificadas en sistemas CLA.', sla: { responseTime: 4, resolutionTime: 12 }, popularity: 20 },
      { name: 'Paso a Pre-Producción - Cambio', category: 'Cambios', description: 'Preparación de cambios para pre-producción.', sla: { responseTime: 8, resolutionTime: 24 }, popularity: 40 },
      { name: 'Paso a Producción Emergente', category: 'Cambios', description: 'Despliegue urgente a producción.', sla: { responseTime: 2, resolutionTime: 6 }, popularity: 55 },
      { name: 'Paso a Producción Normal', category: 'Cambios', description: 'Implementación planificada de cambios.', sla: { responseTime: 8, resolutionTime: 24 }, popularity: 50 },
      { name: 'Problemas Apertura de Día - Geo', category: 'Aplicaciones Tiendas', description: 'Error al abrir el día en sistema Geo.', sla: { responseTime: 2, resolutionTime: 4 }, popularity: 85 },
      { name: 'Problemas Cierre de Día - Geopromo', category: 'Aplicaciones Tiendas', description: 'Error al cerrar el día en Geopromo.', sla: { responseTime: 2, resolutionTime: 3 }, popularity: 110 },
      { name: 'Requerimiento de Desarrollo', category: 'General', description: 'Solicitud de nueva funcionalidad.', sla: { responseTime: 24, resolutionTime: 72 }, popularity: 25 },
      { name: 'Requerimientos de Equipos de Cómputo', category: 'Equipos & Periféricos', description: 'Solicitud de nuevos equipos.', sla: { responseTime: 24, resolutionTime: 48 }, popularity: 35 },
      { name: 'Retiro Equipamiento Tecnológico', category: 'Equipos & Periféricos', description: 'Retiro de equipos obsoletos o dañados.', sla: { responseTime: 24, resolutionTime: 48 }, popularity: 30 },
      { name: 'Solicitud de Navegación - Usuarios', category: 'General', description: 'Habilitar acceso a sitios específicos.', sla: { responseTime: 8, resolutionTime: 24 }, popularity: 45 },
      { name: 'Solicitud de Reportes', category: 'Aplicaciones Administrativas', description: 'Generación de reportes personalizados.', sla: { responseTime: 4, resolutionTime: 8 }, popularity: 80 },
      { name: 'Suministro para Impresoras Multifunción', category: 'Equipos & Periféricos', description: 'Solicitud de tóner o insumos.', sla: { responseTime: 12, resolutionTime: 24 }, popularity: 65 },
    ];

    await Service.deleteMany({});
    const insertedServices = await Service.insertMany(services);
    console.log('Servicios precargados:', insertedServices.length);
    res.status(201).json(insertedServices);
  } catch (err) {
    console.error('Error al precargar servicios:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// Obtener catálogo de servicios
router.get('/', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ active: true }).sort({ popularity: -1 });
    res.json(services);
  } catch (err) {
    console.error('Error al obtener servicios:', err.message);
    res.status(500).json({ msg: 'Error en el servidor', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

export default router;