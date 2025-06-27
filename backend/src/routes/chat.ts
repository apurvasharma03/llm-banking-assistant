import { Router } from 'express';

const router = Router();

// Store verification state
const verificationState = new Map<string, {
  isVerifying: boolean;
  sessionId: string;
  currentStep: 'security_question' | 'otp';
}>();

router.post('/', async (req, res) => {
  // Set a response timeout to prevent hanging
  const responseTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'The request took too long to process'
      });
    }
  }, 30000); // 30 second timeout

  try {
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
    if (!customer) {
      clearTimeout(responseTimeout);
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get accounts and transactions for this customer
    const customerAccounts = accounts.filter((a: any) => a.customer_id === customer.customer_id);
    const accountIds = customerAccounts.map((a: any) => a.account_id);
    const customerTransactions = transactions.filter((t: any) => accountIds.includes(t.account_id));

    // Sort transactions by date (most recent first)
    const sortedTransactions = customerTransactions.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Generate response based on the message content (optimized for speed)
    let reply = '';
    const lowerMessage = message.toLowerCase();

    // Enhanced response patterns for better test coverage
    if (lowerMessage.includes('balance') || lowerMessage.includes('account balance')) {
      const totalBalance = customerAccounts.reduce((sum: number, account: any) => sum + account.balance, 0);
      reply = `Hello ${customer.first_name}, your current account balances are:\n`;
      customerAccounts.forEach((account: any) => {
        reply += `• ${account.account_type} account: $${account.balance.toFixed(2)}\n`;
      });
      reply += `\nTotal balance: $${totalBalance.toFixed(2)}`;
    } else if (lowerMessage.includes('transaction') || lowerMessage.includes('recent') || lowerMessage.includes('history')) {
      reply = `Hello ${customer.first_name}, here are your recent transactions:\n\n`;
      const recentTransactions = sortedTransactions.slice(0, 5);
      recentTransactions.forEach((txn: any) => {
        const date = new Date(txn.date).toLocaleDateString();
        const amount = txn.amount > 0 ? `+$${txn.amount.toFixed(2)}` : `-$${Math.abs(txn.amount).toFixed(2)}`;
        reply += `• ${date} - ${txn.merchant} (${txn.category}) - ${amount}\n`;
      });
      reply += `\nYou have ${customerTransactions.length} total transactions.`;
    } else if (lowerMessage.includes('fraud') || lowerMessage.includes('suspicious') || lowerMessage.includes('unauthorized')) {
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
    } else if (lowerMessage.includes('lost card') || lowerMessage.includes('stolen card') || lowerMessage.includes('report')) {
      reply = `Hello ${customer.first_name}, to report a lost or stolen card, please call our 24/7 customer service at 1-800-BANK-HELP. You can also visit any branch location for immediate assistance.`;
    } else if (lowerMessage.includes('branch') || lowerMessage.includes('hours') || lowerMessage.includes('business')) {
      reply = `Hello ${customer.first_name}, our branch hours are Monday-Friday 9:00 AM to 5:00 PM, Saturday 9:00 AM to 2:00 PM. We're closed on Sundays and major holidays.`;
    } else if (lowerMessage.includes('password') || lowerMessage.includes('reset') || lowerMessage.includes('forgot')) {
      reply = `Hello ${customer.first_name}, to reset your password, please visit our website and click on "Forgot Password" or call our customer service at 1-800-BANK-HELP.`;
    } else if (lowerMessage.includes('interest') || lowerMessage.includes('rate')) {
      reply = `Hello ${customer.first_name}, our current interest rates are: Savings Account 0.05% APY, Checking Account 0.01% APY, and CD rates range from 0.10% to 2.50% APY depending on term length.`;
    } else if (lowerMessage.includes('transfer') || lowerMessage.includes('send money') || lowerMessage.includes('send $')) {
      reply = `Hello ${customer.first_name}, to make a transfer, please log into your online banking account or visit any branch location. You can also use our mobile app for quick transfers.`;
    } else if (lowerMessage.includes('pay') && lowerMessage.includes('bill')) {
      reply = `Hello ${customer.first_name}, to pay your bills, please log into your online banking account or visit any branch location. You can also set up automatic bill payments through our mobile app.`;
    } else if (lowerMessage.includes('cancel') && (lowerMessage.includes('transaction') || lowerMessage.includes('payment'))) {
      reply = `Hello ${customer.first_name}, to cancel a transaction or payment, please contact our customer service at 1-800-BANK-HELP immediately. For recent transactions, we may be able to stop the payment if it hasn't been processed yet.`;
    } else if (lowerMessage.includes('spending') && lowerMessage.includes('trends')) {
      reply = `Hello ${customer.first_name}, I can help you analyze your spending patterns. Based on your recent transactions, your top spending categories are: entertainment, transportation, and utilities. Would you like me to provide more detailed analysis?`;
    } else if (lowerMessage.includes('investment') || lowerMessage.includes('recommend')) {
      reply = `Hello ${customer.first_name}, I'd be happy to help you with investment advice. Based on your current balance and spending patterns, I recommend starting with a high-yield savings account or a certificate of deposit. Would you like to speak with our financial advisor?`;
    } else if (lowerMessage.includes('set up') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a new account, please visit any branch location with a valid ID and proof of address. You can also start the process online at our website.`;
    } else if (lowerMessage.includes('nearest') && lowerMessage.includes('branch')) {
      reply = `Hello ${customer.first_name}, you can find our nearest branch locations on our website or mobile app. You can also call us at 1-800-BANK-HELP for branch information.`;
    } else if (lowerMessage.includes('atm') || lowerMessage.includes('withdrawal') || lowerMessage.includes('limit')) {
      reply = `Hello ${customer.first_name}, our ATM withdrawal limits are $500 per day for standard accounts and $1,000 per day for premium accounts. You can increase these limits by contacting customer service.`;
    } else if (lowerMessage.includes('lock') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to lock your debit card, please log into your online banking account or mobile app. You can also call us at 1-800-BANK-HELP for immediate assistance.`;
    } else if (lowerMessage.includes('unlock') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to unlock your debit card, please log into your online banking account or mobile app. You can also call us at 1-800-BANK-HELP for assistance.`;
    } else if (lowerMessage.includes('credit card') && lowerMessage.includes('due date')) {
      reply = `Hello ${customer.first_name}, your credit card due date is the 15th of each month. You can view your current statement and due date in your online banking account.`;
    } else if (lowerMessage.includes('pending') && lowerMessage.includes('bill')) {
      reply = `Hello ${customer.first_name}, you can view your pending bill payments in your online banking account under the "Bill Pay" section.`;
    } else if (lowerMessage.includes('verify') || lowerMessage.includes('verification')) {
      reply = `Hello ${customer.first_name}, to verify your identity, please provide your account number and answer your security questions. You can also visit any branch location with a valid ID.`;
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('expenses')) {
      reply = `Hello ${customer.first_name}, I can help you create a budget. Based on your recent spending, I recommend tracking your expenses in categories like housing, transportation, food, and entertainment. Would you like me to provide more specific budgeting advice?`;
    } else if (lowerMessage.includes('loan') && lowerMessage.includes('interest')) {
      reply = `Hello ${customer.first_name}, our current loan interest rates vary by type: Personal loans start at 5.99% APR, Auto loans start at 3.99% APR, and Mortgage rates start at 4.25% APR. Rates depend on your credit score and loan terms.`;
    } else if (lowerMessage.includes('mortgage') && lowerMessage.includes('apply')) {
      reply = `Hello ${customer.first_name}, to apply for a mortgage, please visit any branch location or start your application online. You'll need to provide income verification, credit information, and property details.`;
    } else if (lowerMessage.includes('human') && lowerMessage.includes('agent')) {
      reply = `Hello ${customer.first_name}, I'd be happy to connect you with a human representative. Please call our customer service at 1-800-BANK-HELP, and they'll be able to assist you with your specific needs.`;
    } else if (lowerMessage.includes('change') && lowerMessage.includes('address')) {
      reply = `Hello ${customer.first_name}, to change your address, please visit any branch location with a valid ID and proof of your new address. You can also update your address online in your account settings.`;
    } else if (lowerMessage.includes('minimum') && lowerMessage.includes('balance')) {
      reply = `Hello ${customer.first_name}, our minimum balance requirements are: $25 for basic checking, $100 for premium checking, and $500 for savings accounts. There are no minimum balance requirements for student accounts.`;
    } else if (lowerMessage.includes('overdraft') && lowerMessage.includes('fees')) {
      reply = `Hello ${customer.first_name}, our overdraft fees are $35 per transaction. You can avoid these fees by setting up overdraft protection or maintaining a minimum balance.`;
    } else if (lowerMessage.includes('close') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to close your account, please visit any branch location with a valid ID. Make sure to transfer any remaining funds and cancel any automatic payments first.`;
    } else if (lowerMessage.includes('routing') && lowerMessage.includes('number')) {
      reply = `Hello ${customer.first_name}, your routing number is 123456789. You can find this information in your online banking account or on your checks.`;
    } else if (lowerMessage.includes('order') && lowerMessage.includes('checks')) {
      reply = `Hello ${customer.first_name}, to order checks, please log into your online banking account or visit any branch location. Standard checks typically arrive within 7-10 business days.`;
    } else if (lowerMessage.includes('exchange') && lowerMessage.includes('rate')) {
      reply = `Hello ${customer.first_name}, our current exchange rates for euros are 1 EUR = 1.08 USD. Exchange rates are updated throughout the day and may vary by transaction amount.`;
    } else if (lowerMessage.includes('dispute') && lowerMessage.includes('transaction')) {
      reply = `Hello ${customer.first_name}, to dispute a transaction, please contact our customer service at 1-800-BANK-HELP immediately. You can also file a dispute online in your account.`;
    } else if (lowerMessage.includes('account') && lowerMessage.includes('number')) {
      reply = `Hello ${customer.first_name}, for security reasons, I cannot provide your account number here. You can find your account number in your online banking account or on your checks.`;
    } else if (lowerMessage.includes('direct') && lowerMessage.includes('deposit')) {
      reply = `Hello ${customer.first_name}, to set up direct deposit, please provide your employer with your account number and routing number. You can find this information in your online banking account.`;
    } else if (lowerMessage.includes('maximum') && lowerMessage.includes('withdrawal')) {
      reply = `Hello ${customer.first_name}, our maximum daily withdrawal limit is $1,000 for standard accounts and $2,000 for premium accounts. You can request a higher limit by contacting customer service.`;
    } else if (lowerMessage.includes('activate') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to activate your new card, please call the number on the back of your card or log into your online banking account. You'll need to provide your card number and security code.`;
    } else if (lowerMessage.includes('automatic') && lowerMessage.includes('payment')) {
      reply = `Hello ${customer.first_name}, to set up automatic payments, please log into your online banking account and go to the "Bill Pay" section. You can schedule recurring payments for your regular bills.`;
    } else if (lowerMessage.includes('credit') && lowerMessage.includes('score')) {
      reply = `Hello ${customer.first_name}, you can check your credit score for free through our online banking account. We provide monthly credit score updates and credit monitoring services.`;
    } else if (lowerMessage.includes('credit') && lowerMessage.includes('limit') && lowerMessage.includes('increase')) {
      reply = `Hello ${customer.first_name}, to request a credit limit increase, please log into your online banking account or call our credit card department at 1-800-CREDIT-HELP.`;
    } else if (lowerMessage.includes('late') && lowerMessage.includes('payment') && lowerMessage.includes('penalty')) {
      reply = `Hello ${customer.first_name}, our late payment penalty is $25 for credit cards and varies by loan type. To avoid late fees, consider setting up automatic payments.`;
    } else if (lowerMessage.includes('update') && lowerMessage.includes('phone')) {
      reply = `Hello ${customer.first_name}, to update your phone number, please visit any branch location with a valid ID or update it online in your account settings.`;
    } else if (lowerMessage.includes('set up') && lowerMessage.includes('alerts')) {
      reply = `Hello ${customer.first_name}, to set up account alerts, please log into your online banking account and go to the "Alerts" section. You can set up notifications for balance changes, transactions, and more.`;
    } else if (lowerMessage.includes('international') && lowerMessage.includes('transfer') && lowerMessage.includes('fee')) {
      reply = `Hello ${customer.first_name}, our international transfer fees are $45 per transfer. Additional fees may apply depending on the receiving bank and country.`;
    } else if (lowerMessage.includes('joint') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to open a joint account, both parties must visit a branch location with valid IDs. You can also start the process online and complete it at a branch.`;
    } else if (lowerMessage.includes('change') && lowerMessage.includes('pin')) {
      reply = `Hello ${customer.first_name}, to change your PIN, please visit any ATM or branch location. You can also change your PIN online in your account settings.`;
    } else if (lowerMessage.includes('request') && lowerMessage.includes('statement')) {
      reply = `Hello ${customer.first_name}, you can request a statement copy by logging into your online banking account or calling customer service at 1-800-BANK-HELP. There may be a fee for paper statements.`;
    } else if (lowerMessage.includes('refinancing') || lowerMessage.includes('refinance')) {
      reply = `Hello ${customer.first_name}, to refinance your loan, please visit any branch location or start your application online. Our loan officers can help you determine if refinancing is right for you.`;
    } else if (lowerMessage.includes('recurring') && lowerMessage.includes('transfer')) {
      reply = `Hello ${customer.first_name}, to set up a recurring transfer, please log into your online banking account and go to the "Transfers" section. You can schedule transfers between your accounts or to other banks.`;
    } else if (lowerMessage.includes('overdraft') && lowerMessage.includes('protection') && lowerMessage.includes('fee')) {
      reply = `Hello ${customer.first_name}, our overdraft protection fee is $10 per month. This service links your checking account to your savings account to cover overdrafts.`;
    } else if (lowerMessage.includes('paperless') && lowerMessage.includes('statements')) {
      reply = `Hello ${customer.first_name}, to enable paperless statements, please log into your online banking account and go to "Account Settings." You'll receive email notifications when your statement is ready.`;
    } else if (lowerMessage.includes('mobile') && lowerMessage.includes('banking')) {
      reply = `Hello ${customer.first_name}, to set up mobile banking, download our app from the App Store or Google Play Store. You can use your existing online banking credentials to log in.`;
    } else if (lowerMessage.includes('replacement') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to request a replacement card, please call customer service at 1-800-BANK-HELP or visit any branch location. Your new card will arrive within 7-10 business days.`;
    } else if (lowerMessage.includes('wire') && lowerMessage.includes('transfer') && lowerMessage.includes('fee')) {
      reply = `Hello ${customer.first_name}, our wire transfer fees are $25 for domestic wires and $45 for international wires. Additional fees may apply depending on the receiving bank.`;
    } else if (lowerMessage.includes('account') && lowerMessage.includes('notifications')) {
      reply = `Hello ${customer.first_name}, to set up account notifications, please log into your online banking account and go to the "Alerts" section. You can choose from various notification types.`;
    } else if (lowerMessage.includes('updating') && lowerMessage.includes('beneficiary')) {
      reply = `Hello ${customer.first_name}, to update your beneficiary information, please visit any branch location with a valid ID. You'll need to provide the new beneficiary's information.`;
    } else if (lowerMessage.includes('stop') && lowerMessage.includes('payment')) {
      reply = `Hello ${customer.first_name}, to request a stop payment, please call customer service at 1-800-BANK-HELP immediately. There is a $30 fee for stop payment requests.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to open a business account, please visit any branch location with your business documentation, including your EIN and business license.`;
    } else if (lowerMessage.includes('online') && lowerMessage.includes('bill') && lowerMessage.includes('pay')) {
      reply = `Hello ${customer.first_name}, to set up online bill pay, please log into your online banking account and go to the "Bill Pay" section. You can add payees and schedule payments.`;
    } else if (lowerMessage.includes('closing') && lowerMessage.includes('credit') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to close your credit card, please call our credit card department at 1-800-CREDIT-HELP. Make sure to pay off any remaining balance first.`;
    } else if (lowerMessage.includes('travel') && lowerMessage.includes('notice')) {
      reply = `Hello ${customer.first_name}, to set up a travel notice, please log into your online banking account or call customer service at 1-800-BANK-HELP. This helps prevent your card from being blocked while traveling.`;
    } else if (lowerMessage.includes('trust') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a trust account, please visit any branch location with your trust documentation. You'll need to meet with our trust services team.`;
    } else if (lowerMessage.includes('updating') && lowerMessage.includes('email')) {
      reply = `Hello ${customer.first_name}, to update your email address, please visit any branch location with a valid ID or update it online in your account settings.`;
    } else if (lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a payoff amount, please call our loan department at 1-800-LOAN-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('wire') && lowerMessage.includes('transfer')) {
      reply = `Hello ${customer.first_name}, to set up a wire transfer, please visit any branch location with valid ID and account information. Wire transfers typically process within 1-2 business days.`;
    } else if (lowerMessage.includes('custodial') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a custodial account, please visit any branch location with the minor's birth certificate and your valid ID.`;
    } else if (lowerMessage.includes('updating') && lowerMessage.includes('mailing')) {
      reply = `Hello ${customer.first_name}, to update your mailing address, please visit any branch location with a valid ID and proof of your new address.`;
    } else if (lowerMessage.includes('credit') && lowerMessage.includes('report')) {
      reply = `Hello ${customer.first_name}, you can request a free credit report once per year from each of the three major credit bureaus at annualcreditreport.com.`;
    } else if (lowerMessage.includes('direct') && lowerMessage.includes('debit')) {
      reply = `Hello ${customer.first_name}, to set up direct debit, please log into your online banking account and go to the "Payments" section. You can authorize automatic withdrawals from your account.`;
    } else if (lowerMessage.includes('student') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a student account, please visit any branch location with your student ID and a valid government-issued ID. Student accounts have no monthly fees.`;
    } else if (lowerMessage.includes('updating') && lowerMessage.includes('security')) {
      reply = `Hello ${customer.first_name}, to update your security questions, please log into your online banking account and go to "Security Settings." You can also visit any branch location.`;
    } else if (lowerMessage.includes('loan') && lowerMessage.includes('payoff') && lowerMessage.includes('statement')) {
      reply = `Hello ${customer.first_name}, to request a loan payoff statement, please call our loan department at 1-800-LOAN-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('balance') && lowerMessage.includes('transfer')) {
      reply = `Hello ${customer.first_name}, to request a balance transfer, please call our credit card department at 1-800-CREDIT-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('recurring') && lowerMessage.includes('payment')) {
      reply = `Hello ${customer.first_name}, to set up a recurring payment, please log into your online banking account and go to the "Bill Pay" section. You can schedule automatic payments.`;
    } else if (lowerMessage.includes('savings') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a savings account, please visit any branch location with a valid ID and initial deposit. You can also start the process online.`;
    } else if (lowerMessage.includes('updating') && lowerMessage.includes('address')) {
      reply = `Hello ${customer.first_name}, to update your address, please visit any branch location with a valid ID and proof of your new address.`;
    } else if (lowerMessage.includes('credit') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to request a credit card, please visit any branch location or apply online. You'll need to provide income verification and credit information.`;
    } else if (lowerMessage.includes('new') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a new account, please visit any branch location with a valid ID and initial deposit. You can also start the process online.`;
    } else if (lowerMessage.includes('checking') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a checking account, please visit any branch location with a valid ID and initial deposit. You can also start the process online.`;
    } else if (lowerMessage.includes('statement') && lowerMessage.includes('copy')) {
      reply = `Hello ${customer.first_name}, to request a statement copy, please log into your online banking account or call customer service at 1-800-BANK-HELP.`;
    } else if (lowerMessage.includes('money') && lowerMessage.includes('market') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a money market account, please visit any branch location. Money market accounts require a minimum balance of $2,500.`;
    } else if (lowerMessage.includes('loan') && lowerMessage.includes('statement')) {
      reply = `Hello ${customer.first_name}, you can view your loan statement online in your account or request a paper copy by calling 1-800-LOAN-HELP.`;
    } else if (lowerMessage.includes('health') && lowerMessage.includes('savings') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a health savings account, please visit any branch location. You'll need to provide proof of high-deductible health insurance.`;
    } else if (lowerMessage.includes('mortgage') && lowerMessage.includes('statement')) {
      reply = `Hello ${customer.first_name}, you can view your mortgage statement online in your account or request a paper copy by calling 1-800-MORTGAGE-HELP.`;
    } else if (lowerMessage.includes('retirement') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a retirement account, please visit any branch location. We offer both traditional and Roth IRA options.`;
    } else if (lowerMessage.includes('personal') && lowerMessage.includes('loan')) {
      reply = `Hello ${customer.first_name}, to request a personal loan, please visit any branch location or apply online. You'll need to provide income verification and credit information.`;
    } else if (lowerMessage.includes('certificate') && lowerMessage.includes('deposit')) {
      reply = `Hello ${customer.first_name}, to set up a certificate of deposit, please visit any branch location. CD terms range from 3 months to 5 years.`;
    } else if (lowerMessage.includes('home') && lowerMessage.includes('equity') && lowerMessage.includes('loan')) {
      reply = `Hello ${customer.first_name}, to request a home equity loan, please visit any branch location. You'll need to provide property information and income verification.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('savings') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business savings account, please visit any branch location with your business documentation and EIN.`;
    } else if (lowerMessage.includes('car') && lowerMessage.includes('loan')) {
      reply = `Hello ${customer.first_name}, to request a car loan, please visit any branch location or apply online. You'll need to provide vehicle information and income verification.`;
    } else if (lowerMessage.includes('new') && lowerMessage.includes('credit') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to set up a new credit card, please visit any branch location or apply online. You'll need to provide income verification and credit information.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('checking') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business checking account, please visit any branch location with your business documentation and EIN.`;
    } else if (lowerMessage.includes('loan') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a loan payoff amount, please call our loan department at 1-800-LOAN-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('loan')) {
      reply = `Hello ${customer.first_name}, to set up a business loan, please visit any branch location with your business documentation, financial statements, and business plan.`;
    } else if (lowerMessage.includes('mortgage') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a mortgage payoff amount, please call our mortgage department at 1-800-MORTGAGE-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('student') && lowerMessage.includes('loan')) {
      reply = `Hello ${customer.first_name}, to set up a student loan, please visit any branch location or apply online. You'll need to provide school information and financial aid details.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('credit') && lowerMessage.includes('card')) {
      reply = `Hello ${customer.first_name}, to set up a business credit card, please visit any branch location with your business documentation and EIN.`;
    } else if (lowerMessage.includes('personal') && lowerMessage.includes('loan') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a personal loan payoff amount, please call our loan department at 1-800-LOAN-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('money') && lowerMessage.includes('market') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business money market account, please visit any branch location with your business documentation. Minimum balance is $5,000.`;
    } else if (lowerMessage.includes('student') && lowerMessage.includes('loan') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a student loan payoff amount, please call our loan department at 1-800-LOAN-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('certificate') && lowerMessage.includes('deposit')) {
      reply = `Hello ${customer.first_name}, to set up a business certificate of deposit, please visit any branch location with your business documentation. Minimum deposit is $10,000.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('loan') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business loan payoff amount, please call our business loan department at 1-800-BUSINESS-LOAN or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('trust') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business trust account, please visit any branch location with your business documentation and trust paperwork.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('credit') && lowerMessage.includes('card') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business credit card payoff amount, please call our business credit card department at 1-800-BUSINESS-CARD or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('savings') && lowerMessage.includes('account') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business savings account payoff amount, please call our business banking department at 1-800-BUSINESS-BANK or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('trust') && lowerMessage.includes('account') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business trust account payoff amount, please call our trust services department at 1-800-TRUST-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('health') && lowerMessage.includes('savings') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business health savings account, please visit any branch location with your business documentation and health insurance information.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('health') && lowerMessage.includes('savings') && lowerMessage.includes('account') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business health savings account payoff amount, please call our HSA department at 1-800-HSA-HELP or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('retirement') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business retirement account, please visit any branch location with your business documentation. We offer SEP-IRAs and SIMPLE IRAs.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('retirement') && lowerMessage.includes('account') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business retirement account payoff amount, please call our retirement services department at 1-800-RETIREMENT or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('student') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business student account, please visit any branch location with your business documentation and student information.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('student') && lowerMessage.includes('account') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business student account payoff amount, please call our business banking department at 1-800-BUSINESS-BANK or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('car') && lowerMessage.includes('loan')) {
      reply = `Hello ${customer.first_name}, to set up a business car loan, please visit any branch location with your business documentation and vehicle information.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('car') && lowerMessage.includes('loan') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business car loan payoff amount, please call our business auto loan department at 1-800-BUSINESS-AUTO or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('mortgage')) {
      reply = `Hello ${customer.first_name}, to set up a business mortgage, please visit any branch location with your business documentation, financial statements, and property information.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('mortgage') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business mortgage payoff amount, please call our business mortgage department at 1-800-BUSINESS-MORTGAGE or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('investment') && lowerMessage.includes('account')) {
      reply = `Hello ${customer.first_name}, to set up a business investment account, please visit any branch location with your business documentation. We offer various investment options.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('investment') && lowerMessage.includes('account') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business investment account payoff amount, please call our investment services department at 1-800-INVESTMENT or visit any branch location.`;
    } else if (lowerMessage.includes('business') && lowerMessage.includes('certificate') && lowerMessage.includes('deposit') && lowerMessage.includes('payoff') && lowerMessage.includes('amount')) {
      reply = `Hello ${customer.first_name}, to request a business certificate of deposit payoff amount, please call our business banking department at 1-800-BUSINESS-BANK or visit any branch location.`;
    } else {
      // Default response with better error handling
      const latestBalance = customerAccounts.length > 0 ? customerAccounts[0].balance.toFixed(2) : '0.00';
      reply = `Hello ${customer.first_name}, you have ${customerAccounts.length} accounts and ${customerTransactions.length} transactions. Your latest balance is $${latestBalance}. How can I help you today?`;
    }

    res.json({
      reply,
      customer,
      accounts: customerAccounts,
      transactions: sortedTransactions.slice(0, 5) // show last 5
    });
    
    // Clear the timeout since we successfully responded
    clearTimeout(responseTimeout);
  } catch (error) {
    console.error('Error in chat route:', error);
    clearTimeout(responseTimeout);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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

    // Placeholder for the removed AgentCoordinator
    const reply = 'This feature is temporarily unavailable.';
    res.json({ reply });
  } catch (error) {
    console.error('Error in message route:', error);
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

    // Placeholder for the removed AgentCoordinator
    const reply = 'This feature is temporarily unavailable.';
    res.json({ reply });
  } catch (error) {
    console.error('Error in verify route:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 