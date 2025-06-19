#!/usr/bin/env python3
"""
Simple test for CrewAI implementation
"""

import json
import subprocess
import sys

def test_simple_balance():
    """Test a simple balance inquiry"""
    test_input = {
        "query": "What's my account balance?",
        "userId": "user123",
        "mockBalance": 5000.0,
        "transactionHistory": [],
        "amount": 0,
        "type": "inquiry",
        "description": "Balance check request"
    }
    
    # Write test input to file
    with open('test_input.json', 'w') as f:
        json.dump(test_input, f, indent=2)
    
    try:
        print("Testing CrewAI with balance inquiry...")
        result = subprocess.run(
            ['python', 'crew_agent.py', 'test_input.json'],
            capture_output=True,
            text=True,
            timeout=600  # Increased timeout to 10 minutes
        )
        
        if result.returncode == 0:
            try:
                response = json.loads(result.stdout)
                if response.get('success'):
                    print("✅ SUCCESS: CrewAI is working!")
                    print(f"Message: {response.get('message', 'No message')}")
                    return True
                else:
                    print(f"❌ FAILED: {response.get('error', 'Unknown error')}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ FAILED: Invalid JSON response: {result.stdout[:200]}")
                return False
        else:
            print(f"❌ FAILED: Script error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ FAILED: Timeout - CrewAI took too long to respond")
        return False
    except Exception as e:
        print(f"❌ FAILED: Exception: {str(e)}")
        return False
    finally:
        # Clean up
        import os
        if os.path.exists('test_input.json'):
            os.remove('test_input.json')

if __name__ == "__main__":
    success = test_simple_balance()
    sys.exit(0 if success else 1) 