const health = require('../utils/health');
const helpers = require('../utils/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const limitCheck = helpers.rateLimiter(ip, 60, 60000);
  if (!limitCheck.success) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
  }

  try {
    if (req.method === 'GET') {
      if (req.query.check === 'true' || req.query.check === true) {
        await health.runAiConnectivityCheck(true);
      }
      const data = health.getHealth();
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST') {
      const body = helpers.sanitizeObject(req.body);
      const { demoMode } = body;
      
      if (typeof demoMode !== 'boolean') {
        return res.status(400).json({ error: 'demoMode parameter must be a boolean.' });
      }

      const data = health.toggleDemoMode(demoMode);
      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Method not allowed.' });

  } catch (error) {
    return helpers.handleError(res, error);
  }
};
