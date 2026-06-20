#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const tools = require('./utils/tools');

// Initialize MCP Server
const server = new Server(
  {
    name: 'pocketsense-financial-intelligence-server',
    version: '2.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'addExpense',
        description: 'Log a new expense transaction in the database.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'The expense amount spent.' },
            category: { 
              type: 'string', 
              enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'],
              description: 'Transaction category.' 
            },
            note: { type: 'string', description: 'Description details.' },
            created_at: { type: 'string', description: 'Optional ISO timestamp date.' }
          },
          required: ['amount']
        }
      },
      {
        name: 'updateExpense',
        description: 'Update properties of an existing logged expense.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Expense unique ID.' },
            updates: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                category: { type: 'string' },
                note: { type: 'string' },
                created_at: { type: 'string' }
              }
            }
          },
          required: ['id', 'updates']
        }
      },
      {
        name: 'deleteExpense',
        description: 'Delete an expense transaction by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Expense ID to remove.' }
          },
          required: ['id']
        }
      },
      {
        name: 'getExpenses',
        description: 'Query lists of logged expenses with options to search, filter, and paginate.',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            category: { type: 'string' },
            search: { type: 'string' }
          }
        }
      },
      {
        name: 'setBudget',
        description: 'Configure the monthly global budget and individual category spending caps.',
        inputSchema: {
          type: 'object',
          properties: {
            globalLimit: { type: 'number', description: 'Total monthly budget limit.' },
            categories: {
              type: 'object',
              description: 'Optional category-wise caps, e.g., {"Food": 5000, "Bills": 3000}'
            }
          },
          required: ['globalLimit']
        }
      },
      {
        name: 'getBudget',
        description: 'Retrieve the active monthly budget limits, total spent, and utilization ratios.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'getSummary',
        description: 'Generate transaction aggregates grouped by category, daily spending trends, and text reports.',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: { type: 'string', enum: ['daily', 'weekly', 'monthly'] }
          }
        }
      },
      {
        name: 'scanReceipt',
        description: 'Analyze a receipt image base64 buffer, run Vision OCR, and log the expense automatically.',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: 'Base64 image buffer.' },
            mimeType: { type: 'string', description: 'Image mime-type, e.g., "image/png" or "image/jpeg".' }
          },
          required: ['image']
        }
      },
      {
        name: 'generateInsights',
        description: 'Compile Financial Health Score and customized AI savings recommendations.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'forecastSpending',
        description: 'Run predictive velocity calculations to forecast month-end spending totals and budget exhaustion dates.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'analyzeRisk',
        description: 'Audit database outlays to flag critical overspending points and category limit overruns.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'createGoal',
        description: 'Establish a target savings goal and compute estimated completion dates based on current velocity.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Goal name.' },
            targetAmount: { type: 'number', description: 'Target amount in currency.' },
            currentAmount: { type: 'number', description: 'Amount already saved.' },
            targetDate: { type: 'string', description: 'Target deadline date.' }
          },
          required: ['title', 'targetAmount']
        }
      }
    ]
  };
});

// Handle request executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    switch (name) {
      case 'addExpense':
        result = await tools.addExpense(args);
        break;
      case 'updateExpense':
        result = await tools.updateExpense(args);
        break;
      case 'deleteExpense':
        result = await tools.deleteExpense(args);
        break;
      case 'getExpenses':
        result = await tools.getExpenses(args);
        break;
      case 'setBudget':
        result = await tools.setBudget(args);
        break;
      case 'getBudget':
        result = await tools.getBudget();
        break;
      case 'getSummary':
        result = await tools.getSummary(args);
        break;
      case 'scanReceipt':
        result = await tools.scanReceipt(args);
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
        result = await tools.createGoal(args);
        break;
      default:
        throw new Error(`Tool ${name} not found.`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message}`
        }
      ]
    };
  }
});

// Run server using stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PocketSense AI Autonomous Platform MCP Server running.');
}

run().catch((error) => {
  console.error('Fatal MCP Server execution error:', error);
  process.exit(1);
});
