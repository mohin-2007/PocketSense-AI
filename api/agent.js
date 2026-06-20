const tools = require('../utils/tools');
const gemini = require('../utils/gemini');
const storage = require('../utils/storage');
const helpers = require('../utils/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiter
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const limitCheck = helpers.rateLimiter(ip, 60, 60000);
  if (!limitCheck.success) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = helpers.sanitizeObject(req.body);
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const envCheck = helpers.validateEnv();
    if (!envCheck.success) {
      return res.status(200).json({
        reply: 'The Gemini API Key environment variable is missing. Set GEMINI_API_KEY to start Vibe Coding!',
        agentSelected: 'Router Agent',
        thinking: 'Checked environmental variables.',
        toolUsed: 'validateEnv',
        routingChain: [
          { agent: 'Router Agent', action: 'Configuration check', detail: 'Missing GEMINI_API_KEY.', toolUsed: 'None' }
        ],
        success: false
      });
    }

    // 1. Gather all context for persistent memory
    const expenses = storage.getExpenses();
    const budgetLimits = storage.getBudgets();
    const goals = storage.getGoals();
    const settings = storage.getSettings();

    // Compute budget spent status
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budgetStatus = {
      budget: budgetLimits.globalLimit || 0,
      spent: totalSpent,
      remaining: (budgetLimits.globalLimit || 0) - totalSpent
    };

    // 2. Run the Multi-Agent Chain reasoning flow
    const chainOutput = await gemini.chainReasoning(
      message, 
      expenses, 
      budgetStatus, 
      goals, 
      settings
    );

    // Identify final active details
    const lastChainNode = chainOutput.routingChain[chainOutput.routingChain.length - 1] || { agent: 'Financial Advisor Agent', action: 'Answering query', toolUsed: 'None' };

    return res.status(200).json({
      reply: chainOutput.reply,
      agentSelected: lastChainNode.agent,
      thinking: lastChainNode.action + ': ' + lastChainNode.detail,
      toolUsed: lastChainNode.toolUsed,
      routingChain: chainOutput.routingChain,
      success: true
    });

  } catch (error) {
    console.error('Agent Orchestrator Error:', error);
    return res.status(500).json({
      reply: 'Failed to process AI agents coordination: ' + error.message,
      agentSelected: 'Router Agent',
      thinking: 'Encountered exception.',
      toolUsed: 'None',
      routingChain: [
        { agent: 'Router Agent', action: 'Failed Chaining', detail: error.message, toolUsed: 'None' }
      ],
      success: false
    });
  }
};