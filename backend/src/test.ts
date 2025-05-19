import { AgentCoordinator } from './agents/coordinator';

async function runTests() {
  const coordinator = new AgentCoordinator();
  
  console.log('=== Testing Banking Chatbot ===\n');

  // Test 1: Balance Inquiry
  console.log('Test 1: Balance Inquiry');
  const balanceResponse = await coordinator.processUserQuery('What is my current balance?');
  console.log('Response:', JSON.stringify(balanceResponse, null, 2), '\n');

  // Test 2: Transaction History
  console.log('Test 2: Transaction History');
  const historyResponse = await coordinator.processUserQuery('Show me my recent transactions');
  console.log('Response:', JSON.stringify(historyResponse, null, 2), '\n');

  // Test 3: Transfer Money
  console.log('Test 3: Transfer Money');
  const transferResponse = await coordinator.processUserQuery('Transfer $500 to savings');
  console.log('Response:', JSON.stringify(transferResponse, null, 2), '\n');

  // Test 4: Bill Payment
  console.log('Test 4: Bill Payment');
  const billResponse = await coordinator.processUserQuery('Pay $150 to Power Company');
  console.log('Response:', JSON.stringify(billResponse, null, 2), '\n');

  // Test 5: Financial Advice
  console.log('Test 5: Financial Advice');
  const adviceResponse = await coordinator.processUserQuery('How can I save more money?');
  console.log('Response:', JSON.stringify(adviceResponse, null, 2), '\n');

  // Test 6: Fraud Check
  console.log('Test 6: Fraud Check');
  const fraudResponse = await coordinator.processUserQuery('Check for suspicious activity');
  console.log('Response:', JSON.stringify(fraudResponse, null, 2), '\n');
}

runTests().catch(console.error); 