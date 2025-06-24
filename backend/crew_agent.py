import sys
import json
from crewai import Agent, Task, Crew, Process, LLM
from datetime import datetime, timedelta
import random
import requests
import os
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.utils import shuffle

# Test Ollama connection
def test_ollama_connection():
    """Test if Ollama is running and accessible"""
    try:
        response = requests.get("http://localhost:11434/api/version", timeout=5)
        if response.status_code == 200:
            return True
        else:
            return False
    except:
        return False

# Configure Ollama as the LLM provider
if not test_ollama_connection():
    print(json.dumps({
        "success": False, 
        "error": "Ollama service not accessible. Please ensure Ollama is running.",
        "fallback": "Cannot connect to Ollama service"
    }))
    sys.exit(1)

llm = LLM(
    model="ollama/mistral",
    base_url="http://localhost:11434",
    temperature=0.7,
    max_tokens=1024,
    request_timeout=600
)

# Read input JSON file path from command line
if len(sys.argv) < 2:
    print(json.dumps({"success": False, "error": "No input file provided"}))
    sys.exit(1)

input_file = sys.argv[1]

try:
    with open(input_file, 'r') as f:
        input_data = json.load(f)
except Exception as e:
    print(json.dumps({"success": False, "error": f"Failed to read input file: {e}"}))
    sys.exit(1)

# Extract data from input
query = input_data.get('query', '')
user_id = input_data.get('userId', 'user123')
mock_balance = input_data.get('mockBalance', 5000.0)
transaction_history = input_data.get('transactionHistory', [])
amount = input_data.get('amount', 0)
transaction_type = input_data.get('type', '')
description = input_data.get('description', '')
category = input_data.get('category', '')
merchant = input_data.get('merchant', '')
location = input_data.get('location', '')

# Create all 4 banking agents (removed verification agent for simplicity)
inquiry_agent = Agent(
    role='Customer Inquiry Specialist',
    goal='Handle general banking inquiries and provide account information',
    backstory='I am a banking customer service expert with deep knowledge of banking products, services, and policies. I help customers understand their accounts and banking options.',
    verbose=True,  # Enable verbose for debugging
    allow_delegation=False,
    llm=llm
)

transaction_agent = Agent(
    role='Transaction Processing Specialist',
    goal='Process banking transactions, transfers, and payments',
    backstory='I am a transaction processing expert with expertise in fund transfers, bill payments, and transaction history analysis. I ensure secure and accurate financial transactions.',
    verbose=True,  # Enable verbose for debugging
    allow_delegation=False,
    llm=llm
)

fraud_detection_agent = Agent(
    role='Fraud Detection Specialist',
    goal='Detect and prevent fraudulent activities',
    backstory='I am a cybersecurity and fraud detection expert with advanced pattern recognition skills. I analyze transactions for suspicious activity and protect customers from fraud.',
    verbose=True,  # Enable verbose for debugging
    allow_delegation=False,
    llm=llm
)

advisor_agent = Agent(
    role='Financial Advisor',
    goal='Provide personalized financial advice and recommendations',
    backstory='I am a certified financial advisor with expertise in personal finance, investment strategies, budgeting, and financial planning. I help customers make informed financial decisions.',
    verbose=True,  # Enable verbose for debugging
    allow_delegation=False,
    llm=llm
)

# Simplified task creation based on query type
query_lower = query.lower()

# Determine the appropriate agent and create task
if 'balance' in query_lower or 'account' in query_lower:
    agent = inquiry_agent
    task_description = f"Provide account balance information for user {user_id}. Current balance: ${mock_balance}. Query: {query}"
    expected_output = "Clear account balance information with formatting"
elif 'transaction' in query_lower or 'transfer' in query_lower or 'payment' in query_lower:
    agent = transaction_agent
    task_description = f"Process transaction request: {query}. Amount: ${amount}, Type: {transaction_type}, Description: {description}. Current balance: ${mock_balance}."
    expected_output = "Transaction processing result with confirmation or error details"
elif 'fraud' in query_lower or 'suspicious' in query_lower:
    # Run semi-supervised fraud detection
    ml_result = semi_supervised_fraud_detection(query, amount, merchant, location)
    agent = fraud_detection_agent
    task_description = f"Analyze potential fraud: {query}. Amount: ${amount}, Merchant: {merchant}, Location: {location}."\
        f"\n[ML Risk Score: {ml_result['risk_score']:.2f}, Label: {ml_result['label']}]"
    expected_output = "Fraud analysis with risk assessment and recommendations"
