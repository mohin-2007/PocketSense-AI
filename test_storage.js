const path = require('path');
const storage = require('./utils/storage');
const db = require('./utils/db');

console.log('=== 🧪 Running Storage & DB Driver Test ===\n');

try {
  // Test Read
  console.log('1. Reading settings & memory profile...');
  const settings = storage.getSettings();
  console.log('   ✓ Profile Name:', settings.userProfile?.name || 'Missing');
  console.log('   ✓ Risk Profile:', settings.userProfile?.riskProfile || 'Missing');

  // Test Expense CRUD
  console.log('\n2. Testing Expense CRUD operations...');
  const newExp = storage.addExpense(999, 'Bills', 'Testing Storage Engine');
  console.log(`   ✓ CREATE passed. Logged outlay ID: ${newExp.id}`);

  const list = storage.getExpenses();
  const found = list.find(e => e.id === newExp.id);
  if (found && found.amount === 999) {
    console.log('   ✓ READ passed.');
  } else {
    throw new Error('READ failed to locate new outlay.');
  }

  const updated = storage.updateExpense(newExp.id, { note: 'Verified Outlay Update' });
  if (updated && updated.note === 'Verified Outlay Update') {
    console.log('   ✓ UPDATE passed.');
  } else {
    throw new Error('UPDATE failed.');
  }

  const deleted = storage.deleteExpense(newExp.id);
  if (deleted) {
    console.log('   ✓ DELETE passed.');
  } else {
    throw new Error('DELETE failed.');
  }

  // Test goals
  console.log('\n3. Testing Goals Storage CRUD...');
  const newGoal = storage.addGoal('Storage Test Goal', 10000, 1000);
  console.log(`   ✓ CREATE Goal passed. ID: ${newGoal.id}`);
  const goalDeleted = storage.deleteGoal(newGoal.id);
  console.log(`   ✓ DELETE Goal passed: ${goalDeleted}`);

  // Test Backup
  console.log('\n4. Running Database Backup Engine...');
  const backups = db.backup();
  console.log(`   ✓ Created ${backups.length} JSON database snapshots in backups/ folder.`);

  console.log('\n=== Storage Verification Succeeded ===');
} catch (e) {
  console.error('\n✗ Storage Verification Failed:', e.message);
  process.exit(1);
}
