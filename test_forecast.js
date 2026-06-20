const tools = require('./utils/tools');

console.log('=== 🧪 Running Forecasting & Risk Audit Test ===\n');

async function testForecast() {
  try {
    // 1. Verify forecast Spending Tool
    console.log('1. Evaluating Spending Velocity Projections...');
    const foreRes = await tools.forecastSpending();
    if (foreRes.success) {
      console.log(`   ✓ Estimated Month-End Spend: ₹${foreRes.data.forecastedMonthEndSpent}`);
      console.log(`   ✓ Average Daily Velocity: ₹${foreRes.data.velocityPerDay}`);
      console.log(`   ✓ Calculated Exhaustion Date: ${foreRes.data.budgetExhaustionDate}`);
    } else {
      throw new Error('forecastSpending tool failed.');
    }

    // 2. Verify Risk Analysis Tool
    console.log('\n2. Auditing Risk Level Alerts...');
    const riskRes = await tools.analyzeRisk();
    if (riskRes.success) {
      console.log(`   ✓ Calculated Risk Status: ${riskRes.data.riskLevel}`);
      console.log(`   ✓ Active Warning Alerts logged: ${riskRes.data.alertsCount}`);
      riskRes.data.alerts.forEach((alert, idx) => {
        console.log(`     [Alert ${idx + 1}] [${alert.severity}] ${alert.factor}: "${alert.message}"`);
      });
    } else {
      throw new Error('analyzeRisk tool failed.');
    }

    console.log('\n=== Forecasting Verification Succeeded ===');
  } catch (err) {
    console.error('\n✗ Forecasting Verification Failed:', err.message);
    process.exit(1);
  }
}

testForecast();
