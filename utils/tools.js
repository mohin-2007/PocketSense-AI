const storage = require('./storage');
const gemini = require('./gemini');

/**
 * Tool: addExpense
 */
async function addExpense({ amount, category, note, created_at }) {
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Valid expense amount is required.');
  }
  const logged = storage.addExpense(amount, category, note, created_at);
  return {
    success: true,
    message: `Logged expense of ₹${amount} under ${category}.`,
    data: logged
  };
}

/**
 * Tool: updateExpense
 */
async function updateExpense({ id, updates }) {
  if (!id) {
    throw new Error('Expense ID is required.');
  }
  const updated = storage.updateExpense(id, updates);
  if (!updated) {
    throw new Error(`Expense with ID ${id} not found.`);
  }
  return {
    success: true,
    message: `Updated expense ID ${id}.`,
    data: updated
  };
}

/**
 * Tool: deleteExpense
 */
async function deleteExpense({ id }) {
  if (!id) {
    throw new Error('Expense ID is required.');
  }
  const deleted = storage.deleteExpense(id);
  if (!deleted) {
    throw new Error(`Expense with ID ${id} not found.`);
  }
  return {
    success: true,
    message: `Deleted expense ID ${id}.`
  };
}

/**
 * Tool: getExpenses
 */
async function getExpenses({ page = 1, limit = 10, category = 'all', search = '' } = {}) {
  let list = storage.getExpenses();

  if (category && category !== 'all') {
    list = list.filter(e => e.category === category);
  }

  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(e => e.note.toLowerCase().includes(q));
  }

  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const paginatedList = list.slice(startIndex, startIndex + limit);

  return {
    success: true,
    data: {
      expenses: paginatedList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages
      }
    }
  };
}

/**
 * Tool: setBudget
 */
async function setBudget({ globalLimit, categories }) {
  if (!globalLimit || isNaN(globalLimit) || globalLimit <= 0) {
    throw new Error('Valid globalLimit is required.');
  }
  const budget = storage.setBudget(globalLimit, categories);
  return {
    success: true,
    message: `Budget limits constraints applied.`,
    data: budget
  };
}

/**
 * Tool: getBudget
 */
async function getBudget() {
  const budgetLimits = storage.getBudgets();
  const expenses = storage.getExpenses();

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category spent
  const categorySpent = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categorySpent[cat] = (categorySpent[cat] || 0) + Number(e.amount);
  });

  const globalLimit = budgetLimits.globalLimit || 0;
  const remaining = globalLimit - totalSpent;
  const remainingPercentage = globalLimit > 0 ? ((globalLimit - totalSpent) / globalLimit) * 100 : 0;
  const utilizationPercent = globalLimit > 0 ? (totalSpent / globalLimit) * 100 : 0;

  // Category breakdowns
  const categoryBreakdown = {};
  Object.keys(budgetLimits.categories || {}).forEach(cat => {
    const catLimit = budgetLimits.categories[cat] || 0;
    const catSpent = categorySpent[cat] || 0;
    categoryBreakdown[cat] = {
      limit: catLimit,
      spent: catSpent,
      remaining: catLimit - catSpent,
      utilization: catLimit > 0 ? (catSpent / catLimit) * 100 : 0
    };
  });

  return {
    success: true,
    data: {
      budget: globalLimit,
      spent: totalSpent,
      remaining,
      remainingPercentage,
      utilizationPercent,
      categoryLimits: budgetLimits.categories,
      categoryBreakdown
    }
  };
}

/**
 * Tool: getSummary
 */
async function getSummary({ timeframe = 'monthly' } = {}) {
  const expenses = storage.getExpenses();
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const categories = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categories[cat] = (categories[cat] || 0) + Number(e.amount);
  });

  const percentages = {};
  for (const cat in categories) {
    percentages[cat] = totalSpent > 0 ? Number(((categories[cat] / totalSpent) * 100).toFixed(1)) : 0;
  }

  const trendsMap = {};
  expenses.forEach(e => {
    if (!e.created_at) return;
    const dateStr = new Date(e.created_at).toISOString().split('T')[0];
    trendsMap[dateStr] = (trendsMap[dateStr] || 0) + Number(e.amount);
  });

  const dailyTrends = Object.keys(trendsMap)
    .sort()
    .slice(-15) // latest 15 days
    .map(date => ({
      date,
      amount: trendsMap[date]
    }));

  const textSummary = await gemini.generateSpendingSummary(expenses, timeframe);

  return {
    success: true,
    data: {
      totalSpent,
      categories,
      percentages,
      dailyTrends,
      textSummary
    }
  };
}

