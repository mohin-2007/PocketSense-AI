const tools = require('./utils/tools');

console.log('=== 🧪 Running MCP Tools Test ===\n');

async function runMcpTest() {
  try {
    // 1. Verify getExpenses Tool
    console.log('1. Executing getExpenses tool...');
    const expRes = await tools.getExpenses({ limit: 3 });
    if (expRes.success) {
      console.log(`   ✓ Loaded ${expRes.data.expenses.length} expenses. Pagination details:`, expRes.data.pagination);
    } else {
      throw new Error('getExpenses tool returned success=false');
    }

    // 2. Verify getBudget Tool
    console.log('\n2. Executing getBudget tool...');
    const budgetRes = await tools.getBudget();
    if (budgetRes.success) {
      console.log(`   ✓ Global limit: ₹${budgetRes.data.budget}`);
      console.log(`   ✓ Utilization percent: ${budgetRes.data.utilizationPercent.toFixed(1)}%`);
    } else {
      throw new Error('getBudget tool returned success=false');
    }

    // 3. Verify getSummary Tool
    console.log('\n3. Executing getSummary tool...');
    const summaryRes = await tools.getSummary({ timeframe: 'weekly' });
    if (summaryRes.success) {
      console.log(`   ✓ Total spent: ₹${summaryRes.data.totalSpent}`);
      console.log(`   ✓ Category percentages parsed:`, Object.keys(summaryRes.data.percentages).length, 'categories');
    } else {
      throw new Error('getSummary tool returned success=false');
    }

    // 4. Verify getInsights Tool
    console.log('\n4. Executing getInsights tool...');
    const insightsRes = await tools.generateInsights();
    if (insightsRes.success) {
      console.log(`   ✓ Health Score compiled: ${insightsRes.data.score}/100`);
      console.log(`   ✓ Action tips list count: ${insightsRes.data.tips.length}`);
    } else {
      throw new Error('getInsights tool returned success=false');
    }

    console.log('\n=== MCP Verification Succeeded ===');
  } catch (e) {
    console.error('\n✗ MCP Verification Failed:', e.message);
    process.exit(1);
  }
}

runMcpTest();
