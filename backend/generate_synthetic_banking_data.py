#!/usr/bin/env python3
"""
Generate a large, realistic synthetic banking dataset for testing agents.
Creates customers.json, accounts.json, transactions.json (with fraud labels), and optionally cards.json.
"""

import json
import random
from datetime import datetime, timedelta
import uuid
from faker import Faker

fake = Faker()

# Configurable sizes
NUM_CUSTOMERS = 1000
ACCOUNTS_PER_CUSTOMER = (1, 3)  # min, max
TRANSACTIONS_PER_ACCOUNT = (10, 20)  # min, max
FRAUD_RATE = 0.01  # 1% of transactions are fraudulent

ACCOUNT_TYPES = ["checking", "savings", "credit", "loan"]
TRANSACTION_TYPES = ["debit", "credit", "transfer", "payment"]
MERCHANTS = ["Amazon", "Netflix", "Starbucks", "Walmart", "Target", "Uber", "DoorDash", "Spotify", "Apple", "Google", "Shell", "Costco", "Best Buy", "CVS", "Home Depot"]
CATEGORIES = ["shopping", "food", "transportation", "entertainment", "utilities", "health", "travel", "bills"]

# 1. Generate Customers
def generate_customers(num_customers):
    customers = []
    for i in range(num_customers):
        customer_id = str(uuid.uuid4())
        created_date = fake.date_between(start_date="-10y", end_date="today")
        customers.append({
            "customer_id": customer_id,
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "address": fake.address().replace("\n", ", "),
            "dob": fake.date_of_birth(minimum_age=18, maximum_age=90).isoformat(),
            "credit_score": random.randint(300, 850),
            "income": round(random.uniform(20000, 200000), 2),
            "created_at": created_date.isoformat()
        })
    return customers

# 2. Generate Accounts
def generate_accounts(customers):
    accounts = []
    account_id_map = {}  # customer_id -> list of account_ids
    for customer in customers:
        num_accounts = random.randint(*ACCOUNTS_PER_CUSTOMER)
        account_ids = []
        customer_created = datetime.fromisoformat(customer["created_at"].split('T')[0])
        for _ in range(num_accounts):
            account_id = str(uuid.uuid4())
            account_type = random.choice(ACCOUNT_TYPES)
            open_date = fake.date_between(start_date=customer_created, end_date="today")
            balance = round(random.uniform(-5000, 100000), 2) if account_type != "loan" else -round(random.uniform(1000, 50000), 2)
            accounts.append({
                "account_id": account_id,
                "customer_id": customer["customer_id"],
                "account_type": account_type,
                "open_date": open_date.isoformat(),
                "status": random.choice(["active", "closed", "frozen"]),
                "balance": balance
            })
            account_ids.append(account_id)
        account_id_map[customer["customer_id"]] = account_ids
    return accounts, account_id_map

# 3. Generate Transactions
def generate_transactions(accounts):
    transactions = []
    fraud_count = 0
    for account in accounts:
        num_txns = random.randint(*TRANSACTIONS_PER_ACCOUNT)
        for _ in range(num_txns):
            txn_id = str(uuid.uuid4())
            txn_type = random.choice(TRANSACTION_TYPES)
            merchant = random.choice(MERCHANTS)
            category = random.choice(CATEGORIES)
            amount = round(random.uniform(1, 5000), 2)
            if txn_type == "debit" or txn_type == "payment":
                amount = -abs(amount)
            is_fraud = random.random() < FRAUD_RATE
            if is_fraud:
                fraud_count += 1
            txn_date = fake.date_time_between(start_date="-3y", end_date="now")
            transactions.append({
                "transaction_id": txn_id,
                "account_id": account["account_id"],
                "date": txn_date.isoformat(),
                "amount": amount,
                "type": txn_type,
                "merchant": merchant,
                "category": category,
                "description": f"{txn_type.title()} at {merchant}",
                "is_fraud": is_fraud
            })
    print(f"Total fraudulent transactions: {fraud_count}")
    return transactions

def main():
    print("Generating synthetic banking data...")
    print(f"Customers: {NUM_CUSTOMERS}")
    customers = generate_customers(NUM_CUSTOMERS)
    print("Accounts per customer:", ACCOUNTS_PER_CUSTOMER)
    accounts, account_id_map = generate_accounts(customers)
    print(f"Total accounts: {len(accounts)}")
    print("Transactions per account:", TRANSACTIONS_PER_ACCOUNT)
    transactions = generate_transactions(accounts)
    print(f"Total transactions: {len(transactions)}")

    # Save to JSON
    with open("customers.json", "w", encoding="utf-8") as f:
        json.dump(customers, f, indent=2)
    with open("accounts.json", "w", encoding="utf-8") as f:
        json.dump(accounts, f, indent=2)
    with open("transactions.json", "w", encoding="utf-8") as f:
        json.dump(transactions, f, indent=2)
    print("Data saved: customers.json, accounts.json, transactions.json")

if __name__ == "__main__":
    main() 