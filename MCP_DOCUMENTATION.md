# PocketSense AI - Model Context Protocol (MCP) Server

This project includes a fully compliant Model Context Protocol (MCP) Server. The server allows any compatible AI agent host (like Claude Desktop, Cursor, or other MCP clients) to interact directly with your local PocketSense financial databases.

---

## Exposed Tools

The server registers 9 financial tools:

| Tool Name | Parameters | Description |
|---|---|---|
| `getExpenses` | `{ page, limit, category, search }` | Fetch transaction logs with pagination and filters. |
| `addExpense` | `{ amount, category, note, created_at }` | Log a new transaction. |
| `updateExpense` | `{ id, updates }` | Edit fields of an existing transaction. |
| `deleteExpense` | `{ id }` | Remove a transaction from the database. |
| `getBudget` | *none* | Fetch budget limits, total spent, and remaining balances. |
| `setBudget` | `{ globalLimit, categories }` | Configure global caps and category breakdowns. |
| `getSummary` | `{ timeframe }` | Compile aggregates and request a text breakdown from Gemini. |
| `getInsights` | *none* | Get the Financial Health Score and customized tips. |
| `scanReceipt` | `{ image, mimeType }` | Process a base64 receipt image using OCR. |

---

## Client Configurations

### 1. Claude Desktop Integration
To let Claude Desktop use your PocketSense databases:
1. Open your Claude Desktop configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add this server block:
   ```json
   {
     "mcpServers": {
       "pocketsense-ai": {
         "command": "node",
         "args": ["c:/Users/hp/OneDrive/Desktop/pocketsense-ai capstoneproject/mcp-server.js"],
         "env": {
           "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE"
         }
       }
     }
   }
   ```
3. Restart Claude Desktop. You will see a plug icon showing the pocketsense tools are linked!

### 2. Cursor Integration
To use the tools in Cursor editor:
1. Go to **Settings** > **Features** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill details:
   - **Name**: PocketSense AI
   - **Type**: `stdio`
   - **Command**: `node "c:/Users/hp/OneDrive/Desktop/pocketsense-ai capstoneproject/mcp-server.js"`
4. Save and ensure the status circle turns green.
