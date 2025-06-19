#!/usr/bin/env python3
"""
Generate Large Synthetic Dataset for Banking Chatbot
This script generates a comprehensive dataset for training and testing
"""

import json
import time
from comprehensive_data_generator import ComprehensiveBankingDataGenerator

def generate_large_dataset():
    """Generate a large synthetic dataset"""
    print("🚀 Starting Large Synthetic Dataset Generation...")
    
    # Initialize generator
    generator = ComprehensiveBankingDataGenerator()
    
    # Generate different sized datasets
    dataset_sizes = [
        {"name": "small", "conversations_per_intent": 100, "total": 500},
        {"name": "medium", "conversations_per_intent": 500, "total": 2500},
        {"name": "large", "conversations_per_intent": 1000, "total": 5000}
    ]
    
    for dataset_config in dataset_sizes:
        print(f"\n📊 Generating {dataset_config['name']} dataset...")
        print(f"   Conversations per intent: {dataset_config['conversations_per_intent']}")
        print(f"   Total conversations: {dataset_config['total']}")
        
        start_time = time.time()
        
        # Generate dataset
        dataset = generator.generate_dataset(
            conversations_per_intent=dataset_config['conversations_per_intent']
        )
        
        # Save dataset
        filename = f"banking_dataset_{dataset_config['name']}.json"
        generator.save_dataset(dataset, filename)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"   ✅ Generated in {duration:.2f} seconds")
        print(f"   📁 Saved to: {filename}")
    
    print("\n🎉 All datasets generated successfully!")

if __name__ == "__main__":
    generate_large_dataset() 