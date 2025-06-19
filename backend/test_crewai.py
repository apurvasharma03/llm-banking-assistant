#!/usr/bin/env python3
"""
Test script for the enhanced CrewAI banking system
"""

import json
import sys
import os
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Test data
test_cases = [
    {
        "name": "Balance Check",
        "input": {
            "query": "What's my account balance?",
            "userId": "user123",
            "mockBalance": 5000.0,
            "transactionHistory": [],
            "amount": 0,
            "type": "inquiry",
            "description": "Balance check request"
        }
    },
    {
        "name": "Transaction History",
        "input": {
            "query": "Show me my recent transactions",
            "userId": "user123",
            "mockBalance": 5000.0,
            "transactionHistory": [
                {
                    "id": "1",
                    "userId": "user123",
                    "amount": 100.00,
                    "type": "debit",
                    "description": "Grocery Store",
                    "date": "2024-01-15T10:30:00Z",
                    "merchant": "Grocery Store",
                    "location": "Local Store",
                    "category": "Shopping"
                }
            ],
            "amount": 0,
            "type": "inquiry",
            "description": "Transaction history request"
        }
    },
    {
        "name": "Fraud Detection",
        "input": {
            "query": "I noticed a suspicious transaction",
            "userId": "user123",
            "mockBalance": 5000.0,
            "transactionHistory": [],
            "amount": 1000.0,
            "type": "debit",
            "description": "Suspicious transaction",
            "merchant": "Unknown Merchant",
            "location": "Unknown Location"
        }
    }
]

def test_crewai():
    """Test the CrewAI system with different scenarios"""
    print("🧪 Testing Enhanced CrewAI Banking System")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 Test {i}: {test_case['name']}")
        print("-" * 30)
        
        # Write test input to file
        input_file = 'crew_input.json'
        with open(input_file, 'w') as f:
            json.dump(test_case['input'], f, indent=2)
        
        try:
            logging.info(f"Starting test case {test_case['name']}")
            # Run the crew_agent script with increased timeout
            result = subprocess.run(
                ['python', 'crew_agent.py', input_file],
                capture_output=True,
                text=True,
                timeout=300  # Increased timeout to 5 minutes
            )
            
            if result.returncode == 0:
                try:
                    response = json.loads(result.stdout)
                    print(f"✅ Success: {response.get('message', 'No message')[:100]}...")
                    print(f"📊 Data: {response.get('data', {})}")
                except json.JSONDecodeError:
                    logging.error(f"Failed to parse JSON output: {result.stdout[:500]}")
                    print(f"⚠️  Raw output: {result.stdout[:200]}...")
            else:
                logging.error(f"Script error: {result.stderr}")
                print(f"❌ Error: {result.stderr}")
            
        except subprocess.TimeoutExpired:
            logging.error(f"Timeout in test case {test_case['name']}")
            print("⏰ Timeout: CrewAI took too long to respond")
        except Exception as e:
            logging.error(f"Exception in test case {test_case['name']}: {str(e)}")
            print(f"❌ Exception: {str(e)}")
        
        finally:
            # Clean up
            if os.path.exists(input_file):
                os.remove(input_file)
    
    print("\n🎉 Testing completed!")

if __name__ == "__main__":
    test_crewai() 