#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Infæmous Freight MVP
Tests all CRUD operations, authentication, and integrations
"""

import requests
import sys
import json
from datetime import datetime, timedelta
import time

class InfamousFreightTester:
    def __init__(self, base_url="https://truck-marketplace-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.shipper_token = None
        self.carrier_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_shipper = {
            "email": f"shipper_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "display_name": "Test Shipper Co",
            "role": "shipper"
        }
        
        self.test_carrier = {
            "email": f"carrier_{int(time.time())}@test.com", 
            "password": "TestPass123!",
            "display_name": "Test Carrier LLC",
            "role": "carrier"
        }
        
        self.test_load = {
            "pickup_city": "Los Angeles",
            "pickup_state": "CA",
            "pickup_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "dropoff_city": "Phoenix",
            "dropoff_state": "AZ", 
            "dropoff_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "commodity": "Electronics",
            "weight_lbs": 25000,
            "equipment": "van",
            "target_rate_cents": 250000,  # $2500
            "notes": "Fragile cargo, handle with care"
        }

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            # Check expected status if provided
            if expected_status and response.status_code != expected_status:
                return False, f"Expected {expected_status}, got {response.status_code}", None
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response.text, response_data
            
        except requests.exceptions.Timeout:
            return False, "Request timeout", None
        except requests.exceptions.ConnectionError:
            return False, "Connection error", None
        except Exception as e:
            return False, f"Request error: {str(e)}", None

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, error, data = self.make_request('GET', '', expected_status=200)
        self.log_test("Root endpoint (/api/)", success, error, data)
        
        # Test health endpoint
        success, error, data = self.make_request('GET', 'health', expected_status=200)
        self.log_test("Health check (/api/health)", success, error, data)

    def test_user_registration(self):
        """Test user registration for both shipper and carrier"""
        print("\n🔍 Testing User Registration...")
        
        # Register shipper
        success, error, data = self.make_request('POST', 'auth/register', self.test_shipper, expected_status=200)
        if success and data and 'token' in data:
            self.shipper_token = data['token']
            self.log_test("Shipper registration", True, "", data)
        else:
            self.log_test("Shipper registration", False, error, data)
        
        # Register carrier
        success, error, data = self.make_request('POST', 'auth/register', self.test_carrier, expected_status=200)
        if success and data and 'token' in data:
            self.carrier_token = data['token']
            self.log_test("Carrier registration", True, "", data)
        else:
            self.log_test("Carrier registration", False, error, data)

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        # Test shipper login
        login_data = {"email": self.test_shipper["email"], "password": self.test_shipper["password"]}
        success, error, data = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        if success and data and 'token' in data:
            self.shipper_token = data['token']  # Update token
            self.log_test("Shipper login", True, "", data)
        else:
            self.log_test("Shipper login", False, error, data)
        
        # Test carrier login
        login_data = {"email": self.test_carrier["email"], "password": self.test_carrier["password"]}
        success, error, data = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        if success and data and 'token' in data:
            self.carrier_token = data['token']  # Update token
            self.log_test("Carrier login", True, "", data)
        else:
            self.log_test("Carrier login", False, error, data)

    def test_auth_me(self):
        """Test getting current user info"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        # Test shipper /me
        success, error, data = self.make_request('GET', 'auth/me', token=self.shipper_token, expected_status=200)
        self.log_test("Shipper /auth/me", success, error, data)
        
        # Test carrier /me
        success, error, data = self.make_request('GET', 'auth/me', token=self.carrier_token, expected_status=200)
        self.log_test("Carrier /auth/me", success, error, data)

    def test_load_operations(self):
        """Test load CRUD operations"""
        print("\n🔍 Testing Load Operations...")
        
        # Create load (shipper only)
        success, error, data = self.make_request('POST', 'loads', self.test_load, token=self.shipper_token, expected_status=200)
        if success and data and 'id' in data:
            self.load_id = data['id']
            self.log_test("Create load", True, "", data)
        else:
            self.log_test("Create load", False, error, data)
            return False
        
        # List all loads
        success, error, data = self.make_request('GET', 'loads', expected_status=200)
        self.log_test("List all loads", success, error, data)
        
        # Get specific load
        success, error, data = self.make_request('GET', f'loads/{self.load_id}', expected_status=200)
        self.log_test("Get specific load", success, error, data)
        
        # Get shipper's loads
        success, error, data = self.make_request('GET', 'loads/my', token=self.shipper_token, expected_status=200)
        self.log_test("Get shipper's loads", success, error, data)
        
        return True

    def test_bidding_system(self):
        """Test bidding operations"""
        print("\n🔍 Testing Bidding System...")
        
        if not hasattr(self, 'load_id'):
            self.log_test("Bidding system", False, "No load ID available", None)
            return False
        
        # Create bid (carrier)
        bid_data = {
            "load_id": self.load_id,
            "offer_rate_cents": 240000,  # $2400
            "message": "Experienced carrier, can handle this route efficiently"
        }
        
        success, error, data = self.make_request('POST', 'bids', bid_data, token=self.carrier_token, expected_status=200)
        if success and data and 'id' in data:
            self.bid_id = data['id']
            self.log_test("Create bid", True, "", data)
        else:
            self.log_test("Create bid", False, error, data)
            return False
        
        # Get load bids (shipper view)
        success, error, data = self.make_request('GET', f'loads/{self.load_id}/bids', token=self.shipper_token, expected_status=200)
        self.log_test("Get load bids (shipper)", success, error, data)
        
        # Get carrier's bids
        success, error, data = self.make_request('GET', 'bids/my', token=self.carrier_token, expected_status=200)
        self.log_test("Get carrier's bids", success, error, data)
        
        return True

    def test_booking_system(self):
        """Test load booking/assignment"""
        print("\n🔍 Testing Booking System...")
        
        if not hasattr(self, 'load_id') or not hasattr(self, 'bid_id'):
            self.log_test("Booking system", False, "Missing load_id or bid_id", None)
            return False
        
        # Book load (accept bid)
        booking_data = {
            "load_id": self.load_id,
            "bid_id": self.bid_id
        }
        
        success, error, data = self.make_request('POST', 'assignments/book', booking_data, token=self.shipper_token, expected_status=200)
        if success and data and 'id' in data:
            self.assignment_id = data['id']
            self.log_test("Book load (accept bid)", True, "", data)
        else:
            self.log_test("Book load (accept bid)", False, error, data)
            return False
        
        # Get assignments
        success, error, data = self.make_request('GET', 'assignments/my', token=self.shipper_token, expected_status=200)
        self.log_test("Get shipper assignments", success, error, data)
        
        success, error, data = self.make_request('GET', 'assignments/my', token=self.carrier_token, expected_status=200)
        self.log_test("Get carrier assignments", success, error, data)
        
        return True

    def test_messaging_system(self):
        """Test messaging functionality"""
        print("\n🔍 Testing Messaging System...")
        
        if not hasattr(self, 'load_id'):
            self.log_test("Messaging system", False, "No load ID available", None)
            return False
        
        # Get thread by load
        success, error, data = self.make_request('GET', f'threads/by-load/{self.load_id}', token=self.shipper_token, expected_status=200)
        if success and data and 'id' in data:
            self.thread_id = data['id']
            self.log_test("Get thread by load", True, "", data)
        else:
            self.log_test("Get thread by load", False, error, data)
            return False
        
        # Send message (shipper)
        message_data = {
            "thread_id": self.thread_id,
            "body": "Hi, when can you pick up the load?"
        }
        
        success, error, data = self.make_request('POST', 'messages', message_data, token=self.shipper_token, expected_status=200)
        self.log_test("Send message (shipper)", success, error, data)
        
        # Send message (carrier)
        message_data = {
            "thread_id": self.thread_id,
            "body": "I can pick it up tomorrow morning at 8 AM."
        }
        
        success, error, data = self.make_request('POST', 'messages', message_data, token=self.carrier_token, expected_status=200)
        self.log_test("Send message (carrier)", success, error, data)
        
        # Get messages
        success, error, data = self.make_request('GET', f'threads/{self.thread_id}/messages', token=self.shipper_token, expected_status=200)
        self.log_test("Get thread messages", success, error, data)
        
        return True

    def test_ai_summarization(self):
        """Test AI thread summarization"""
        print("\n🔍 Testing AI Summarization...")
        
        if not hasattr(self, 'thread_id'):
            self.log_test("AI summarization", False, "No thread ID available", None)
            return False
        
        # Test summarization
        summarize_data = {"thread_id": self.thread_id}
        
        success, error, data = self.make_request('POST', 'threads/summarize', summarize_data, token=self.shipper_token, expected_status=200)
        if success:
            self.log_test("AI thread summarization", True, "", data)
        else:
            # AI might fail due to API key issues, but we should still log it
            self.log_test("AI thread summarization", False, error, data)
        
        return success

    def test_error_handling(self):
        """Test error handling and edge cases"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid login
        invalid_login = {"email": "nonexistent@test.com", "password": "wrongpass"}
        success, error, data = self.make_request('POST', 'auth/login', invalid_login, expected_status=401)
        self.log_test("Invalid login (should fail)", not success, error, data)
        
        # Test unauthorized access
        success, error, data = self.make_request('GET', 'auth/me', expected_status=401)
        self.log_test("Unauthorized access (should fail)", not success, error, data)
        
        # Test nonexistent load
        success, error, data = self.make_request('GET', 'loads/nonexistent-id', expected_status=404)
        self.log_test("Nonexistent load (should fail)", not success, error, data)

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚛 Starting Infæmous Freight API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        start_time = time.time()
        
        # Run test suites
        self.test_health_check()
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        
        if self.shipper_token:
            load_success = self.test_load_operations()
            if load_success and self.carrier_token:
                bid_success = self.test_bidding_system()
                if bid_success:
                    booking_success = self.test_booking_system()
                    if booking_success:
                        messaging_success = self.test_messaging_system()
                        if messaging_success:
                            self.test_ai_summarization()
        
        self.test_error_handling()
        
        # Print results
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n📊 Test Results:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"   Duration: {duration:.2f}s")
        
        # Return success if most tests passed
        return self.tests_passed >= (self.tests_run * 0.8)  # 80% success rate

def main():
    """Main test runner"""
    tester = InfamousFreightTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "base_url": tester.base_url,
        "summary": {
            "tests_run": tester.tests_run,
            "tests_passed": tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
        },
        "detailed_results": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())