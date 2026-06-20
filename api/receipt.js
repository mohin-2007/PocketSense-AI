const tools = require('../utils/tools');
const helpers = require('../utils/helpers');
const health = require('../utils/health');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const limitCheck = helpers.rateLimiter(ip, 30, 60000); // 30 per min for file vision
  if (!limitCheck.success) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
  }

  const start = Date.now();
  try {
    const body = helpers.sanitizeObject(req.body);

    if (req.method === 'POST') {
      const { image, mimeType } = body;
      if (!image) {
        return res.status(400).json({ error: 'Base64 image string is required.' });
      }

      const result = await tools.scanReceipt({ image, mimeType });
      health.updateAgentMetric('Receipt Agent', 'Healthy', Date.now() - start, 'scanReceipt');
      return res.status(201).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed.' });

  } catch (error) {
    health.updateAgentMetric('Receipt Agent', 'Failed', Date.now() - start, 'None');
    return helpers.handleError(res, error);
  }
};
