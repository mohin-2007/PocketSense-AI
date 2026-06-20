const storage = require('../utils/storage');
const helpers = require('../utils/helpers');

/**
 * Serverless background job to compile recurring monthly subscriptions.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const expenses = await storage.getExpenses();
    const recurringMap = new Map();
    const thresholdMs = 45 * 24 * 60 * 60 * 1000; // 45 days window

    // Simple grouping and frequency detection algorithm
    for (let i = 0; i < expenses.length; i++) {
      const current = expenses[i];
      const normalizedNote = current.note.toLowerCase().trim();
      
      if (recurringMap.has(normalizedNote)) continue;

      // Find matching items in history
      const matches = expenses.filter((e, idx) => {
        if (idx === i) return false;
        
        const timeDiff = Math.abs(new Date(current.created_at) - new Date(e.created_at));
        if (timeDiff > thresholdMs) return false;

        const amountDiff = Math.abs(e.amount - current.amount) / current.amount;
        const isAmountClose = amountDiff <= 0.05;

        const normalizedOldNote = e.note.toLowerCase().trim();
        const isNoteClose = normalizedOldNote.includes(normalizedNote) || normalizedNote.includes(normalizedOldNote);

        return isAmountClose && isNoteClose;
      });

      if (matches.length >= 1) {
        recurringMap.set(normalizedNote, {
          item: current.note,
          amount: current.amount,
          category: current.category,
          occurrences: matches.length + 1
        });
      }
    }

    const subscriptions = Array.from(recurringMap.values());
    const totalRecurringMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    return res.status(200).json({
      success: true,
      message: 'Background recurring transaction check complete.',
      timestamp: new Date().toISOString(),
      summary: {
        totalRecurringCommitment: totalRecurringMonthly,
        totalRecurringCommitmentFormatted: helpers.formatCurrency(totalRecurringMonthly),
        subscriptionCount: subscriptions.length,
        detectedSubscriptions: subscriptions
      }
    });

  } catch (error) {
    return helpers.handleError(res, error);
  }
};
