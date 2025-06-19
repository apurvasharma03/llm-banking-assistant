#!/usr/bin/env python3
"""
Advanced LangChain-based Synthetic Data Generator for Banking Chatbot
Uses Ollama to generate more realistic and varied conversations
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

class LangChainBankingDataGenerator:
    def __init__(self, model_name="mistral"):
        """Initialize the LangChain-based data generator"""
        self.llm = Ollama(
            model=model_name,
            base_url="http://localhost:11434",
            temperature=0.7
        )
        
        # Define conversation generation prompts
        self.prompts = {
            "balance_inquiry": PromptTemplate(
                input_variables=["user_name", "account_type", "balance"],
                template="""
                Generate a realistic banking conversation about checking account balance.
                
                Customer: {user_name}
                Account Type: {account_type}
                Current Balance: ${balance}
                
                Create a natural conversation with 4-6 exchanges between customer and banking assistant.
                Include:
                - Customer greeting and balance request
                - Assistant providing balance information
                - Customer asking about recent transactions
                - Assistant showing transaction summary
                - Customer acknowledgment and closing
                
                Format as JSON:
                {{
                    "conversation": [
                        {{"role": "user", "message": "customer message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "assistant response", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "intent": "balance_inquiry",
                    "metadata": {{
                        "account_type": "{account_type}",
                        "balance": {balance},
                        "transaction_count": 5
                    }}
                }}
                
                Make the conversation natural and realistic.
                """
            ),
            
            "transaction_request": PromptTemplate(
                input_variables=["user_name", "transaction_type", "amount"],
                template="""
                Generate a realistic banking conversation for a transaction request.
                
                Customer: {user_name}
                Transaction Type: {transaction_type}
                Amount: ${amount}
                
                Create a natural conversation with 5-7 exchanges including:
                - Customer initiating transaction
                - Assistant asking for details
                - Customer providing recipient information
                - Assistant confirming details
                - Customer confirming transaction
                - Assistant processing and confirming
                
                Format as JSON:
                {{
                    "conversation": [
                        {{"role": "user", "message": "customer message", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "assistant response", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "intent": "transaction_request",
                    "metadata": {{
                        "transaction_type": "{transaction_type}",
                        "amount": {amount},
                        "status": "completed"
                    }}
                }}
                
                Make the conversation natural and realistic.
                """
            ),
            
            "fraud_alert": PromptTemplate(
                input_variables=["user_name", "suspicious_amount"],
                template="""
                Generate a realistic banking conversation about a fraud alert.
                
                Customer: {user_name}
                Suspicious Amount: ${suspicious_amount}
                
                Create a natural conversation with 5-7 exchanges including:
                - Assistant alerting about suspicious activity
                - Customer expressing concern
                - Assistant explaining the situation
                - Customer confirming it's not their transaction
                - Assistant offering security measures
                - Customer requesting card replacement
                - Assistant confirming actions taken
                
                Format as JSON:
                {{
                    "conversation": [
                        {{"role": "assistant", "message": "assistant alert", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "user", "message": "customer response", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "intent": "fraud_alert",
                    "metadata": {{
                        "suspicious_amount": {suspicious_amount},
                        "alert_level": "high",
                        "action_taken": "card_blocked"
                    }}
                }}
                
                Make the conversation natural and realistic.
                """
            ),
            
            "financial_advice": PromptTemplate(
                input_variables=["user_name", "advice_topic", "income"],
                template="""
                Generate a realistic banking conversation for financial advice.
                
                Customer: {user_name}
                Advice Topic: {advice_topic}
                Monthly Income: ${income}
                
                Create a natural conversation with 6-8 exchanges including:
                - Customer asking for financial advice
                - Assistant asking for more context
                - Customer providing financial situation
                - Assistant analyzing the situation
                - Assistant providing recommendations
                - Customer asking follow-up questions
                - Assistant providing additional guidance
                - Customer thanking and closing
                
                Format as JSON:
                {{
                    "conversation": [
                        {{"role": "user", "message": "customer request", "timestamp": "2024-01-15T10:30:00Z"}},
                        {{"role": "assistant", "message": "assistant response", "timestamp": "2024-01-15T10:30:05Z"}}
                    ],
                    "intent": "financial_advice",
                    "metadata": {{
                        "advice_topic": "{advice_topic}",
                        "income": {income},
                        "recommendations_count": 3
                    }}
                }}
                
                Make the conversation natural and realistic.
                """
            )
        }
        
        # Initialize chains
        self.chains = {
            intent: LLMChain(llm=self.llm, prompt=template)
            for intent, template in self.prompts.items()
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
            "account_type": random.choice(["checking", "savings", "premium", "student", "senior"]),
            "balance": round(random.uniform(100, 50000), 2),
            "account_number": f"{random.randint(1000000000, 9999999999)}",
            "member_since": (datetime.now() - timedelta(days=random.randint(30, 365*5))).strftime("%Y-%m-%d"),
            "monthly_income": round(random.uniform(2000, 15000), 2)
        }
    
    def generate_conversation_with_llm(self, intent: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a conversation using LangChain and Ollama"""
        try:
            if intent == "balance_inquiry":
                response = self.chains[intent].run(
                    user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                    account_type=user_profile['account_type'],
                    balance=user_profile['balance']
                )
            elif intent == "transaction_request":
                transaction_types = ["transfer", "payment", "deposit", "withdrawal"]
                response = self.chains[intent].run(
                    user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                    transaction_type=random.choice(transaction_types),
                    amount=round(random.uniform(10, 1000), 2)
                )
            elif intent == "fraud_alert":
                response = self.chains[intent].run(
                    user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                    suspicious_amount=round(random.uniform(50, 2000), 2)
                )
            elif intent == "financial_advice":
                advice_topics = ["budgeting", "saving", "investing", "debt management", "retirement planning"]
                response = self.chains[intent].run(
                    user_name=f"{user_profile['first_name']} {user_profile['last_name']}",
                    advice_topic=random.choice(advice_topics),
                    income=user_profile['monthly_income']
                )
            
            # Parse the response
            conversation_data = json.loads(response)
            
            # Add user profile and metadata
            conversation_data.update({
                "conversation_id": f"llm_conv_{uuid.uuid4().hex[:8]}",
                "user_id": user_profile["user_id"],
                "user_name": f"{user_profile['first_name']} {user_profile['last_name']}",
                "user_profile": user_profile,
                "generated_at": datetime.now().isoformat(),
                "generation_method": "langchain_ollama"
            })
            
            return conversation_data
            
        except Exception as e:
            print(f"Error generating {intent} conversation with LLM: {e}")
            return self._generate_fallback_conversation(intent, user_profile)
    
    def _generate_fallback_conversation(self, intent: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a fallback conversation when LLM fails"""
        fallback_messages = {
            "balance_inquiry": [
                {"role": "user", "message": f"Hi, I'd like to check my account balance.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": f"Hello {user_profile['first_name']}! Your current balance is ${user_profile['balance']:.2f}.", "timestamp": datetime.now().isoformat()}
            ],
            "transaction_request": [
                {"role": "user", "message": "I need to make a transfer.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": "I can help you with that. Please provide the recipient details.", "timestamp": datetime.now().isoformat()}
            ],
            "fraud_alert": [
                {"role": "assistant", "message": "We've detected suspicious activity on your account.", "timestamp": datetime.now().isoformat()},
                {"role": "user", "message": "Oh no! What happened?", "timestamp": datetime.now().isoformat()}
            ],
            "financial_advice": [
                {"role": "user", "message": "I need some financial advice.", "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "message": "I'd be happy to help! What specific area would you like advice on?", "timestamp": datetime.now().isoformat()}
            ]
        }
        
        return {
            "conversation_id": f"fallback_{uuid.uuid4().hex[:8]}",
            "user_id": user_profile["user_id"],
            "intent": intent,
            "user_name": f"{user_profile['first_name']} {user_profile['last_name']}",
            "conversation": fallback_messages[intent],
            "user_profile": user_profile,
            "generated_at": datetime.now().isoformat(),
            "generation_method": "fallback",
            "metadata": {"fallback": True}
        }
    
    def generate_dataset(self, conversations_per_intent: int = 10) -> List[Dict[str, Any]]:
        """Generate a comprehensive dataset using LangChain"""
        dataset = []
        intents = list(self.prompts.keys())
        
        print(f"Generating {conversations_per_intent} conversations per intent using LangChain...")
        print(f"Total conversations: {conversations_per_intent * len(intents)}")
        
        for intent in intents:
            print(f"\nGenerating {intent} conversations...")
            
            for i in range(conversations_per_intent):
                if i % 5 == 0:
                    print(f"  Generated {i} {intent} conversations...")
                
                # Generate user profile
                user_profile = self.generate_user_profile()
                
                # Generate conversation using LangChain
                conversation = self.generate_conversation_with_llm(intent, user_profile)
                dataset.append(conversation)
        
        return dataset
    
    def save_dataset(self, dataset: List[Dict[str, Any]], filename: str = "langchain_banking_dataset.json"):
        """Save the dataset to a JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        print(f"\nDataset saved to {filename}")
        print(f"Total conversations: {len(dataset)}")
        
        # Print statistics
        intent_counts = {}
        generation_methods = {}
        
        for conversation in dataset:
            intent = conversation.get('intent', 'unknown')
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
            
            method = conversation.get('generation_method', 'unknown')
            generation_methods[method] = generation_methods.get(method, 0) + 1
        
        print("\nIntent distribution:")
        for intent, count in intent_counts.items():
            print(f"  {intent}: {count} conversations")
        
        print("\nGeneration method distribution:")
        for method, count in generation_methods.items():
            print(f"  {method}: {count} conversations")

def main():
    """Main function to generate the dataset"""
    print("🚀 Starting LangChain Banking Synthetic Data Generation...")
    
    # Initialize generator
    generator = LangChainBankingDataGenerator()
    
    # Generate dataset (start with 10 conversations per intent for testing)
    dataset = generator.generate_dataset(conversations_per_intent=10)
    
    # Save dataset
    generator.save_dataset(dataset, "langchain_banking_dataset.json")
    
    print("✅ LangChain dataset generation completed!")

if __name__ == "__main__":
    main() 