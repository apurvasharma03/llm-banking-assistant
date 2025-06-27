print("[DEBUG] chatbot_response_test.py script started")

import requests
import csv
import time
import subprocess
import sys
import os
import signal
import time
import json
import platform
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
import base64
import xml.sax.saxutils
import argparse
import socket

# Configuration
API_URL = "http://localhost:3001/api/chat"
HEALTH_URL = "http://localhost:3001/health"
OUTPUT_CSV = "chatbot_test_results.csv"

# Use a valid customer ID from the customers.json file
TEST_CUSTOMER_ID = "8455d7af-01b7-4570-9984-1c7b1fe28aa5"  # Mariah Martin

def load_test_cases(filename='chatbot_test_cases.json'):
    """Load test cases from external JSON file"""
    test_cases_file = os.path.join(os.path.dirname(__file__), filename)
    with open(test_cases_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def start_server():
    """Start the backend server with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Starting server (attempt {attempt + 1}/{max_retries})...")
            
            # Check if port is available before starting
            if not check_port_available():
                print("Port 3001 is in use, waiting for it to be released...")
                if not wait_for_port_release():
                    print("Port still in use, forcing cleanup...")
                    # Force cleanup any remaining processes
                    if platform.system() == "Windows":
                        subprocess.run(["taskkill", "/F", "/IM", "node.exe"], capture_output=True, text=True)
                    time.sleep(5)
            
            # First, ensure the dist directory exists and is built
            dist_dir = os.path.join(os.getcwd(), 'dist')
            if not os.path.exists(dist_dir):
                print("Building TypeScript project...")
                try:
                    subprocess.run(["npm", "run", "build"], cwd=".", check=True, shell=True)
                    print("Build completed successfully")
                except subprocess.CalledProcessError as e:
                    print(f"Build failed: {e}")
                    raise
            
            # Start the server using npm run dev for development mode
            print("Starting server with npm run dev...")
            server_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=".",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                shell=True
            )
            
            # Wait for server to start
            print("Waiting for server to start...")
            for i in range(30):  # Wait up to 30 seconds
                if check_server_health():
                    print("Server started successfully")
                    return server_process
                time.sleep(1)
            
            # If we get here, server didn't start properly
            print("Server didn't start properly, stopping and retrying...")
            stop_server(server_process)
            time.sleep(5)
            
        except Exception as e:
            print(f"Error starting server (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                print("Retrying...")
                time.sleep(5)
            else:
                raise Exception(f"Failed to start server after {max_retries} attempts")
    
    raise Exception("Failed to start server after all retries")

def stop_server(server_process):
    """Stop the backend server with better cleanup"""
    if server_process:
        print("Stopping server...")
        try:
            # Try graceful termination first
            server_process.terminate()
            server_process.wait(timeout=10)
            print("Server stopped gracefully")
        except subprocess.TimeoutExpired:
            print("Server didn't stop gracefully, forcing termination...")
            try:
                server_process.kill()
                server_process.wait(timeout=5)
                print("Server force stopped")
            except subprocess.TimeoutExpired:
                print("Warning: Server process may still be running")
        
        # Additional cleanup for Windows
        if platform.system() == "Windows":
            try:
                # Kill any remaining processes on port 3001
                subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
                subprocess.run(["taskkill", "/F", "/IM", "node.exe"], capture_output=True, text=True)
            except Exception as e:
                print(f"Warning: Could not clean up Windows processes: {e}")
        
        # Wait a bit more to ensure port is released
        time.sleep(3)

def check_port_available(port=3001):
    """Check if the port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result != 0  # Port is available if connection fails
    except Exception:
        return False

def wait_for_port_release(port=3001, max_wait=30):
    """Wait for port to be released"""
    print(f"Waiting for port {port} to be released...")
    for i in range(max_wait):
        if check_port_available(port):
            print(f"Port {port} is now available")
            return True
        time.sleep(1)
    print(f"Warning: Port {port} may still be in use after {max_wait} seconds")
    return False

def create_test_charts(results):
    """Create matplotlib charts for the test results"""
    charts = []
    
    # 1. Pass/Fail Pie Chart
    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Pie chart
    labels = ['Passed', 'Failed']
    sizes = [passed, failed]
    colors_pie = ['#2ecc71', '#e74c3c']
    ax1.pie(sizes, labels=labels, colors=colors_pie, autopct='%1.1f%%', startangle=90)
    ax1.set_title('Test Results Overview')
    
    # Bar chart
    categories = ['Passed', 'Failed']
    counts = [passed, failed]
    bars = ax2.bar(categories, counts, color=colors_pie)
    ax2.set_title('Test Results Count')
    ax2.set_ylabel('Number of Tests')
    
    # Add value labels on bars
    for bar, count in zip(bars, counts):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                f'{count}', ha='center', va='bottom')
    
    plt.tight_layout()
    
    # Save chart to bytes
    chart_buffer = io.BytesIO()
    plt.savefig(chart_buffer, format='png', dpi=300, bbox_inches='tight')
    chart_buffer.seek(0)
    charts.append(chart_buffer)
    plt.close()
    
    # 2. Response Time Chart
    successful_times = [r["response_time_sec"] for r in results if r["response_time_sec"] is not None]
    if successful_times:
        fig, ax = plt.subplots(figsize=(10, 6))
        test_numbers = [i+1 for i, r in enumerate(results) if r["response_time_sec"] is not None]
        ax.bar(test_numbers, successful_times, color='#3498db', alpha=0.7)
        ax.set_xlabel('Test Number')
        ax.set_ylabel('Response Time (seconds)')
        ax.set_title('Response Times by Test')
        ax.grid(True, alpha=0.3)
        
        # Add average line
        avg_time = sum(successful_times) / len(successful_times)
        ax.axhline(y=avg_time, color='red', linestyle='--', label=f'Average: {avg_time:.3f}s')
        ax.legend()
        
        plt.tight_layout()
        
        # Save chart to bytes
        chart_buffer = io.BytesIO()
        plt.savefig(chart_buffer, format='png', dpi=300, bbox_inches='tight')
        chart_buffer.seek(0)
        charts.append(chart_buffer)
        plt.close()
    
    return charts