/**
 * Tool: scanReceipt (Vision 2.0 OCR)
 */
async function scanReceipt({ image, mimeType }) {
  if (!image) {
    throw new Error('Image base64 data is required.');
  }

  const extracted = await gemini.analyzeReceipt2_0(image, mimeType);
  
  // Log expense
  const note = `${extracted.merchant} (${extracted.lineItems.map(i => i.name).slice(0, 3).join(', ')})`;
  const logged = storage.addExpense(extracted.amount, extracted.category, note);

  // Save to receipts log
  storage.saveReceipt(extracted.merchant, extracted.amount, extracted.category, extracted.lineItems.map(i => `${i.name}: ₹${i.price}`).join(', '));

  return {
    success: true,
    message: `Logged vision parsed receipt (Confidence: ${extracted.confidence}%).`,
    data: {
      id: logged.id,
      merchant: extracted.merchant,
      amount: extracted.amount,
      category: extracted.category,
      tax: extracted.tax || 0,
      confidence: extracted.confidence,
      items: extracted.lineItems,
      created_at: logged.created_at
    }
  };
}

/**
 * Tool: generateInsights
 */
async function generateInsights() {
  const expenses = storage.getExpenses();
  const budgetLimits = storage.getBudgets();
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = budgetLimits.globalLimit || 0;

  // Health Score calculations
  let score = 70;
  const breakdowns = [];

  if (budget > 0) {
    score += 10;
    breakdowns.push({ factor: 'Budget Active', impact: '+10', description: 'Monthly budget cap defined.' });
    
    const ratio = totalSpent / budget;
    if (ratio <= 0.5) {
      score += 20;
      breakdowns.push({ factor: 'Low Budget Velocity', impact: '+20', description: 'Spending velocity is well below caps.' });
    } else if (ratio <= 0.85) {
      score += 10;
      breakdowns.push({ factor: 'Safe Spending Rate', impact: '+10', description: 'Spending velocity is in active safe bounds.' });
    } else if (ratio <= 1.0) {
      score -= 5;
      breakdowns.push({ factor: 'High Spent Velocity', impact: '-5', description: 'Spent is near the monthly limit.' });
    } else {
      score -= 25;
      breakdowns.push({ factor: 'Budget Exceeded', impact: '-25', description: 'Your spending has overrun the monthly budget limit.' });
    }
  } else {
    score -= 10;
    breakdowns.push({ factor: 'No Budget set', impact: '-10', description: 'Create spending limits to build savings discipline.' });
  }

  // Discretionary ratio
  let discretionary = 0;
  expenses.forEach(e => {
    const amt = Number(e.amount) || 0;
    const cat = (e.category || 'Other').toLowerCase();
    if (!['bills', 'transport', 'health', 'education'].includes(cat)) {
      discretionary += amt;
    }
  });

  if (totalSpent > 0) {
    const discRatio = discretionary / totalSpent;
    if (discRatio > 0.7) {
      score -= 15;
      breakdowns.push({ factor: 'High Discretionary Spending', impact: '-15', description: 'Discretionary lifestyle outlays exceed 70% of outlays.' });
    } else if (discRatio <= 0.4) {
      score += 10;
      breakdowns.push({ factor: 'Controlled Discretionary Spending', impact: '+10', description: 'Lifestyle outlays are well managed.' });
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));

  // Get AI insights tips
  const tips = await gemini.generateInsights(expenses, {
    budget,
    spent: totalSpent,
    remaining: budget - totalSpent
  });

  return {
    success: true,
    data: {
      score: finalScore,
      breakdown: breakdowns,
      tips
    }
  };
}

