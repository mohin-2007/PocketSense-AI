const tools = require('../utils/tools');
const helpers = require('../utils/helpers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const limitCheck = helpers.rateLimiter(ip, 60, 60000);
  if (!limitCheck.success) {
    return res.status(429).json({
      jsonrpc: '2.0',
      error: { code: -32005, message: 'Rate limit exceeded. Please wait a minute.' },
      id: null
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32601, message: 'Method not allowed. Use POST.' },
      id: null
    });
  }

  const body = helpers.sanitizeObject(req.body);
  const { jsonrpc, method, params, id } = body;

  if (jsonrpc !== '2.0' || !method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid JSON-RPC request structure.' },
      id: id || null
    });
  }

  try {
    let result;
    switch (method) {
      case 'addExpense':
        result = await tools.addExpense(params || {});
        break;
      case 'updateExpense':
        result = await tools.updateExpense(params || {});
        break;
      case 'deleteExpense':
        result = await tools.deleteExpense(params || {});
        break;
      case 'getExpenses':
        result = await tools.getExpenses(params || {});
        break;
      case 'setBudget':
        result = await tools.setBudget(params || {});
        break;
      case 'getBudget':
        result = await tools.getBudget();
        break;
      case 'getSummary':
        result = await tools.getSummary(params || {});
        break;
      case 'scanReceipt':
        result = await tools.scanReceipt(params || {});
        break;
      case 'generateInsights':
        result = await tools.generateInsights();
        break;
      case 'forecastSpending':
        result = await tools.forecastSpending();
        break;
      case 'analyzeRisk':
        result = await tools.analyzeRisk();
        break;
      case 'createGoal':
        result = await tools.createGoal(params || {});
        break;
      default:
        return res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32601, message: `Tool method ${method} not found.` },
          id
        });
    }

    return res.status(200).json({
      jsonrpc: '2.0',
      result,
      id
    });

  } catch (error) {
    console.error(`MCP HTTP Execution Error (${method}):`, error);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: error.message || 'Internal tool execution error.' },
      id
    });
  }
};
