const tools = require('../utils/tools');
const helpers = require('../utils/helpers');
const health = require('../utils/health');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const body = helpers.sanitizeObject(req.body);
    const query = helpers.sanitizeObject(req.query);

    if (req.method === 'GET') {
      const { page = 1, limit = 10, category = 'all', search = '' } = query;
      const result = await tools.getExpenses({
        page: Number(page),
        limit: Number(limit),
        category,
        search
      });
      health.updateAgentMetric('Expense Agent', 'Healthy', Date.now() - start, 'getExpenses');
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { amount, category, note, created_at } = body;
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valid expense amount is required.' });
      }
      const result = await tools.addExpense({ amount, category, note, created_at });
      health.updateAgentMetric('Expense Agent', 'Healthy', Date.now() - start, 'addExpense');
      return res.status(201).json(result);
    }

    if (req.method === 'PUT') {
      const { id, updates } = body;
      if (!id || !updates) {
        return res.status(400).json({ error: 'Expense ID and updates parameters are required.' });
      }
      const result = await tools.updateExpense({ id, updates });
      health.updateAgentMetric('Expense Agent', 'Healthy', Date.now() - start, 'updateExpense');
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      const { id } = query;
      if (!id) {
        return res.status(400).json({ error: 'Expense ID parameter is required.' });
      }
      const result = await tools.deleteExpense({ id: Number(id) });
      health.updateAgentMetric('Expense Agent', 'Healthy', Date.now() - start, 'deleteExpense');
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed.' });

  } catch (error) {
    health.updateAgentMetric('Expense Agent', 'Failed', Date.now() - start, 'None');
    return helpers.handleError(res, error);
  }
};
