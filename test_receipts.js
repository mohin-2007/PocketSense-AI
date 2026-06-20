const gemini = require('./utils/gemini');

console.log('=== 🧪 Running Receipt Intelligence 2.0 Vision OCR Test ===\n');

async function testReceipts() {
  console.log('Testing Receipt Vision 2.0 interface compilation...');
  
  if (typeof gemini.analyzeReceipt2_0 === 'function') {
    console.log('   ✓ analyzeReceipt2_0 function structure verified.');
  } else {
    console.error('   ✗ analyzeReceipt2_0 is not defined in utils/gemini.js');
    process.exit(1);
  }

  // Generate a mock validation payload to test storage receipt saving
  const storage = require('./utils/storage');
  console.log('\nTesting Receipt logging to receipts database...');
  try {
    const logged = storage.saveReceipt('Verification Store', 450, 'Shopping', 'Item 1: ₹300, Item 2: ₹150');
    console.log(`   ✓ Saved receipt log ID ${logged.id} in database.`);
    
    // cleanup
    const receipts = storage.getReceipts();
    const updated = receipts.filter(r => r.id !== logged.id);
    const db = require('./utils/db');
    db.write('receipts', updated);
    console.log('   ✓ Log cleaned up.');
    
    console.log('\n=== Receipt Telemetry Succeeded ===');
  } catch (err) {
    console.error('   ✗ Receipt Storage Test Failed:', err.message);
    process.exit(1);
  }
}

testReceipts();
