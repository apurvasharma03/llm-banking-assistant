import { Router } from 'express';
import { AgentCoordinator } from '../agents/coordinator';

const router = Router();
const agentCoordinator = new AgentCoordinator();

// Store verification state
const verificationState = new Map<string, {
  isVerifying: boolean;
  sessionId: string;
  currentStep: 'security_question' | 'otp';
}>();

router.post('/', (req, res) => {
  const { message, customer_id, email } = req.body;
  const customers = req.app.locals.customers;
  const accounts = req.app.locals.accounts;
  const transactions = req.app.locals.transactions;

  // Find customer
  let customer = null;
  if (customer_id) {
    customer = customers.find((c: any) => c.customer_id === customer_id);
  } else if (email) {
    customer = customers.find((c: any) => c.email === email);
  }
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // Get accounts and transactions for this customer
  const customerAccounts = accounts.filter((a: any) => a.customer_id === customer.customer_id);
  const accountIds = customerAccounts.map((a: any) => a.account_id);
  const customerTransactions = transactions.filter((t: any) => accountIds.includes(t.account_id));

  // Sort transactions by date (most recent first)
  const sortedTransactions = customerTransactions.sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Generate response based on the message content
  let reply = '';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('balance') || lowerMessage.includes('account balance')) {
    const totalBalance = customerAccounts.reduce((sum: number, account: any) => sum + account.balance, 0);
    reply = `Hello ${customer.first_name}, your current account balances are:\n`;
    customerAccounts.forEach((account: any) => {
      reply += `• ${account.account_type} account: $${account.balance.toFixed(2)}\n`;
    });
    reply += `\nTotal balance: $${totalBalance.toFixed(2)}`;
  } else if (lowerMessage.includes('transaction') || lowerMessage.includes('recent')) {
    reply = `Hello ${customer.first_name}, here are your recent transactions:\n\n`;
    const recentTransactions = sortedTransactions.slice(0, 5);
    recentTransactions.forEach((txn: any) => {
      const date = new Date(txn.date).toLocaleDateString();
      const amount = txn.amount > 0 ? `+$${txn.amount.toFixed(2)}` : `-$${Math.abs(txn.amount).toFixed(2)}`;
      reply += `• ${date} - ${txn.merchant} (${txn.category}) - ${amount}\n`;
    });
    reply += `\nYou have ${customerTransactions.length} total transactions.`;
  } else if (lowerMessage.includes('fraud') || lowerMessage.includes('suspicious')) {
    const fraudulentTransactions = customerTransactions.filter((txn: any) => txn.is_fraud);
    if (fraudulentTransactions.length > 0) {
      reply = `⚠️ ALERT: ${customer.first_name}, we've detected ${fraudulentTransactions.length} suspicious transactions on your account:\n\n`;
      fraudulentTransactions.forEach((txn: any) => {
        const date = new Date(txn.date).toLocaleDateString();
        reply += `• ${date} - ${txn.merchant} - $${Math.abs(txn.amount).toFixed(2)} (FLAGGED AS FRAUD)\n`;
      });
    } else {
      reply = `Good news, ${customer.first_name}! No suspicious activity has been detected on your accounts.`;
    }
  } else if (lowerMessage.includes('account') && lowerMessage.includes('detail')) {
    reply = `Hello ${customer.first_name}, here are your account details:\n\n`;
    customerAccounts.forEach((account: any) => {
      reply += `• Account Type: ${account.account_type}\n`;
      reply += `• Balance: $${account.balance.toFixed(2)}\n`;
      reply += `• Status: ${account.status}\n`;
      reply += `• Opened: ${new Date(account.open_date).toLocaleDateString()}\n\n`;
    });
  } else {
    // Default response
    reply = `Hello ${customer.first_name}, you have ${customerAccounts.length} accounts and ${customerTransactions.length} transactions. Your latest balance is $${customerAccounts[0]?.balance.toFixed(2)}.`;
  }

  res.json({
    reply,
    customer,
    accounts: customerAccounts,
    transactions: sortedTransactions.slice(0, 5) // show last 5
  });
});

router.post('/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Message and userId are required'
      });
    }

    const response = await agentCoordinator.processUserQuery(userId, message);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Message and userId are required'
      });
    }

    const response = await agentCoordinator.processUserQuery(userId, message);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 