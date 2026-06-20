const db = require('./db');

// --- Expenses CRUD ---

function getExpenses() {
  const expenses = db.read('expenses');
  return expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function addExpense(amount, category, note, createdAt = null) {
  const expenses = db.read('expenses');
  const newId = expenses.length > 0 ? Math.max(...expenses.map(e => Number(e.id) || 0)) + 1 : 1;
  
  const newExpense = {
    id: newId,
    amount: Number(amount),
    category: category || 'Other',
    note: note || '',
    created_at: createdAt || new Date().toISOString()
  };

  expenses.push(newExpense);
  db.write('expenses', expenses);
  return newExpense;
}

function updateExpense(id, updates) {
  const expenses = db.read('expenses');
  const index = expenses.findIndex(e => String(e.id) === String(id));
  
  if (index === -1) {
    return null;
  }

  const updatedExpense = {
    ...expenses[index],
    ...updates,
    id: expenses[index].id,
    amount: updates.amount !== undefined ? Number(updates.amount) : expenses[index].amount,
    created_at: updates.created_at || expenses[index].created_at
  };

  expenses[index] = updatedExpense;
  db.write('expenses', expenses);
  return updatedExpense;
}

function deleteExpense(id) {
  const expenses = db.read('expenses');
  const initialLength = expenses.length;
  const filtered = expenses.filter(e => String(e.id) !== String(id));

  if (filtered.length === initialLength) {
    return false;
  }

  db.write('expenses', filtered);
  return true;
}

// --- Budgets CRUD ---

function getBudgets() {
  const budget = db.read('budgets');
  if (!budget.globalLimit) {
    budget.globalLimit = 25000;
  }
  if (!budget.categories) {
    budget.categories = {};
  }
  return budget;
}

function setBudget(globalLimit, categories = {}) {
  const budget = {
    globalLimit: Number(globalLimit),
    categories: categories || {},
    created_at: new Date().toISOString()
  };
  db.write('budgets', budget);
  return budget;
}

// --- Receipts CRUD ---

function getReceipts() {
  return db.read('receipts');
}

function saveReceipt(merchant, amount, category, items, savedAt = null) {
  const receipts = db.read('receipts');
  const newId = receipts.length > 0 ? Math.max(...receipts.map(r => Number(r.id) || 0)) + 1 : 1;

  const newReceipt = {
    id: newId,
    merchant: merchant || 'Unknown Merchant',
    amount: Number(amount),
    category: category || 'Other',
    items: items || '',
    saved_at: savedAt || new Date().toISOString()
  };

  receipts.push(newReceipt);
  db.write('receipts', receipts);
  return newReceipt;
}

// --- Goals CRUD ---

function getGoals() {
  return db.read('goals');
}

function addGoal(title, targetAmount, currentAmount = 0, targetDate = null) {
  const goals = db.read('goals');
  const newId = goals.length > 0 ? Math.max(...goals.map(g => Number(g.id) || 0)) + 1 : 1;

  const newGoal = {
    id: newId,
    title: title || 'Unnamed Goal',
    targetAmount: Number(targetAmount),
    currentAmount: Number(currentAmount),
    targetDate: targetDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // defaults to 6 months
    predictedCompletionDate: null,
    successProbability: 50
  };

  goals.push(newGoal);
  db.write('goals', goals);
  return newGoal;
}

function updateGoal(id, updates) {
  const goals = db.read('goals');
  const index = goals.findIndex(g => String(g.id) === String(id));
  if (index === -1) return null;

  const updatedGoal = {
    ...goals[index],
    ...updates,
    id: goals[index].id,
    targetAmount: updates.targetAmount !== undefined ? Number(updates.targetAmount) : goals[index].targetAmount,
    currentAmount: updates.currentAmount !== undefined ? Number(updates.currentAmount) : goals[index].currentAmount
  };

  goals[index] = updatedGoal;
  db.write('goals', goals);
  return updatedGoal;
}

function deleteGoal(id) {
  const goals = db.read('goals');
  const initialLength = goals.length;
  const filtered = goals.filter(g => String(g.id) !== String(id));
  if (filtered.length === initialLength) return false;

  db.write('goals', filtered);
  return true;
}

// --- Settings CRUD ---

function getSettings() {
  return db.read('settings');
}

function updateSettings(updates) {
  const settings = db.read('settings');
  const updated = {
    ...settings,
    ...updates
  };
  db.write('settings', updated);
  return updated;
}

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  setBudget,
  getReceipts,
  saveReceipt,
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  getSettings,
  updateSettings,
  backup: db.backup
};
