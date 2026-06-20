const tools = require('../utils/tools');
const helpers = require('../utils/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    const query = helpers.sanitizeObject(req.query);

    if (req.method === 'GET') {
      const { timeframe = 'monthly' } = query;
      const result = await tools.getSummary({ timeframe });
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed.' });

  } catch (error) {
    return helpers.handleError(res, error);
  }
};
