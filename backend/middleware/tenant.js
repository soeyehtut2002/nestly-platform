const prisma = require('../config/db');

const tenantMiddleware = async (req, res, next) => {
  try {
    const condoId = req.headers['x-condo-id'] || req.headers['X-Condo-ID'];
    
    if (!condoId) {
      return res.status(400).json({ error: 'Condominium context header (X-Condo-ID) is missing.' });
    }

    // Verify condominium is active
    const condo = await prisma.condominium.findUnique({
      where: { id: condoId }
    });

    if (!condo) {
      return res.status(404).json({ error: 'Condominium context not found.' });
    }

    if (!condo.isActive) {
      return res.status(403).json({ error: 'Condominium is currently inactive.' });
    }

    req.condoId = condoId;
    next();
  } catch (error) {
    console.error('Tenant Context Error:', error);
    return res.status(500).json({ error: 'Internal server error processing tenant context.' });
  }
};

module.exports = tenantMiddleware;