/**
 * Tool: forecastSpending (Predictive Analytics)
 */
async function forecastSpending() {
  const expenses = storage.getExpenses();
  const budgetLimits = storage.getBudgets();
  const globalLimit = budgetLimits.globalLimit || 25000;

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Spending velocity calculation (based on date span)
  let velocityPerDay = 300; // default
  if (expenses.length >= 2) {
    const newest = new Date(expenses[0].created_at);
    const oldest = new Date(expenses[expenses.length - 1].created_at);
    const daysDiff = Math.max(1, Math.round((newest - oldest) / (24 * 60 * 60 * 1000)));
    velocityPerDay = totalSpent / daysDiff;
  }

  const today = new Date();
  const currentMonthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const remainingDays = currentMonthDays - currentDay;

  // Month-end spending estimation
  const forecastedMonthEndSpent = totalSpent + (velocityPerDay * remainingDays);

  // Exhaustion date calculation
  let budgetExhaustionDate = null;
  const remainingBudget = globalLimit - totalSpent;
  
  if (velocityPerDay > 0 && remainingBudget > 0) {
    const daysToExhaust = remainingBudget / velocityPerDay;
    const exhaust = new Date();
    exhaust.setDate(today.getDate() + Math.round(daysToExhaust));
    budgetExhaustionDate = exhaust.toISOString().split('T')[0];
  } else if (remainingBudget <= 0) {
    budgetExhaustionDate = 'Already Exhausted';
  }

  return {
    success: true,
    data: {
      velocityPerDay: Math.round(velocityPerDay),
      forecastedMonthEndSpent: Math.round(forecastedMonthEndSpent),
      budgetExhaustionDate,
      timeframe: 'monthly',
      estimatedQuarterlySpent: Math.round(forecastedMonthEndSpent * 3)
    }
  };
}

/**
 * Tool: analyzeRisk (Risk Analysis Agent)
 */
async function analyzeRisk() {
  const expenses = storage.getExpenses();
  const budgetLimits = storage.getBudgets();
  const globalLimit = budgetLimits.globalLimit || 25000;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const alerts = [];

  // 1. Check global limit overrun
  const ratio = totalSpent / globalLimit;
  if (ratio >= 1.0) {
    alerts.push({
      severity: 'Critical',
      factor: 'Global Limit Overrun',
      message: `You have exceeded your total monthly budget limit by ₹${totalSpent - globalLimit}!`
    });
  } else if (ratio >= 0.8) {
    alerts.push({
      severity: 'Warning',
      factor: 'High Budget Consumption',
      message: `You have consumed ${Math.round(ratio * 100)}% of your global monthly budget.`
    });
  }

  // 2. Check category limits overrides
  const categorySpent = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categorySpent[cat] = (categorySpent[cat] || 0) + Number(e.amount);
  });

  Object.keys(budgetLimits.categories || {}).forEach(cat => {
    const catLimit = budgetLimits.categories[cat] || 0;
    const catSpent = categorySpent[cat] || 0;
    if (catLimit > 0) {
      const catRatio = catSpent / catLimit;
      if (catRatio >= 1.0) {
        alerts.push({
          severity: 'Critical',
          factor: `Category ${cat} Overrun`,
          message: `Your spending on ${cat} (₹${catSpent}) has exceeded its limit of ₹${catLimit}!`
        });
      } else if (catRatio >= 0.8) {
        alerts.push({
          severity: 'Warning',
          factor: `High Category ${cat} spent`,
          message: `Category ${cat} is at ${Math.round(catRatio * 100)}% of its limit cap.`
        });
      }
    }
  });

  // 3. Spiking transaction alert (if any single expense is > 20% of global budget)
  expenses.forEach(e => {
    if (Number(e.amount) > (globalLimit * 0.2)) {
      alerts.push({
        severity: 'Info',
        factor: 'High Outlay Spikes',
        message: `Single transaction "${e.note}" (₹${e.amount}) consumed more than 20% of your global budget limit.`
      });
    }
  });

  return {
    success: true,
    data: {
      riskLevel: alerts.filter(a => a.severity === 'Critical').length > 0 ? 'Critical' : alerts.length > 0 ? 'Warning' : 'Low',
      alertsCount: alerts.length,
      alerts
    }
  };
}

