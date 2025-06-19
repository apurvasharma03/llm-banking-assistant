#!/usr/bin/env python3
"""
Synthetic Data Generator for Banking Chatbot
Uses LangChain to generate realistic banking conversations and scenarios
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import uuid

class BankingSyntheticDataGenerator:
    def __init__(self, model_name="mistral"):
        """Initialize the synthetic data generator with Ollama"""
        self.llm = Ollama(
            model=model_name,
            base_url="http://localhost:11434",
            temperature=0.8
        )
        
        # Define conversation templates
        self.templates = {
            "balance_inquiry": PromptTemplate(
                input_variables=["user_name", "account_type", "balance"],
                template="""
                Generate a realistic conversation between a customer and a banking assistant about checking account balance.
                
                Customer Name: {user_name}
                Account Type: {account_type}
                Current Balance: ${balance}
                
                Generate 3-5 exchanges including:
                1. Customer greeting and balance inquiry
                2. Assistant response with balance information
                3. Customer follow-up questions about recent transactions
                4. Assistant providing transaction details
                5. Customer acknowledgment and closing
                
                Format as JSON with this structure:
                {{
                    "conversation_id": "unique_id",
                    "user_id": "user123",
                    "intent": "balance_inquiry",
                    "user_name": "{user_name}",
                    "account_type": "{account_type}",
                    "balance": {balance},
                    "conversation": [
                        {{"role": "user", "message": "message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "message", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "metadata": {{
                        "account_number": "1234567890",
                        "last_transaction_date": "2024-01-14",
                        "transaction_count": 5
                    }}
                }}
                """
            ),
            
            "transaction_request": PromptTemplate(
                input_variables=["user_name", "transaction_type", "amount", "recipient"],
                template="""
                Generate a realistic conversation for a banking transaction request.
                
                Customer Name: {user_name}
                Transaction Type: {transaction_type}
                Amount: ${amount}
                Recipient: {recipient}
                
                Generate 4-6 exchanges including:
                1. Customer initiating transaction
                2. Assistant asking for confirmation details
                3. Customer providing recipient information
                4. Assistant confirming transaction details
                5. Customer confirming the transaction
                6. Assistant processing and confirming completion
                
                Format as JSON with this structure:
                {{
                    "conversation_id": "unique_id",
                    "user_id": "user123",
                    "intent": "transaction_request",
                    "user_name": "{user_name}",
                    "transaction_type": "{transaction_type}",
                    "amount": {amount},
                    "recipient": "{recipient}",
                    "conversation": [
                        {{"role": "user", "message": "message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "message", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "metadata": {{
                        "transaction_id": "TXN123456",
                        "status": "completed",
                        "fee": 2.50,
                        "processing_time": "30 seconds"
                    }}
                }}
                """
            ),
            
            "fraud_alert": PromptTemplate(
                input_variables=["user_name", "suspicious_amount", "merchant"],
                template="""
                Generate a realistic conversation about a fraud alert.
                
                Customer Name: {user_name}
                Suspicious Amount: ${suspicious_amount}
                Merchant: {merchant}
                
                Generate 5-7 exchanges including:
                1. Assistant alerting about suspicious transaction
                2. Customer expressing concern
                3. Assistant explaining the suspicious activity
                4. Customer confirming it's not their transaction
                5. Assistant offering to block the transaction
                6. Customer requesting additional security measures
                7. Assistant confirming actions taken
                
                Format as JSON with this structure:
                {{
                    "conversation_id": "unique_id",
                    "user_id": "user123",
                    "intent": "fraud_alert",
                    "user_name": "{user_name}",
                    "suspicious_amount": {suspicious_amount},
                    "merchant": "{merchant}",
                    "conversation": [
                        {{"role": "assistant", "message": "message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "user", "message": "message", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "metadata": {{
                        "alert_level": "high",
                        "location": "Unknown",
                        "card_number": "****-****-****-1234",
                        "action_taken": "card_blocked"
                    }}
                }}
                """
            ),
            
            "financial_advice": PromptTemplate(
                input_variables=["user_name", "advice_topic", "current_balance"],
                template="""
                Generate a realistic conversation for financial advice.
                
                Customer Name: {user_name}
                Advice Topic: {advice_topic}
                Current Balance: ${current_balance}
                
                Generate 6-8 exchanges including:
                1. Customer asking for financial advice
                2. Assistant asking for more context
                3. Customer providing financial situation details
                4. Assistant analyzing the situation
                5. Assistant providing specific recommendations
                6. Customer asking follow-up questions
                7. Assistant providing additional guidance
                8. Customer thanking and closing
                
                Format as JSON with this structure:
                {{
                    "conversation_id": "unique_id",
                    "user_id": "user123",
                    "intent": "financial_advice",
                    "user_name": "{user_name}",
                    "advice_topic": "{advice_topic}",
                    "current_balance": {current_balance},
                    "conversation": [
                        {{"role": "user", "message": "message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "message", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "metadata": {{
                        "advice_category": "budgeting",
                        "risk_level": "low",
                        "recommendations_count": 3,
                        "follow_up_required": true
                    }}
                }}
                """
            ),
            
            "account_management": PromptTemplate(
                input_variables=["user_name", "management_action"],
                template="""
                Generate a realistic conversation for account management.
                
                Customer Name: {user_name}
                Management Action: {management_action}
                
                Generate 4-6 exchanges including:
                1. Customer requesting account management action
                2. Assistant asking for verification
                3. Customer providing required information
                4. Assistant processing the request
                5. Assistant confirming the action
                6. Customer acknowledgment
                
                Format as JSON with this structure:
                {{
                    "conversation_id": "unique_id",
                    "user_id": "user123",
                    "intent": "account_management",
                    "user_name": "{user_name}",
                    "management_action": "{management_action}",
                    "conversation": [
                        {{"role": "user", "message": "message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "message", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "metadata": {{
                        "action_status": "completed",
                        "verification_method": "security_question",
                        "processing_time": "2 minutes"
                    }}
                }}
                """
            )
        }
        
        # Initialize chains
        self.chains = {
            intent: LLMChain(llm=self.llm, prompt=template)
            for intent, template in self.templates.items()
        }
    
    def generate_user_profile(self) -> Dict[str, Any]:
        """Generate a realistic user profile"""
        first_names = ["John", "Sarah", "Michael", "Emily", "David", "Lisa", "James", "Jennifer", "Robert", "Amanda"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
        
        return {
            "user_id": f"user_{uuid.uuid4().hex[:8]}",
            "first_name": random.choice(first_names),
            "last_name": random.choice(last_names),
            "email": f"{random.choice(first_names).lower()}.{random.choice(last_names).lower()}@email.com",
            "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "account_type": random.choice(["checking", "savings", "premium"]),
            "balance": round(random.uniform(100, 50000), 2),
            "account_number": f"{random.randint(1000000000, 9999999999)}",
            "member_since": (datetime.now() - timedelta(days=random.randint(30, 365*5))).strftime("%Y-%m-%d")
        }
    
    def generate_balance_inquiry_conversation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a balance inquiry conversation"""
        try:
            response = self.chains["balance_inquiry"].run(
                user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                account_type=user_profile['account_type'],
                balance=user_profile['balance']
            )
            
            # Parse the response and add user profile data
            conversation_data = json.loads(response)
            conversation_data.update({
                "user_profile": user_profile,
                "generated_at": datetime.now().isoformat()
            })
            
            return conversation_data
        except Exception as e:
            print(f"Error generating balance inquiry: {e}")
            return self._generate_fallback_conversation("balance_inquiry", user_profile)
    
    def generate_transaction_conversation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a transaction conversation"""
        transaction_types = ["transfer", "payment", "deposit", "withdrawal"]
        recipients = ["John Doe", "Jane Smith", "Netflix", "Amazon", "Utility Company", "Restaurant"]
        
        try:
            response = self.chains["transaction_request"].run(
                user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                transaction_type=random.choice(transaction_types),
                amount=round(random.uniform(10, 1000), 2),
                recipient=random.choice(recipients)
            )
            
            conversation_data = json.loads(response)
            conversation_data.update({
                "user_profile": user_profile,
                "generated_at": datetime.now().isoformat()
            })
            
            return conversation_data
        except Exception as e:
            print(f"Error generating transaction conversation: {e}")
            return self._generate_fallback_conversation("transaction_request", user_profile)
    
    def generate_fraud_alert_conversation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a fraud alert conversation"""
        merchants = ["Unknown Merchant", "Suspicious Store", "Online Retailer", "International Vendor"]
        
        try:
            response = self.chains["fraud_alert"].run(
                user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                suspicious_amount=round(random.uniform(50, 2000), 2),
                merchant=random.choice(merchants)
            )
            
            conversation_data = json.loads(response)
            conversation_data.update({
                "user_profile": user_profile,
                "generated_at": datetime.now().isoformat()
            })
            
            return conversation_data
        except Exception as e:
            print(f"Error generating fraud alert: {e}")
            return self._generate_fallback_conversation("fraud_alert", user_profile)
    
    def generate_financial_advice_conversation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a financial advice conversation"""
        advice_topics = ["budgeting", "saving", "investing", "debt management", "retirement planning"]
        
        try:
            response = self.chains["financial_advice"].run(
                user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                advice_topic=random.choice(advice_topics),
                current_balance=user_profile['balance']
            )
            
            conversation_data = json.loads(response)
            conversation_data.update({
                "user_profile": user_profile,
                "generated_at": datetime.now().isoformat()
            })
            
            return conversation_data
        except Exception as e:
            print(f"Error generating financial advice: {e}")
            return self._generate_fallback_conversation("financial_advice", user_profile)
    
    def generate_account_management_conversation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate an account management conversation"""
        management_actions = ["change password", "update contact info", "add beneficiary", "request new card", "close account"]
        
        try:
            response = self.chains["account_management"].run(
                user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                management_action=random.choice(management_actions)
            )
            
            conversation_data = json.loads(response)
            conversation_data.update({
                "user_profile": user_profile,
                "generated_at": datetime.now().isoformat()
            })
            
            return conversation_data
        except Exception as e:
            print(f"Error generating account management: {e}")
            return self._generate_fallback_conversation("account_management", user_profile)
    
    def _generate_fallback_conversation(self, intent: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a fallback conversation when LLM fails"""
        fallback_conversations = {
            "balance_inquiry": [
                {"role": "user", "message": f"Hi, I'd like to check my account balance.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": f"Hello {user_profile['first_name']}! Your current balance is ${user_profile['balance']:.2f}.", "timestamp": datetime.now().isoformat()}
            ],
            "transaction_request": [
                {"role": "user", "message": "I'd like to make a transfer.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": "I'd be happy to help you with a transfer. Please provide the recipient details.", "timestamp": datetime.now().isoformat()}
            ],
            "fraud_alert": [
                {"role": "assistant", "message": "We've detected suspicious activity on your account.", "timestamp": datetime.now().isoformat()},
                {"role": "user", "message": "Oh no! What happened?", "timestamp": datetime.now().isoformat()}
            ],
            "financial_advice": [
                {"role": "user", "message": "I need some financial advice.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": "I'd be happy to help! What specific area would you like advice on?", "timestamp": datetime.now().isoformat()}
            ],
            "account_management": [
                {"role": "user", "message": "I need to update my account information.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": "I can help you with that. What information would you like to update?", "timestamp": datetime.now().isoformat()}
            ]
        }
        
        return {
            "conversation_id": f"fallback_{uuid.uuid4().hex[:8]}",
            "user_id": user_profile['user_id'],
            "intent": intent,
            "user_name": f"{user_profile['first_name']} {user_profile['last_name']}",
            "conversation": fallback_conversations[intent],
            "user_profile": user_profile,
            "generated_at": datetime.now().isoformat(),
            "metadata": {"fallback": True}
        }
    
    def generate_dataset(self, num_conversations: int = 100) -> List[Dict[str, Any]]:
        """Generate a comprehensive dataset"""
        dataset = []
        
        print(f"Generating {num_conversations} conversations...")
        
        for i in range(num_conversations):
            if i % 10 == 0:
                print(f"Generated {i} conversations...")
            
            # Generate user profile
            user_profile = self.generate_user_profile()
            
            # Generate balance inquiry conversation
            conversation = self.generate_balance_inquiry_conversation(user_profile)
            dataset.append(conversation)
        
        return dataset
    
    def save_dataset(self, dataset: List[Dict[str, Any]], filename: str = "banking_synthetic_dataset.json"):
        """Save the dataset to a JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        print(f"Dataset saved to {filename}")
        print(f"Total conversations: {len(dataset)}")

def main():
    """Main function to generate the dataset"""
    print("🚀 Starting Banking Synthetic Data Generation...")
    
    # Initialize generator
    generator = BankingSyntheticDataGenerator()
    
    # Generate dataset (start with 100 for testing)
    dataset = generator.generate_dataset(num_conversations=100)
    
    # Save dataset
    generator.save_dataset(dataset, "banking_synthetic_dataset.json")
    
    print("✅ Dataset generation completed!")

if __name__ == "__main__":
    main() 