def generate_pdf_report(results, output_path):
    """Generate a comprehensive PDF test report"""
    # Use a consistent filename that will replace the old PDF
    pdf_path = os.path.join(os.path.dirname(output_path), "chatbot_test_report.pdf")
    print(f"[DEBUG] PDF report path: {pdf_path}")
    
    # Delete ALL old PDF reports in the backend directory
    backend_dir = os.path.dirname(output_path) if output_path else os.getcwd()
    if not backend_dir:
        backend_dir = os.getcwd()
    
    deleted_files = []
    try:
        for filename in os.listdir(backend_dir):
            if filename.lower().endswith('.pdf'):
                old_pdf_path = os.path.join(backend_dir, filename)
                try:
                    os.remove(old_pdf_path)
                    deleted_files.append(filename)
                    print(f"[DEBUG] Deleted old PDF report: {filename}")
                except Exception as e:
                    print(f"[DEBUG] Warning: Could not delete old PDF report {filename}: {e}")
    except Exception as e:
        print(f"[DEBUG] Warning: Could not list directory {backend_dir}: {e}")
    
    if not deleted_files:
        print(f"[DEBUG] No old PDF reports to delete.")
    else:
        print(f"[DEBUG] Deleted {len(deleted_files)} old PDF report(s): {', '.join(deleted_files)}")
    
    print(f"[DEBUG] Generating new PDF report...")
    doc = SimpleDocTemplate(pdf_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    title = Paragraph("Banking Chatbot Test Report", title_style)
    story.append(title)
    
    # Date and time
    date_style = ParagraphStyle(
        'Date',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    date_text = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style)
    story.append(date_text)
    story.append(Spacer(1, 20))
    
    # Summary statistics
    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed
    success_rate = (passed / len(results)) * 100 if results else 0
    
    summary_data = [
        ['Metric', 'Value'],
        ['Total Tests', str(len(results))],
        ['Passed', str(passed)],
        ['Failed', str(failed)],
        ['Success Rate', f'{success_rate:.1f}%']
    ]
    
    # Add average response time if available
    successful_times = [r["response_time_sec"] for r in results if r["response_time_sec"] is not None]
    if successful_times:
        avg_time = sum(successful_times) / len(successful_times)
        summary_data.append(['Average Response Time', f'{avg_time:.3f} seconds'])
    
    summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(Paragraph("Test Summary", styles['Heading2']))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Add charts
    charts = create_test_charts(results)
    for i, chart_buffer in enumerate(charts):
        chart_buffer.seek(0)
        img = Image(chart_buffer, width=6*inch, height=3*inch)
        story.append(img)
        story.append(Spacer(1, 10))
    
    # Detailed test results table
    story.append(Paragraph("Detailed Test Results", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    # Prepare table data
    table_data = [['Test ID', 'Input', 'Status', 'Response Time', 'Notes']]
    for result in results:
        status = "PASS" if result["passed"] else "FAIL"
        status_color = colors.green if result["passed"] else colors.red
        response_time = f"{result['response_time_sec']:.3f}s" if result["response_time_sec"] else "N/A"
        
        # Truncate long inputs
        input_text = result["input"][:50] + "..." if len(result["input"]) > 50 else result["input"]
        
        table_data.append([
            str(result["test_id"]),
            input_text,
            status,
            response_time,
            result.get("notes", "")
        ])
    
    # Create table with styling
    test_table = Table(table_data, colWidths=[0.5*inch, 2.5*inch, 0.8*inch, 1*inch, 1.2*inch])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))
    
    story.append(test_table)
    story.append(Spacer(1, 20))
    
    # Failed tests details
    failed_tests = [r for r in results if not r["passed"]]
    if failed_tests:
        story.append(Paragraph("Failed Tests Details", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        for test in failed_tests:
            safe_input = xml.sax.saxutils.escape(str(test['input']))
            safe_expected = xml.sax.saxutils.escape(str(test['expected']))
            safe_actual = xml.sax.saxutils.escape(str(test['actual'][:200]))
            story.append(Paragraph(f"<b>Test {test['test_id']}: {safe_input}</b>", styles['Normal']))
            story.append(Paragraph(f"Expected: {safe_expected}", styles['Normal']))
            story.append(Paragraph(f"Actual: {safe_actual}...", styles['Normal']))
            story.append(Spacer(1, 10))
    
    # Build PDF
    doc.build(story)
    print(f"PDF report generated: {pdf_path}")
    return pdf_path

def check_server_health():
    """Check if the server is healthy"""
    try:
        response = requests.get(HEALTH_URL, timeout=5)
        return response.status_code == 200
    except Exception:
        return False

def save_results(results, output_file):
    """Save test results to CSV file"""
    with open(output_file, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["test_id", "input", "expected", "actual", "passed", "response_time_sec", "notes"])
        writer.writeheader()
        writer.writerows(results)
    print(f"Results saved to {output_file}")

def create_test_report(results, report_file):
    """Create test report and save to PDF"""
    generate_pdf_report(results, report_file)
    print(f"PDF report generated: {report_file}")

def print_summary(results):
    """Print test summary"""
    num_passed = sum(r["passed"] for r in results)
    num_failed = len(results) - num_passed
    print(f"\n{'='*60}")
    print(f"TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Total tests: {len(results)}")
    print(f"Passed: {num_passed}")
    print(f"Failed: {num_failed}")
    print(f"Success rate: {(num_passed/len(results)*100):.1f}%")
    
    if num_failed > 0:
        print(f"\nFailed tests:")
        for result in results:
            if not result["passed"]:
                print(f"  Test {result['test_id']}: {result['input']}")
                print(f"    Expected: {result['expected']}")
                print(f"    Actual: {result['actual'][:100]}...")
    
    successful_times = [r["response_time_sec"] for r in results if r["response_time_sec"] is not None]
    if successful_times:
        avg_time = sum(successful_times) / len(successful_times)
        max_time = max(successful_times)
        min_time = min(successful_times)
        print(f"\nResponse Time Statistics:")
        print(f"  Average: {avg_time:.2f} seconds")
        print(f"  Maximum: {max_time:.2f} seconds")
        print(f"  Minimum: {min_time:.2f} seconds")
    
    print(f"{'='*60}")

def test_chatbot_response(test_case, test_number):
    """Test a single chatbot response"""
    try:
        payload = {
            "message": test_case["input"],
            "customer_id": TEST_CUSTOMER_ID
        }
        
        start_time = time.time()
        response = requests.post(API_URL, json=payload, timeout=60)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            actual = data.get("reply", "")
            print(f"Response received in {elapsed:.2f}s")
        else:
            actual = f"HTTP {response.status_code}: {response.text}"
            elapsed = None
            print(f"HTTP Error: {response.status_code}")
        
        # Improved matching logic for better test accuracy
        expected_lower = test_case["expected"].lower()
        actual_lower = actual.lower()
        
        # Check for exact keyword match or semantic match
        passed = False
        if expected_lower in actual_lower:
            passed = True
        else:
            # Handle semantic matches for common banking terms
            semantic_matches = {
                'account balance': ['balance', 'account', 'checking', 'savings'],
                'recent transactions': ['transaction', 'recent', 'latest', 'history'],
                'lost card': ['lost', 'stolen', 'card', 'report'],
                'transfer': ['transfer', 'send', 'move', 'money'],
                'branch hours': ['branch', 'hours', 'business', 'open'],
                'account': ['account', 'balance', 'information'],
                'interest': ['interest', 'rate', 'apy'],
                'password': ['password', 'reset', 'forgot'],
                'account details': ['account', 'details', 'information'],
                'fraud': ['fraud', 'suspicious', 'unauthorized', 'activity'],
                'checking account balance': ['checking', 'balance', 'account'],
                'savings account transactions': ['savings', 'transaction', 'account'],
                'bill payment': ['bill', 'payment', 'pay'],
                'cancel transaction': ['cancel', 'transaction'],
                'transfer status': ['transfer', 'status'],
                'suspicious activity': ['suspicious', 'activity', 'fraud'],
                'spending trends': ['spending', 'trends', 'analysis'],
                'investment': ['investment', 'advice', 'recommend'],
                'set up account': ['set up', 'account', 'setup'],
                'nearest branch': ['nearest', 'branch', 'location'],
                'ATM withdrawal limits': ['atm', 'withdrawal', 'limit'],
                'lock card': ['lock', 'card', 'debit'],
                'unlock card': ['unlock', 'card', 'debit'],
                'credit card due date': ['credit', 'card', 'due', 'date'],
                'pending bill payments': ['pending', 'bill', 'payment'],
                'verify': ['verify', 'verification', 'identity'],
                'reporting fraud': ['report', 'fraud', 'process'],
                'budget': ['budget', 'expenses', 'spending'],
                'loan interest rates': ['loan', 'interest', 'rate'],
                'apply for a mortgage': ['mortgage', 'apply', 'application'],
                'last 10 transactions': ['transaction', 'last', 'recent'],
                'cancel payment': ['cancel', 'payment'],
                'loan balance': ['loan', 'balance'],
                'two-factor authentication': ['two-factor', 'authentication', 'security'],
                'business hours': ['business', 'hours', 'open'],
                'human agent': ['human', 'agent', 'representative'],
                'change address': ['change', 'address'],
                'minimum balance': ['minimum', 'balance'],
                'overdraft fees': ['overdraft', 'fees'],
                'close account': ['close', 'account'],
                'routing number': ['routing', 'number'],
                'order checks': ['order', 'checks'],
                'exchange rate': ['exchange', 'rate'],
                'dispute transaction': ['dispute', 'transaction'],
                'account number': ['account', 'number'],
                'direct deposit': ['direct', 'deposit'],
                'maximum daily withdrawal': ['maximum', 'withdrawal', 'limit'],
                'activate card': ['activate', 'card'],
                'loan application status': ['loan', 'application', 'status'],
                'automatic payments': ['automatic', 'payment'],
                'credit score': ['credit', 'score'],
                'credit limit increase': ['credit', 'limit', 'increase'],
                'late payment penalty': ['late', 'payment', 'penalty'],
                'update phone number': ['update', 'phone', 'number'],
                'closing an account': ['closing', 'account'],
                'set up alerts': ['set up', 'alerts'],
                'international transfer fee': ['international', 'transfer', 'fee'],
                'stolen card': ['stolen', 'card', 'report'],
                'joint account': ['joint', 'account'],
                'change pin': ['change', 'pin'],
                'interest rate': ['interest', 'rate'],
                'request a statement': ['request', 'statement'],
                'refinancing': ['refinancing', 'loan'],
                'recurring transfer': ['recurring', 'transfer'],
                'overdraft protection fee': ['overdraft', 'protection', 'fee'],
                'paperless statements': ['paperless', 'statements'],
                'disputing a charge': ['disputing', 'charge'],
                'mobile banking': ['mobile', 'banking'],
                'international transfer': ['international', 'transfer'],
                'replacement card': ['replacement', 'card'],
                'wire transfer fee': ['wire', 'transfer', 'fee'],
                'account notifications': ['account', 'notifications'],
                'updating beneficiary': ['updating', 'beneficiary'],
                'stop payment': ['stop', 'payment'],
                'business account': ['business', 'account'],
                'online bill pay': ['online', 'bill', 'pay'],
                'closing a credit card': ['closing', 'credit', 'card'],
                'travel notice': ['travel', 'notice'],
                'disputing a transaction': ['disputing', 'transaction'],
                'trust account': ['trust', 'account'],
                'updating email address': ['updating', 'email', 'address'],
                'payoff amount': ['payoff', 'amount'],
                'wire transfer': ['wire', 'transfer'],
                'custodial account': ['custodial', 'account'],
                'updating mailing address': ['updating', 'mailing', 'address'],
                'credit report': ['credit', 'report'],
                'direct debit': ['direct', 'debit'],
                'student account': ['student', 'account'],
                'updating security questions': ['updating', 'security', 'questions'],
                'loan payoff statement': ['loan', 'payoff', 'statement'],
                'balance transfer': ['balance', 'transfer'],
                'recurring payment': ['recurring', 'payment'],
                'savings account': ['savings', 'account'],
                'updating address': ['updating', 'address'],
                'credit card': ['credit', 'card'],
                'new account': ['new', 'account'],
                'checking account': ['checking', 'account'],
                'statement copy': ['statement', 'copy'],
                'money market account': ['money', 'market', 'account'],
                'loan statement': ['loan', 'statement'],
                'health savings account': ['health', 'savings', 'account'],
                'mortgage statement': ['mortgage', 'statement'],
                'retirement account': ['retirement', 'account'],
                'personal loan': ['personal', 'loan'],
                'certificate of deposit': ['certificate', 'deposit'],
                'home equity loan': ['home', 'equity', 'loan'],
                'business savings account': ['business', 'savings', 'account'],
                'car loan': ['car', 'loan'],
                'new credit card': ['new', 'credit', 'card'],
                'business checking account': ['business', 'checking', 'account'],
                'loan payoff amount': ['loan', 'payoff', 'amount'],
                'business loan': ['business', 'loan'],
                'mortgage payoff amount': ['mortgage', 'payoff', 'amount'],
                'student loan': ['student', 'loan'],
                'business credit card': ['business', 'credit', 'card'],
                'personal loan payoff amount': ['personal', 'loan', 'payoff', 'amount'],
                'business money market account': ['business', 'money', 'market', 'account'],
                'student loan payoff amount': ['student', 'loan', 'payoff', 'amount'],
                'business certificate of deposit': ['business', 'certificate', 'deposit'],
                'business loan payoff amount': ['business', 'loan', 'payoff', 'amount'],
                'business trust account': ['business', 'trust', 'account'],
                'business credit card payoff amount': ['business', 'credit', 'card', 'payoff', 'amount'],
                'business money market account': ['business', 'money', 'market', 'account'],
                'business savings account payoff amount': ['business', 'savings', 'account', 'payoff', 'amount'],
                'business certificate of deposit': ['business', 'certificate', 'deposit'],
                'business trust account payoff amount': ['business', 'trust', 'account', 'payoff', 'amount'],
                'business health savings account': ['business', 'health', 'savings', 'account'],
                'business health savings account payoff amount': ['business', 'health', 'savings', 'account', 'payoff', 'amount'],
                'business retirement account': ['business', 'retirement', 'account'],
                'business retirement account payoff amount': ['business', 'retirement', 'account', 'payoff', 'amount'],
                'business student account': ['business', 'student', 'account'],
                'business student account payoff amount': ['business', 'student', 'account', 'payoff', 'amount'],
                'business car loan': ['business', 'car', 'loan'],
                'business car loan payoff amount': ['business', 'car', 'loan', 'payoff', 'amount'],
                'business mortgage': ['business', 'mortgage'],
                'business mortgage payoff amount': ['business', 'mortgage', 'payoff', 'amount'],
                'business investment account': ['business', 'investment', 'account'],
                'business investment account payoff amount': ['business', 'investment', 'account', 'payoff', 'amount'],
                'business certificate of deposit payoff amount': ['business', 'certificate', 'deposit', 'payoff', 'amount']
            }
            
            if expected_lower in semantic_matches:
                for keyword in semantic_matches[expected_lower]:
                    if keyword in actual_lower:
                        passed = True
                        break
        
        status = "PASS" if passed else "FAIL"
        print(f"Test {test_number} {status}: {actual}")
        
        return {
            "test_id": test_number,
            "input": test_case["input"],
            "expected": test_case["expected"],
            "actual": actual,
            "passed": passed,
            "response_time_sec": elapsed,
            "notes": test_case.get("notes", "")
        }
        
    except Exception as e:
        print(f"Error in test {test_number}: {e}")
        return {
            'test_id': test_number,
            'input': test_case["input"],
            'expected': test_case["expected"],
            'passed': False,
            'actual': f'Test error: {str(e)}',
            'response_time_sec': None,
            'notes': f'Test error: {str(e)}'
        }

def main():
    """Main test execution function"""
    parser = argparse.ArgumentParser(description='Test banking chatbot responses')
    parser.add_argument('--test-file', default='chatbot_test_cases.json', help='Test cases file')
    parser.add_argument('--output-file', default='chatbot_test_results.csv', help='Output CSV file')
    parser.add_argument('--report-file', default='chatbot_test_report.pdf', help='Output PDF report')
    parser.add_argument('--start-test', type=int, default=1, help='Start from test number')
    parser.add_argument('--end-test', type=int, help='End at test number')
    parser.add_argument('--restart-interval', type=int, default=40, help='Restart server every N tests')
    
    args = parser.parse_args()
    
    # Load test cases
    test_cases = load_test_cases(args.test_file)
    
    if args.end_test:
        test_cases = test_cases[args.start_test-1:args.end_test]
    else:
        test_cases = test_cases[args.start_test-1:]
    
    print(f"Running {len(test_cases)} tests starting from test {args.start_test}")
    
    results = []
    server_process = None
    test_count = 0
    
    try:
        # Start server initially
        server_process = start_server()
        
        for i, test_case in enumerate(test_cases):
            test_number = args.start_test + i
            test_count += 1
            
            print(f"\n{'='*60}")
            print(f"Running Test {test_number}: {test_case.get('notes', test_case['input'])}")
            print(f"Input: {test_case['input']}")
            print(f"Expected: {test_case['expected']}")
            print(f"{'='*60}")
            
            # Restart server every N tests to prevent resource issues
            if test_count % args.restart_interval == 0 and test_count > 1:
                print(f"\nRestarting server after {args.restart_interval} tests...")
                stop_server(server_process)
                time.sleep(5)  # Wait for cleanup
                server_process = start_server()
                print("Server restarted successfully")
            
            try:
                # Test the chatbot
                result = test_chatbot_response(test_case, test_number)
                results.append(result)
                
            except Exception as e:
                print(f"Error in test {test_number}: {e}")
                results.append({
                    'test_id': test_number,
                    'input': test_case["input"],
                    'expected': test_case["expected"],
                    'passed': False,
                    'actual': f'Test error: {str(e)}',
                    'response_time_sec': None,
                    'notes': f'Test error: {str(e)}'
                })
    
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Fatal error: {e}")
    finally:
        # Always stop the server
        if server_process:
            stop_server(server_process)
        
        # Save results
        output_path = args.output_file
        save_results(results, output_path)
        
        # Generate report
        pdf_path = args.report_file
        create_test_report(results, pdf_path)
        
        # Print summary
        print_summary(results)
    return 0

if __name__ == "__main__":
    exit(main()) 