/**
 * Tool: createGoal (Goal Planning Agent)
 */
async function createGoal({ title, targetAmount, currentAmount = 0, targetDate }) {
  if (!title) {
    throw new Error('Goal title is required.');
  }
  if (!targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
    throw new Error('Valid goal targetAmount is required.');
  }

  const added = storage.addGoal(title, targetAmount, currentAmount, targetDate);

  // Use forecasting engine to calculate success probability based on savings capacity
  const expenses = storage.getExpenses();
  const budgetLimits = storage.getBudgets();
  const globalLimit = budgetLimits.globalLimit || 25000;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // estimate monthly saving margins
  const monthlySavingsCapacity = Math.max(1000, globalLimit - (totalSpent || 15000));
  const remainingToSave = Number(targetAmount) - Number(currentAmount);

  // calculate expected months to finish
  const monthsToSave = remainingToSave / monthlySavingsCapacity;
  const today = new Date();
  const completionDate = new Date();
  completionDate.setMonth(today.getMonth() + Math.ceil(monthsToSave));

  const targetDeadline = new Date(added.targetDate);
  const diffTime = targetDeadline - today;
  const targetMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4);

  // calculate success probability percentage (0-100)
  let probability = 50;
  if (targetMonths > 0) {
    const ratio = targetMonths / monthsToSave;
    probability = Math.min(100, Math.max(10, Math.round(ratio * 75)));
  }

  const updated = storage.updateGoal(added.id, {
    predictedCompletionDate: completionDate.toISOString(),
    successProbability: probability
  });

  return {
    success: true,
    message: `Created goal "${title}". Estimated Completion: ${completionDate.toLocaleDateString()}.`,
    data: updated
  };
}

// Extra goal manager tools (registered for REST routing fallback)
function getGoals() {
  const list = storage.getGoals();
  return {
    success: true,
    data: list
  };
}

function deleteGoal({ id }) {
  if (!id) throw new Error('Goal ID is required.');
  const success = storage.deleteGoal(id);
  return { success };
}

const health = require('./health');

async function runToolWithRetry(toolName, fn, args) {
  const maxRetries = 2;
  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= maxRetries) {
    try {
      const result = await fn(args);
      const duration = Date.now() - startTime;
      health.logMcpExecution(toolName, args, 'Success', duration);
      return result;
    } catch (error) {
      attempt++;
      console.error(`[MCP Tool Error] ${toolName} attempt ${attempt} failed: ${error.message}`);
      if (attempt > maxRetries) {
        const duration = Date.now() - startTime;
        health.logMcpExecution(toolName, args, 'Failed', duration, error.message);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

module.exports = {
  addExpense: (args) => runToolWithRetry('addExpense', addExpense, args),
  updateExpense: (args) => runToolWithRetry('updateExpense', updateExpense, args),
  deleteExpense: (args) => runToolWithRetry('deleteExpense', deleteExpense, args),
  getExpenses: (args) => runToolWithRetry('getExpenses', getExpenses, args),
  setBudget: (args) => runToolWithRetry('setBudget', setBudget, args),
  getBudget: (args) => runToolWithRetry('getBudget', getBudget, args),
  getSummary: (args) => runToolWithRetry('getSummary', getSummary, args),
  scanReceipt: (args) => runToolWithRetry('scanReceipt', scanReceipt, args),
  generateInsights: (args) => runToolWithRetry('generateInsights', generateInsights, args),
  forecastSpending: (args) => runToolWithRetry('forecastSpending', forecastSpending, args),
  analyzeRisk: (args) => runToolWithRetry('analyzeRisk', analyzeRisk, args),
  createGoal: (args) => runToolWithRetry('createGoal', createGoal, args),
  getGoals: (args) => runToolWithRetry('getGoals', getGoals, args),
  deleteGoal: (args) => runToolWithRetry('deleteGoal', deleteGoal, args)
};