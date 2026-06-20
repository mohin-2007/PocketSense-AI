const tools = require('../utils/tools');
const helpers = require('../utils/helpers');
const health = require('../utils/health');

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

  const start = Date.now();
  try {
    if (req.method === 'GET') {
      const result = await tools.forecastSpending();
      health.updateAgentMetric('Forecast Agent', 'Healthy', Date.now() - start, 'forecastSpending');
      return res.status(200).json(result);
    }
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    health.updateAgentMetric('Forecast Agent', 'Failed', Date.now() - start, 'None');
    return helpers.handleError(res, error);
  }
};
