const tools = require('../utils/tools');
const gemini = require('../utils/gemini');
const storage = require('../utils/storage');
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
  const limitCheck = helpers.rateLimiter(ip, 30, 60000); // 30 per min for complex report gen
  if (!limitCheck.success) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute.' });
  }

  const start = Date.now();
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const envCheck = helpers.validateEnv();
    const isDemo = health.getHealth().demoMode;
    if (!envCheck.success && !isDemo) {
      return res.status(500).json({ error: 'Missing Gemini configuration.' });
    }

    // 1. Gather all context
    const expenses = storage.getExpenses();
    const budgetLimits = storage.getBudgets();
    const insights = await tools.generateInsights();

    // 2. Request executive cfo report from Gemini
    const reportText = await gemini.generateCFOExecutiveReport(expenses, budgetLimits, insights.data || insights);

    const duration = Date.now() - start;
    health.updateAgentMetric('CFO Agent', 'Healthy', duration, 'generateCFOExecutiveReport');

    return res.status(200).json({
      success: true,
      reportText,
      compiledAt: new Date().toISOString(),
      metrics: {
        score: insights.data ? insights.data.score : 70,
        totalSpent: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        activeLimit: budgetLimits.globalLimit
      }
    });

  } catch (error) {
    health.updateAgentMetric('CFO Agent', 'Failed', Date.now() - start, 'None');
    return helpers.handleError(res, error);
  }
};
