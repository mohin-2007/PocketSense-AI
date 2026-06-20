const db = require('./db');

const DEFAULT_HEALTH = {
  aiStatus: 'Online', // 'Online' | 'Degraded' | 'Offline Fallback'
  demoMode: false,
  agents: {
    'Router Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Expense Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Budget Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Forecast Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Risk Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Goal Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Receipt Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'Advisor Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
    'CFO Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 }
  },
  mcpToolHistory: []
};

function getHealth() {
  let health;
  try {
    health = db.read('health');
  } catch (e) {
    health = {};
  }

  const aiStatus = health.aiStatus || DEFAULT_HEALTH.aiStatus;
  const demoMode = typeof health.demoMode === 'boolean' ? health.demoMode : DEFAULT_HEALTH.demoMode;
  
  // deep merge agents
  const agents = {};
  Object.keys(DEFAULT_HEALTH.agents).forEach(key => {
    agents[key] = {
      ...DEFAULT_HEALTH.agents[key],
      ...(health.agents ? health.agents[key] : {})
    };
  });

  const mcpToolHistory = health.mcpToolHistory || [];

  // Compute live statistics for the 12 platform tools
  const toolsStats = {};
  const toolNames = [
    'addExpense', 'updateExpense', 'deleteExpense', 'getExpenses',
    'setBudget', 'getBudget', 'generateInsights', 'forecastSpending',
    'analyzeRisk', 'createGoal', 'getGoals', 'scanReceipt'
  ];

  toolNames.forEach(name => {
    const history = mcpToolHistory.filter(h => h.tool === name);
    const total = history.length;
    const success = history.filter(h => h.status === 'Success').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
    
    const sumDuration = history.reduce((sum, h) => sum + h.duration, 0);
    const avgResponseTime = total > 0 ? Math.round(sumDuration / total) : 0;
    const lastExec = total > 0 ? history[0].timestamp : 'Never';

    toolsStats[name] = {
      name,
      totalCount: total,
      successRate,
      avgResponseTime,
      lastExecution: lastExec
    };
  });

  const validationError = health.validationError || null;

  return {
    aiStatus,
    demoMode,
    validationError,
    agents,
    mcpToolHistory,
    toolsStats
  };
}

function saveHealth(health) {
  try {
    db.write('health', health);
  } catch (e) {
    console.error('Error writing health logs:', e);
  }
}

function toggleDemoMode(enabled) {
  const health = getHealth();
  health.demoMode = !!enabled;
  if (health.demoMode) {
    health.aiStatus = 'Offline Fallback';
  } else {
    health.aiStatus = 'Online';
  }
  saveHealth(health);
  return getHealth();
}

function updateAgentMetric(agentName, status, responseTime, lastTool = 'None') {
  const data = getHealth();
  if (data.agents[agentName]) {
    data.agents[agentName].status = status;
    data.agents[agentName].lastExecution = new Date().toISOString();
    data.agents[agentName].responseTime = Math.round(responseTime);
    data.agents[agentName].lastTool = lastTool;
  }

  // Update global AI status based on health
  if (data.demoMode) {
    data.aiStatus = 'Offline Fallback';
  } else {
    const agentList = Object.values(data.agents);
    const failed = agentList.filter(a => a.status === 'Offline Fallback' || a.status === 'Failed').length;
    if (failed === agentList.length) {
      data.aiStatus = 'Offline Fallback';
    } else if (failed > 0) {
      data.aiStatus = 'Degraded';
    } else {
      data.aiStatus = 'Online';
    }
  }

  saveHealth({
    aiStatus: data.aiStatus,
    demoMode: data.demoMode,
    agents: data.agents,
    mcpToolHistory: data.mcpToolHistory
  });
}

function logMcpExecution(toolName, params, status, duration, error = null) {
  const data = getHealth();
  const logEntry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    params: params ? JSON.stringify(params) : '{}',
    status: status, // 'Success' | 'Failed'
    duration: Math.round(duration),
    error: error || undefined
  };
  data.mcpToolHistory.unshift(logEntry);
  if (data.mcpToolHistory.length > 50) {
    data.mcpToolHistory.pop();
  }

  saveHealth({
    aiStatus: data.aiStatus,
    demoMode: data.demoMode,
    agents: data.agents,
    mcpToolHistory: data.mcpToolHistory
  });
}

module.exports = {
  getHealth,
  toggleDemoMode,
  updateAgentMetric,
  logMcpExecution
};

let lastCheckTime = 0;
async function runAiConnectivityCheck(force = false) {
  const now = Date.now();
  if (!force && (now - lastCheckTime < 2 * 60 * 1000)) {
    // Cache for 2 minutes unless forced
    return;
  }
  lastCheckTime = now;

  const db = require('./db');
  const health = db.read('health');
  
  // Initialize agents if not exists
  if (!health.agents) {
    health.agents = {
      'Router Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Expense Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Budget Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Forecast Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Risk Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Goal Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Receipt Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'Advisor Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 },
      'CFO Agent': { status: 'Healthy', lastExecution: 'Never', lastTool: 'None', responseTime: 0 }
    };
  }

  if (health.demoMode) {
    health.aiStatus = 'Offline Fallback';
    health.validationError = null;
    db.write('health', health);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MOCK_KEY' || apiKey.startsWith('your_gemini')) {
    health.aiStatus = 'Offline Fallback';
    health.validationError = 'Gemini API key is missing or invalid.';
    db.write('health', health);
    return;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Test: connectivity, model availability, and response generation
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 3s')), 3000)
    );
    const callPromise = model.generateContent('ping');
    const result = await Promise.race([callPromise, timeoutPromise]);
    const text = result.response.text();
    
    if (text) {
      health.aiStatus = 'Online';
      health.validationError = null;
    } else {
      throw new Error('Received empty response from Gemini API.');
    }
  } catch (error) {
    console.error('[AI HEALTH CHECK] Startup check connectivity failed:', error.message);
    if (error.message.includes('429') || error.message.includes('Quota') || error.message.includes('limit')) {
      health.aiStatus = 'Degraded';
      health.validationError = 'Gemini API key rate limits / quota exceeded.';
    } else {
      health.aiStatus = 'Offline Fallback';
      health.validationError = 'Gemini API key is missing or invalid.';
    }
  }

  db.write('health', health);
}

// Run connectivity check on startup asynchronously
setTimeout(() => {
  runAiConnectivityCheck().catch(err => console.error('AI startup check failed:', err));
}, 100);

module.exports = {
  getHealth,
  toggleDemoMode,
  updateAgentMetric,
  logMcpExecution,
  runAiConnectivityCheck
};
