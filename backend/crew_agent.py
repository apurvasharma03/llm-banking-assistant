import sys
import json
from crewai import Agent, Task, Crew, Process

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

# Example: Use the 'advisor' agent logic
query = input_data.get('query', 'Give me some financial advice.')

advisor = Agent(
    role='Financial Advisor',
    goal='Provide personalized financial advice and recommendations',
    backstory='I am a certified financial advisor with expertise in personal finance, investment strategies, and financial planning. I help customers make informed financial decisions.',
    verbose=False
)

task = Task(
    description=f"Provide financial advice for: {query}",
    agent=advisor
)

crew = Crew(
    agents=[advisor],
    tasks=[task],
    process=Process.sequential,
    verbose=False
)

try:
    result = crew.kickoff()
    print(json.dumps({"success": True, "message": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1) 