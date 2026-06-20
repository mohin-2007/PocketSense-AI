const router = require('./utils/router');
const gemini = require('./utils/gemini');
const storage = require('./utils/storage');
const tools = require('./utils/tools');

console.log('=== 🧪 Running Multi-Agent & Gemini Integration Test ===\n');

async function testAgents() {
  try {
    // 1. Verify router categorization
    console.log('1. Evaluating Router Agent Classification...');
    const message = 'I spent 350 on pizza';
    const decision = await router.routeQuery(message);
    console.log(`   ✓ Query: "${message}"`);
    console.log(`   ✓ Selected Agent: ${decision.agent}`);
    console.log(`   ✓ Confidence: ${(decision.confidence * 100).toFixed(0)}%`);
    console.log(`   ✓ Rationale: "${decision.reasoning}"`);

    // 2. Verify Chaining reasoning
    console.log('\n2. Testing Multi-Agent Chaining Reasoning Flow...');
    const complexQuery = 'Can I afford a MacBook Pro in 3 months?';
    console.log(`   ✓ Complex Query: "${complexQuery}"`);

    const expenses = storage.getExpenses();
    const budgetLimits = storage.getBudgets();
    const goals = storage.getGoals();
    const settings = storage.getSettings();

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budgetStatus = {
      budget: budgetLimits.globalLimit || 25000,
      spent: totalSpent,
      remaining: (budgetLimits.globalLimit || 25000) - totalSpent
    };

    const chainRes = await gemini.chainReasoning(
      complexQuery,
      expenses,
      budgetStatus,
      goals,
      settings
    );

    console.log(`   ✓ Orchestrated reply text length: ${chainRes.reply.length} chars.`);
    console.log(`   ✓ Chained agent sequence logs:`);
    chainRes.routingChain.forEach((step, idx) => {
      console.log(`     [Step ${idx + 1}] ${step.agent} -> ${step.action}: "${step.detail}" (Tool: ${step.toolUsed})`);
    });

    console.log('\n=== Multi-Agent Integration Succeeded ===');
  } catch (err) {
    console.error('\n✗ Multi-Agent Integration Failed:', err.message);
    process.exit(1);
  }
}

testAgents();
