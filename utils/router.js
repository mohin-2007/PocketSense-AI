const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

/**
 * Route user query to appropriate specialized sub-agent.
 * @param {string} message - User chat message.
 * @returns {Promise<{agent: string, confidence: number, reasoning: string}>}
 */
async function routeQuery(message) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MOCK_KEY' || apiKey.startsWith('your_gemini')) {
      throw new Error('Gemini API key is missing or invalid.');
    }

    const systemPrompt = `
You are the Router Agent for PocketSense AI, an intelligent multi-agent personal finance assistant.
Your job is to analyze the user's query and classify it into one of the specialized agents:

Agents and Categories:
1. "expense": Logging expenses, tracking transactions, deleting/editing, adding purchases.
   - Examples: "I spent 300 on groceries", "Record 1500 for petrol", "Delete my last transaction", "Update transaction 1"
2. "budget": Creating budgets, checking remaining budget, category-wise budgets, budget recommendations.
   - Examples: "Set food budget to 5000", "What's my budget limit?", "Recommend a category budget breakdown", "Check budget status"
3. "summary": Compiling spending breakdowns, category percentages, weekly/monthly spending reports, showing trends.
   - Examples: "Show summary of spending", "Give me a weekly report", "Where did I spend most?", "Generate a monthly report"
4. "advisor": General financial questions, saving suggestions, pattern analysis, financial health scores.
   - Examples: "How can I save more?", "Analyze my spending patterns", "What is my financial health score?", "Give me budget planning advice"
5. "receipt": Uploading receipts, asking about receipt OCR scan features, asking how to process a receipt.
   - Examples: "Analyze my invoice", "Read this receipt", "Receipt Scanner"

Respond strictly in JSON format matching the schema.
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: message }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            agent: {
              type: 'string',
              enum: ['expense', 'budget', 'summary', 'advisor', 'receipt']
            },
            confidence: { type: 'number' },
            reasoning: { type: 'string' }
          },
          required: ['agent', 'confidence', 'reasoning']
        }
      }
    });

    return JSON.parse(result.response.text());
  } catch (err) {
    console.warn('[ROUTER RESILIENCE] Router Agent falling back to local heuristic routing:', err.message);
    const query = message.toLowerCase();
    let agent = 'advisor';
    let reasoning = 'Offline classification match: ';
    
    if (query.includes('spent') || query.includes('expense') || query.includes('outlay') || query.includes('purchase') || query.includes('buy') || query.includes('record')) {
      agent = 'expense';
      reasoning += 'detected outlay keywords';
    } else if (query.includes('budget') || query.includes('limit') || query.includes('cap')) {
      agent = 'budget';
      reasoning += 'detected budget constraints keywords';
    } else if (query.includes('summary') || query.includes('report') || query.includes('breakdown') || query.includes('trend') || query.includes('pie')) {
      agent = 'summary';
      reasoning += 'detected summary reports keywords';
    } else if (query.includes('receipt') || query.includes('invoice') || query.includes('ocr') || query.includes('scan') || query.includes('document')) {
      agent = 'receipt';
      reasoning += 'detected OCR document keywords';
    } else {
      reasoning += 'defaulted to general advisory copilot';
    }

    return {
      agent,
      confidence: 0.8,
      reasoning
    };
  }
}

module.exports = { routeQuery };
