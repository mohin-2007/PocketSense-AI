const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const FILES = {
  expenses: path.join(DATA_DIR, 'expenses.json'),
  budgets: path.join(DATA_DIR, 'budgets.json'),
  receipts: path.join(DATA_DIR, 'receipts.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  goals: path.join(DATA_DIR, 'goals.json'),
  health: path.join(DATA_DIR, 'health.json')
};

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Read data from a specific JSON file collection.
 * @param {string} collection - 'expenses' | 'budgets' | 'receipts' | 'settings' | 'goals'
 * @returns {any} Parse object or array.
 */
function read(collection) {
  ensureDirs();
  const filePath = FILES[collection];
  if (!filePath) {
    throw new Error(`Invalid database collection: ${collection}`);
  }

  try {
    if (!fs.existsSync(filePath)) {
      const defaultContent = ['budgets', 'settings', 'health'].includes(collection) ? '{}' : '[]';
      fs.writeFileSync(filePath, defaultContent, 'utf8');
      return JSON.parse(defaultContent);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || (['budgets', 'settings', 'health'].includes(collection) ? '{}' : '[]'));
  } catch (error) {
    console.error(`DB read error for ${collection}:`, error);
    return ['budgets', 'settings', 'health'].includes(collection) ? {} : [];
  }
}

/**
 * Write data to a specific JSON file collection.
 * @param {string} collection - 'expenses' | 'budgets' | 'receipts' | 'settings' | 'goals'
 * @param {any} data - Object or array.
 */
function write(collection, data) {
  ensureDirs();
  const filePath = FILES[collection];
  if (!filePath) {
    throw new Error(`Invalid database collection: ${collection}`);
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`DB write error for ${collection}:`, error);
    return false;
  }
}

/**
 * Backs up all database files to data/backups/ directory.
 * @returns {Array<string>} List of successfully backed up files.
 */
function backup() {
  ensureDirs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backedUpFiles = [];

  for (const [key, filePath] of Object.entries(FILES)) {
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(BACKUP_DIR, `${timestamp}_${key}.json`);
      try {
        fs.copyFileSync(filePath, backupPath);
        backedUpFiles.push(backupPath);
      } catch (err) {
        console.error(`Backup failed for ${key}:`, err);
      }
    }
  }

  // Update settings with last backup time
  const settings = read('settings');
  settings.lastBackupTime = new Date().toISOString();
  write('settings', settings);

  return backedUpFiles;
}

module.exports = {
  read,
  write,
  backup
};