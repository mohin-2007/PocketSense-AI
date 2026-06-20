const fs = require('fs');
const path = require('path');

// Ensure dotenv is loaded
require('dotenv').config();

const endpoints = [
  { name: 'advisor', file: './api/advisor.js', method: 'GET' },
  { name: 'agent', file: './api/agent.js', method: 'POST', body: { message: 'Can I afford a laptop next month?' } },
  { name: 'budget_get', file: './api/budget.js', method: 'GET' },
  { name: 'budget_post', file: './api/budget.js', method: 'POST', body: { globalLimit: 30000, categories: { Food: 6000 } } },
  { name: 'cfo', file: './api/cfo.js', method: 'GET' },
  { name: 'expense_get', file: './api/expense.js', method: 'GET', query: { page: 1, limit: 2 } },
  { name: 'expense_post', file: './api/expense.js', method: 'POST', body: { amount: 120, category: 'Food', note: 'Tea' } },
  { name: 'forecast', file: './api/forecast.js', method: 'GET' },
  { name: 'goal_get', file: './api/goal.js', method: 'GET' },
  { name: 'goal_post', file: './api/goal.js', method: 'POST', body: { title: 'Audit Savings Goal', targetAmount: 20000, targetDate: '2026-12-31' } },
  { name: 'mcp', file: './api/mcp.js', method: 'POST', body: { jsonrpc: '2.0', method: 'getBudget', params: {}, id: 1 } },
  { name: 'receipt_post', file: './api/receipt.js', method: 'POST', body: { image: 'data:image/jpeg;base64,L21vY2s=', mimeType: 'image/jpeg' } },
  { name: 'risk', file: './api/risk.js', method: 'GET' },
  { name: 'summary', file: './api/summary.js', method: 'GET' }
];

function mockResponse() {
  const res = {
    headers: {},
    statusCode: 200,
    bodyData: null,
    ended: false,
    setHeader: function(name, val) {
      this.headers[name] = val;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.bodyData = data;
      this.ended = true;
      return this;
    },
    end: function() {
      this.ended = true;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('=== 🚀 Starting Endpoint Execution Audit ===\n');
  const results = [];

  for (const ep of endpoints) {
    const filePath = path.resolve(__dirname, ep.file);
    if (!fs.existsSync(filePath)) {
      results.push({ name: ep.name, status: 'FAIL', reason: `File not found at ${filePath}`, fix: 'Verify file location' });
      continue;
    }

    try {
      const handler = require(filePath);
      
      const req = {
        method: ep.method,
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
        body: ep.body || {},
        query: ep.query || {}
      };

      const res = mockResponse();

      await handler(req, res);

      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      if (isSuccess) {
        results.push({
          name: ep.name,
          status: 'PASS',
          statusCode: res.statusCode,
          reason: 'Endpoint executed successfully and returned 2xx'
        });
      } else {
        results.push({
          name: ep.name,
          status: 'FAIL',
          statusCode: res.statusCode,
          reason: `Returned status code ${res.statusCode}. Body: ${JSON.stringify(res.bodyData)}`,
          fix: 'Inspect endpoint internal handler logic'
        });
      }
    } catch (e) {
      results.push({
        name: ep.name,
        status: 'FAIL',
        reason: `Thrown exception: ${e.message}`,
        fix: 'Fix handler implementation and dependency imports'
      });
    }
  }

  console.table(results);
  
  // Cleanup test goal if created
  try {
    const storage = require('./utils/storage');
    const goals = storage.getGoals();
    const auditGoal = goals.find(g => g.title === 'Audit Savings Goal');
    if (auditGoal) {
      storage.deleteGoal(auditGoal.id);
      console.log('\n🧹 Cleaned up goal created during audit.');
    }
    const expenses = storage.getExpenses();
    const auditExpense = expenses.find(e => e.note === 'Tea' && e.amount === 120);
    if (auditExpense) {
      storage.deleteExpense(auditExpense.id);
      console.log('🧹 Cleaned up expense created during audit.');
    }
  } catch (e) {
    console.error('Cleanup error:', e);
  }

  // Write results json file for reporting
  fs.writeFileSync(path.join(__dirname, 'endpoint_results.json'), JSON.stringify(results, null, 2));
}

runTests();
