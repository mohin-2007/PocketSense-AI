const tools = require('../utils/tools');
const storage = require('../utils/storage');
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
      const result = await tools.getGoals();
      health.updateAgentMetric('Goal Agent', 'Healthy', Date.now() - start, 'getGoals');
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { title, targetAmount, currentAmount, targetDate } = body;
      if (!title || !targetAmount) {
        return res.status(400).json({ error: 'Goal title and targetAmount parameters are required.' });
      }
      const result = await tools.createGoal({ title, targetAmount, currentAmount, targetDate });
      health.updateAgentMetric('Goal Agent', 'Healthy', Date.now() - start, 'createGoal');
      return res.status(201).json(result);
    }

    if (req.method === 'PUT') {
      const { id, updates } = body;
      if (!id || !updates) {
        return res.status(400).json({ error: 'Goal ID and updates parameters are required.' });
      }
      const updated = storage.updateGoal(id, updates);
      health.updateAgentMetric('Goal Agent', 'Healthy', Date.now() - start, 'updateGoal');
      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = query;
      if (!id) {
        return res.status(400).json({ error: 'Goal ID parameter is required.' });
      }
      const result = await tools.deleteGoal({ id: Number(id) });
      health.updateAgentMetric('Goal Agent', 'Healthy', Date.now() - start, 'deleteGoal');
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed.' });

  } catch (error) {
    health.updateAgentMetric('Goal Agent', 'Failed', Date.now() - start, 'None');
    return helpers.handleError(res, error);
  }
};
