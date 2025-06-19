#!/usr/bin/env python3
"""
Test script for synthetic data generation
"""

import json
from comprehensive_data_generator import ComprehensiveBankingDataGenerator

def test_synthetic_data_generation():
    """Test the synthetic data generator"""
    print("🧪 Testing Synthetic Data Generation...")
    
    # Initialize generator
    generator = ComprehensiveBankingDataGenerator()
    
    # Test user profile generation
    print("\n1. Testing user profile generation...")
    user_profile = generator.generate_user_profile()
    print(f"Generated user: {user_profile['first_name']} {user_profile['last_name']}")
    print(f"Account type: {user_profile['account_type']}")
    print(f"Balance: ${user_profile['balance']:.2f}")
    
    # Test conversation generation for each intent
    print("\n2. Testing conversation generation...")
    intents = ["balance_inquiry", "transaction_request", "fraud_alert", "financial_advice", "account_management"]
    
    for intent in intents:
        print(f"\n   Testing {intent}...")
        conversation = generator.generate_conversation(intent, user_profile)
        print(f"   Conversation ID: {conversation['conversation_id']}")
        print(f"   Messages: {len(conversation['conversation'])}")
        print(f"   First message: {conversation['conversation'][0]['message'][:50]}...")
    
    # Test small dataset generation
    print("\n3. Testing small dataset generation...")
    dataset = generator.generate_dataset(conversations_per_intent=5)
    print(f"Generated {len(dataset)} conversations")
    
    # Save test dataset
    test_filename = "test_synthetic_dataset.json"
    generator.save_dataset(dataset, test_filename)
    
    # Load and verify the dataset
    print("\n4. Verifying generated dataset...")
    with open(test_filename, 'r', encoding='utf-8') as f:
        loaded_dataset = json.load(f)
    
    print(f"Loaded {len(loaded_dataset)} conversations")
    
    # Show sample conversation
    sample_conv = loaded_dataset[0]
    print(f"\nSample conversation ({sample_conv['intent']}):")
    for msg in sample_conv['conversation']:
        print(f"  {msg['role']}: {msg['message']}")
    
    print("\n✅ Synthetic data generation test completed!")

if __name__ == "__main__":
    test_synthetic_data_generation() 