elif 'advice' in query_lower or 'help' in query_lower or 'recommend' in query_lower:
    agent = advisor_agent
    task_description = f"Provide financial advice for: {query}. Current balance: ${mock_balance}."
    expected_output = "Personalized financial advice with specific recommendations"
else:
    agent = inquiry_agent
    task_description = f"Handle general banking inquiry: {query}. Current balance: ${mock_balance}."
    expected_output = "Helpful response to banking inquiry"

# Create single task
task = Task(
    description=task_description,
    agent=agent,
    expected_output=expected_output
)

# Create the crew with simplified structure
crew = Crew(
    agents=[agent],
    tasks=[task],
    process=Process.sequential,
    verbose=True
)

try:
    result = crew.kickoff()
    
    # Format the response based on the type of request
    if 'balance' in query_lower:
        response_message = f"Your current account balance is ${mock_balance:.2f}. Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    elif 'transaction' in query_lower or 'transfer' in query_lower:
        response_message = f"Transaction processed successfully. {result}"
    elif 'fraud' in query_lower:
        response_message = f"Fraud analysis completed. ML Risk Score: {ml_result['risk_score']:.2f} ({ml_result['label']}). {result}"
    elif 'advice' in query_lower:
        response_message = f"Financial advice: {result}"
    else:
        response_message = result
    
    print(json.dumps({
        "success": True, 
        "message": response_message,
        "data": {
            "query": query,
            "userId": user_id,
            "balance": mock_balance,
            "timestamp": datetime.now().isoformat()
        }
    }))
    
except Exception as e:
    print(json.dumps({
        "success": False, 
        "error": str(e),
        "fallback": "Using fallback response due to CrewAI error"
    }))
    sys.exit(1)

# --- Semi-supervised fraud detection ---
def extract_features_from_query(query, amount, merchant, location):
    # Very basic feature extraction for demo
    features = [
        float(amount) if amount else 0.0,
        int(any(word in (merchant or '').lower() for word in ['electronics', 'jewelry', 'luxury', 'gaming', 'mall', 'overseas', 'unknown'])),
        int(any(word in (location or '').lower() for word in ['overseas', 'high-risk', 'unknown', 'mall', 'shopping center'])),
        int('suspicious' in query.lower() or 'fraud' in query.lower()),
        int('lost card' in query.lower() or 'block' in query.lower()),
    ]
    return np.array(features)

def load_labeled_fraud_data():
    data_path = os.path.join(os.path.dirname(__file__), 'training_data', 'fraud_training_data.json')
    if not os.path.exists(data_path):
        return [], []
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    X, y = [], []
    for entry in data:
        # Use the first user message in the conversation as the query
        user_msgs = [m['message'] for m in entry.get('conversation', []) if m['role'] == 'user']
        query = user_msgs[0] if user_msgs else ''
        # Use metadata if available, else random
        amount = 500 if 'not me' in query.lower() else 100
        merchant = 'unknown' if 'unknown' in query.lower() else 'grocery'
        location = 'unknown' if 'unknown' in query.lower() else 'local'
        X.append(extract_features_from_query(query, amount, merchant, location))
        y.append(1)  # All labeled as fraud
    return np.array(X), np.array(y)

def semi_supervised_fraud_detection(query, amount, merchant, location):
    # Load labeled data
    X_labeled, y_labeled = load_labeled_fraud_data()
    if len(X_labeled) < 2:
        return {'risk_score': 0.5, 'label': 'unknown', 'note': 'Insufficient labeled data'}
    # Generate a few pseudo-unlabeled samples (simulate)
    X_unlabeled = []
    for amt in [20, 50, 100, 200, 500, 1000]:
        X_unlabeled.append(extract_features_from_query('normal purchase', amt, 'grocery', 'local'))
    X_unlabeled = np.array(X_unlabeled)
    # Train initial model
    model = LogisticRegression()
    model.fit(X_labeled, y_labeled)
    # Pseudo-label
    pseudo_labels = model.predict(X_unlabeled)
    X_combined = np.vstack([X_labeled, X_unlabeled])
    y_combined = np.concatenate([y_labeled, pseudo_labels])
    # Retrain
    model.fit(X_combined, y_combined)
    # Predict for current query
    features = extract_features_from_query(query, amount, merchant, location).reshape(1, -1)
    risk_score = float(model.predict_proba(features)[0][1])
    label = 'fraud' if risk_score > 0.5 else 'not_fraud'
    return {'risk_score': risk_score, 'label': label, 'note': 'Semi-supervised model'} 