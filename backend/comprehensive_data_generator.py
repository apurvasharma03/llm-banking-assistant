#!/usr/bin/env python3
"""
Comprehensive Synthetic Data Generator for Banking Chatbot
Generates realistic banking conversations for all scenarios
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid

class ComprehensiveBankingDataGenerator:
    def __init__(self):
        """Initialize the data generator"""
        self.conversation_templates = {
            "balance_inquiry": [
                {
                    "user": "Hi, I'd like to check my account balance.",
                    "assistant": "Hello! I'd be happy to help you check your balance. Let me retrieve that information for you.",
                    "user_followup": "Can you also show me my recent transactions?",
                    "assistant_followup": "Of course! Here are your recent transactions from the past 7 days."
                }
            ],
            "transaction_request": [
                {
                    "user": "I need to transfer money to my friend.",
                    "assistant": "I can help you with that transfer. Please provide the recipient's name and account number.",
                    "user_followup": "The name is John Doe and the account number is 1234567890.",
                    "assistant_followup": "Thank you. How much would you like to transfer?"
                }
            ],
            "fraud_alert": [
                {
                    "assistant": "We've detected suspicious activity on your account. There was a transaction for $500 at an unknown merchant.",
                    "user": "That's not me! I didn't make that transaction.",
                    "assistant": "I understand your concern. Let me help you secure your account immediately.",
                    "user_followup": "Please block my card and issue a new one.",
                    "assistant_followup": "I've blocked your current card and will issue a new one. It should arrive in 5-7 business days."
                }
            ],
            "financial_advice": [
                {
                    "user": "I need help with budgeting and saving money.",
                    "assistant": "I'd be happy to help you with financial planning. Let me ask a few questions to provide personalized advice.",
                    "user_followup": "I make $3000 a month and want to save for a house.",
                    "assistant_followup": "Based on your income, I recommend setting aside 20% for savings. Let me create a budget plan for you."
                }
            ],
            "account_management": [
                {
                    "user": "I need to update my contact information.",
                    "assistant": "I can help you update your contact information. What would you like to change?",
                    "user_followup": "I need to update my phone number and email address.",
                    "assistant_followup": "I'll help you update both. Please provide your new phone number and email address."
                }
            ]
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
            "member_since": (datetime.now() - timedelta(days=random.randint(30, 365*5))).strftime("%Y-%m-%d")
        }
    
    def generate_conversation(self, intent: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a conversation based on intent"""
        template = self.conversation_templates[intent][0]
        
        # Add realistic timestamps
        start_time = datetime.now() - timedelta(minutes=random.randint(1, 60))
        
        conversation = []
        
        if intent == "fraud_alert":
            # Fraud alerts start with assistant
            conversation.append({
                "role": "assistant",
                "message": template["assistant"],
                "timestamp": start_time.isoformat()
            })
            conversation.append({
                "role": "user",
                "message": template["user"],
                "timestamp": (start_time + timedelta(seconds=30)).isoformat()
            })
            conversation.append({
                "role": "assistant",
                "message": template["assistant_followup"],
                "timestamp": (start_time + timedelta(seconds=60)).isoformat()
            })
            conversation.append({
                "role": "user",
                "message": template["user_followup"],
                "timestamp": (start_time + timedelta(seconds=90)).isoformat()
            })
            conversation.append({
                "role": "assistant",
                "message": template["assistant_followup"],
                "timestamp": (start_time + timedelta(seconds=120)).isoformat()
            })
        else:
            # Other conversations start with user
            conversation.append({
                "role": "user",
                "message": template["user"],
                "timestamp": start_time.isoformat()
            })
            conversation.append({
                "role": "assistant",
                "message": template["assistant"],
                "timestamp": (start_time + timedelta(seconds=30)).isoformat()
            })
            conversation.append({
                "role": "user",
                "message": template["user_followup"],
                "timestamp": (start_time + timedelta(seconds=60)).isoformat()
            })
            conversation.append({
                "role": "assistant",
                "message": template["assistant_followup"],
                "timestamp": (start_time + timedelta(seconds=90)).isoformat()
            })
        
        return {
            "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
            "user_id": user_profile["user_id"],
            "intent": intent,
            "user_name": f"{user_profile['first_name']} {user_profile['last_name']}",
            "conversation": conversation,
            "user_profile": user_profile,
            "generated_at": datetime.now().isoformat(),
            "metadata": {
                "conversation_length": len(conversation),
                "duration_seconds": 120,
                "satisfaction_score": random.randint(3, 5),
                "resolution_status": "resolved"
            }
        }
    
    def generate_dataset(self, conversations_per_intent: int = 50) -> List[Dict[str, Any]]:
        """Generate a comprehensive dataset"""
        dataset = []
        intents = list(self.conversation_templates.keys())
        
        print(f"Generating {conversations_per_intent} conversations per intent...")
        print(f"Total conversations: {conversations_per_intent * len(intents)}")
        
        for intent in intents:
            print(f"\nGenerating {intent} conversations...")
            
            for i in range(conversations_per_intent):
                if i % 10 == 0:
                    print(f"  Generated {i} {intent} conversations...")
                
                # Generate user profile
                user_profile = self.generate_user_profile()
                
                # Generate conversation
                conversation = self.generate_conversation(intent, user_profile)
                dataset.append(conversation)
        
        return dataset
    
    def save_dataset(self, dataset: List[Dict[str, Any]], filename: str = "comprehensive_banking_dataset.json"):
        """Save the dataset to a JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        print(f"\nDataset saved to {filename}")
        print(f"Total conversations: {len(dataset)}")
        
        # Print statistics
        intent_counts = {}
        for conversation in dataset:
            intent = conversation.get('intent', 'unknown')
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        print("\nIntent distribution:")
        for intent, count in intent_counts.items():
            print(f"  {intent}: {count} conversations")

def main():
    """Main function to generate the dataset"""
    print("🚀 Starting Comprehensive Banking Synthetic Data Generation...")
    
    # Initialize generator
    generator = ComprehensiveBankingDataGenerator()
    
    # Generate dataset (start with 50 conversations per intent for testing)
    dataset = generator.generate_dataset(conversations_per_intent=50)
    
    # Save dataset
    generator.save_dataset(dataset, "comprehensive_banking_dataset.json")
    
    print("✅ Dataset generation completed!")

if __name__ == "__main__":
    main() 