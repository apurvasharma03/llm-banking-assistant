#!/usr/bin/env python3
"""
Data Loader for Synthetic Banking Dataset
Provides utilities to load and process synthetic data for CrewAI agents
"""

import json
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

class BankingDataLoader:
    def __init__(self, dataset_path: str):
        """Initialize the data loader with a dataset file"""
        self.dataset_path = dataset_path
        self.dataset = self._load_dataset()
        
    def _load_dataset(self) -> List[Dict[str, Any]]:
        """Load the dataset from JSON file"""
        try:
            with open(self.dataset_path, 'r', encoding='utf-8') as f:
                dataset = json.load(f)
            print(f"✅ Loaded {len(dataset)} conversations from {self.dataset_path}")
            return dataset
        except FileNotFoundError:
            print(f"❌ Dataset file not found: {self.dataset_path}")
            return []
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in dataset file: {self.dataset_path}")
            return []
    
    def get_conversations_by_intent(self, intent: str) -> List[Dict[str, Any]]:
        """Get all conversations for a specific intent"""
        return [conv for conv in self.dataset if conv.get('intent') == intent]
    
    def get_random_conversation(self, intent: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a random conversation, optionally filtered by intent"""
        if intent:
            conversations = self.get_conversations_by_intent(intent)
        else:
            conversations = self.dataset
        
        return random.choice(conversations) if conversations else None
    
    def get_conversations_for_agent(self, agent_type: str) -> List[Dict[str, Any]]:
        """Get conversations relevant for a specific agent type"""
        agent_intent_mapping = {
            "inquiry": ["balance_inquiry"],
            "transaction": ["transaction_request"],
            "fraud": ["fraud_alert"],
            "advisor": ["financial_advice"],
            "verification": ["account_management"]
        }
        
        intents = agent_intent_mapping.get(agent_type, [])
        conversations = []
        
        for intent in intents:
            conversations.extend(self.get_conversations_by_intent(intent))
        
        return conversations
    
    def get_training_data_for_agent(self, agent_type: str, num_samples: int = 100) -> List[Dict[str, Any]]:
        """Get training data for a specific agent"""
        conversations = self.get_conversations_for_agent(agent_type)
        
        # Sample the required number of conversations
        if len(conversations) > num_samples:
            conversations = random.sample(conversations, num_samples)
        
        return conversations
    
    def get_conversation_messages(self, conversation: Dict[str, Any]) -> List[str]:
        """Extract just the messages from a conversation"""
        return [msg['message'] for msg in conversation.get('conversation', [])]
    
    def get_user_messages(self, conversation: Dict[str, Any]) -> List[str]:
        """Extract user messages from a conversation"""
        return [msg['message'] for msg in conversation.get('conversation', []) 
                if msg.get('role') == 'user']
    
    def get_assistant_messages(self, conversation: Dict[str, Any]) -> List[str]:
        """Extract assistant messages from a conversation"""
        return [msg['message'] for msg in conversation.get('conversation', []) 
                if msg.get('role') == 'assistant']
    
    def get_dataset_statistics(self) -> Dict[str, Any]:
        """Get comprehensive statistics about the dataset"""
        if not self.dataset:
            return {}
        
        # Intent distribution
        intent_counts = {}
        for conv in self.dataset:
            intent = conv.get('intent', 'unknown')
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        # User profile statistics
        balances = [conv['user_profile']['balance'] for conv in self.dataset 
                   if 'user_profile' in conv and 'balance' in conv['user_profile']]
        
        account_types = {}
        for conv in self.dataset:
            if 'user_profile' in conv and 'account_type' in conv['user_profile']:
                acc_type = conv['user_profile']['account_type']
                account_types[acc_type] = account_types.get(acc_type, 0) + 1
        
        # Conversation statistics
        conversation_lengths = [len(conv.get('conversation', [])) for conv in self.dataset]
        
        return {
            "total_conversations": len(self.dataset),
            "intent_distribution": intent_counts,
            "account_type_distribution": account_types,
            "balance_statistics": {
                "min": min(balances) if balances else 0,
                "max": max(balances) if balances else 0,
                "average": sum(balances) / len(balances) if balances else 0
            },
            "conversation_statistics": {
                "min_length": min(conversation_lengths) if conversation_lengths else 0,
                "max_length": max(conversation_lengths) if conversation_lengths else 0,
                "average_length": sum(conversation_lengths) / len(conversation_lengths) if conversation_lengths else 0
            }
        }
    
    def export_agent_training_data(self, output_dir: str = "training_data"):
        """Export training data for each agent type"""
        import os
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        agent_types = ["inquiry", "transaction", "fraud", "advisor", "verification"]
        
        for agent_type in agent_types:
            training_data = self.get_training_data_for_agent(agent_type, num_samples=200)
            
            if training_data:
                filename = os.path.join(output_dir, f"{agent_type}_training_data.json")
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(training_data, f, indent=2, ensure_ascii=False)
                
                print(f"✅ Exported {len(training_data)} conversations for {agent_type} agent to {filename}")
    
    def get_conversation_for_crewai(self, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Format a conversation for use with CrewAI"""
        return {
            "conversation_id": conversation.get("conversation_id"),
            "user_id": conversation.get("user_id"),
            "intent": conversation.get("intent"),
            "user_name": conversation.get("user_name"),
            "messages": conversation.get("conversation", []),
            "user_profile": conversation.get("user_profile", {}),
            "metadata": conversation.get("metadata", {})
        }

def main():
    """Test the data loader"""
    print("🧪 Testing Banking Data Loader...")
    
    # Test with the generated dataset
    loader = BankingDataLoader("comprehensive_banking_dataset.json")
    
    if not loader.dataset:
        print("❌ No dataset loaded. Please generate a dataset first.")
        return
    
    # Get statistics
    stats = loader.get_dataset_statistics()
    print(f"\n📊 Dataset Statistics:")
    print(f"   Total conversations: {stats.get('total_conversations', 0)}")
    print(f"   Intent distribution: {stats.get('intent_distribution', {})}")
    
    # Test getting conversations by intent
    print(f"\n🔍 Testing conversation retrieval...")
    for intent in ["balance_inquiry", "fraud_alert", "financial_advice"]:
        conversations = loader.get_conversations_by_intent(intent)
        print(f"   {intent}: {len(conversations)} conversations")
    
    # Test getting training data for agents
    print(f"\n🤖 Testing agent training data...")
    for agent_type in ["inquiry", "fraud", "advisor"]:
        training_data = loader.get_training_data_for_agent(agent_type, num_samples=10)
        print(f"   {agent_type} agent: {len(training_data)} training samples")
    
    # Export training data
    print(f"\n📁 Exporting training data...")
    loader.export_agent_training_data()
    
    print("\n✅ Data loader test completed!")

if __name__ == "__main__":
    main() 