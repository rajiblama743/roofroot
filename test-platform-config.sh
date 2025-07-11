#!/bin/bash

# RoofRoot Platform Configuration Test Script
# This script tests the platform-specific API configuration and backend connectivity

echo "🧪 RoofRoot Platform Configuration Test"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to test backend connectivity
test_backend_connectivity() {
    local url=$1
    local description=$2
    
    echo "🔍 Testing: $description"
    echo "📍 URL: $url"
    
    # Test with curl
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        print_status "SUCCESS" "Backend is accessible at $url"
        return 0
    else
        print_status "ERROR" "Backend not accessible at $url (HTTP $response)"
        return 1
    fi
}

# Function to get computer's IP address
get_computer_ip() {
    local ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    echo "$ip"
}

# Function to test network connectivity
test_network_connectivity() {
    echo "🌐 Testing network connectivity..."
    
    if ping -c 1 google.com >/dev/null 2>&1; then
        print_status "SUCCESS" "Internet connectivity is working"
        return 0
    else
        print_status "ERROR" "No internet connectivity"
        return 1
    fi
}

# Function to check if backend is running
check_backend_running() {
    echo "🔍 Checking if backend server is running..."
    
    if pgrep -f "node server.js" >/dev/null; then
        print_status "SUCCESS" "Backend server is running"
        return 0
    else
        print_status "ERROR" "Backend server is not running"
        return 1
    fi
}

# Function to start backend if not running
start_backend_if_needed() {
    if ! check_backend_running; then
        echo ""
        print_status "INFO" "Attempting to start backend server..."
        
        # Check if we're in the right directory
        if [ ! -f "backend/server.js" ]; then
            print_status "ERROR" "Backend directory not found. Please run this script from the RoofRoot project root."
            exit 1
        fi
        
        # Start backend in background
        cd backend && npm start >/dev/null 2>&1 &
        BACKEND_PID=$!
        
        # Wait a moment for server to start
        sleep 3
        
        if check_backend_running; then
            print_status "SUCCESS" "Backend server started successfully (PID: $BACKEND_PID)"
        else
            print_status "ERROR" "Failed to start backend server"
            exit 1
        fi
    fi
}

# Function to test platform-specific URLs
test_platform_urls() {
    echo ""
    echo "📱 Testing Platform-Specific URLs"
    echo "================================"
    
    local computer_ip=$(get_computer_ip)
    local android_url="http://10.0.2.2:3000"
    local ios_url="http://$computer_ip:3000"
    local localhost_url="http://localhost:3000"
    
    echo "📍 Computer IP: $computer_ip"
    echo ""
    
    # Test Android URL (10.0.2.2)
    test_backend_connectivity "$android_url" "Android Emulator URL"
    android_result=$?
    
    # Test iOS URL (computer IP)
    test_backend_connectivity "$ios_url" "iOS Simulator/Physical Device URL"
    ios_result=$?
    
    # Test localhost URL
    test_backend_connectivity "$localhost_url" "Localhost URL"
    localhost_result=$?
    
    echo ""
    echo "📊 Platform URL Test Results:"
    echo "============================="
    
    if [ $android_result -eq 0 ]; then
        print_status "SUCCESS" "Android URL ($android_url) - ✅ Working"
    else
        print_status "ERROR" "Android URL ($android_url) - ❌ Not accessible"
    fi
    
    if [ $ios_result -eq 0 ]; then
        print_status "SUCCESS" "iOS URL ($ios_url) - ✅ Working"
    else
        print_status "ERROR" "iOS URL ($ios_url) - ❌ Not accessible"
    fi
    
    if [ $localhost_result -eq 0 ]; then
        print_status "SUCCESS" "Localhost URL ($localhost_url) - ✅ Working"
    else
        print_status "ERROR" "Localhost URL ($localhost_url) - ❌ Not accessible"
    fi
    
    # Overall result
    if [ $android_result -eq 0 ] && [ $ios_result -eq 0 ]; then
        print_status "SUCCESS" "All platform URLs are working correctly!"
        return 0
    else
        print_status "ERROR" "Some platform URLs are not accessible"
        return 1
    fi
}

# Function to test backend endpoints
test_backend_endpoints() {
    echo ""
    echo "🔧 Testing Backend Endpoints"
    echo "============================"
    
    local base_url="http://localhost:3000"
    
    # Test health endpoint
    echo "🔍 Testing /health endpoint..."
    health_response=$(curl -s "$base_url/health")
    if [ $? -eq 0 ] && echo "$health_response" | grep -q "status"; then
        print_status "SUCCESS" "Health endpoint is working"
        echo "📄 Response: $health_response"
    else
        print_status "ERROR" "Health endpoint failed"
    fi
    
    # Test ping endpoint
    echo "🔍 Testing /ping endpoint..."
    ping_response=$(curl -s "$base_url/ping")
    if [ $? -eq 0 ] && echo "$ping_response" | grep -q "pong"; then
        print_status "SUCCESS" "Ping endpoint is working"
        echo "📄 Response: $ping_response"
    else
        print_status "ERROR" "Ping endpoint failed"
    fi
    
    echo ""
}

# Function to display configuration summary
display_configuration_summary() {
    echo ""
    echo "📋 Configuration Summary"
    echo "======================="
    
    local computer_ip=$(get_computer_ip)
    
    echo "🏗️  Environment: Development"
    echo "🌐 Computer IP: $computer_ip"
    echo "🔧 Backend Port: 3000"
    echo ""
    echo "📱 Platform-Specific URLs:"
    echo "  • Android Emulator: http://10.0.2.2:3000"
    echo "  • iOS Simulator: http://$computer_ip:3000"
    echo "  • Physical Devices: http://$computer_ip:3000"
    echo "  • Localhost: http://localhost:3000"
    echo ""
    echo "📁 Configuration Files:"
    echo "  • src/config/apiConfig.ts - Centralized API configuration"
    echo "  • src/firebase/googleCloudStorage.ts - Uses centralized config"
    echo "  • src/components/ListingForm.tsx - Uses centralized config"
    echo ""
}

# Function to provide troubleshooting tips
provide_troubleshooting_tips() {
    echo ""
    echo "🔧 Troubleshooting Tips"
    echo "======================"
    
    echo "1. If Android URL fails:"
    echo "   • Ensure backend is running on localhost:3000"
    echo "   • Android emulator uses 10.0.2.2 to access host's localhost"
    echo ""
    
    echo "2. If iOS URL fails:"
    echo "   • Check if your computer's IP address is correct"
    echo "   • Ensure device/simulator is on same WiFi network"
    echo "   • Update IP in src/config/apiConfig.ts if needed"
    echo ""
    
    echo "3. If backend won't start:"
    echo "   • Check if Node.js is installed: node --version"
    echo "   • Check if dependencies are installed: cd backend && npm install"
    echo "   • Check if service account key exists: ls backend/service-account-key.json"
    echo ""
    
    echo "4. For React Native testing:"
    echo "   • Add PlatformTest component to your app"
    echo "   • Check console logs for platform detection"
    echo "   • Use BackendTest component for detailed connectivity testing"
    echo ""
}

# Main execution
main() {
    echo "🚀 Starting RoofRoot Platform Configuration Test"
    echo "=============================================="
    echo ""
    
    # Test 1: Network connectivity
    test_network_connectivity
    network_result=$?
    
    # Test 2: Check and start backend if needed
    start_backend_if_needed
    backend_result=$?
    
    # Test 3: Test platform-specific URLs
    test_platform_urls
    platform_result=$?
    
    # Test 4: Test backend endpoints
    test_backend_endpoints
    
    # Display configuration summary
    display_configuration_summary
    
    # Provide troubleshooting tips
    provide_troubleshooting_tips
    
    # Final summary
    echo ""
    echo "📊 Test Summary"
    echo "==============="
    
    if [ $network_result -eq 0 ]; then
        print_status "SUCCESS" "Network connectivity: ✅ Working"
    else
        print_status "ERROR" "Network connectivity: ❌ Failed"
    fi
    
    if [ $backend_result -eq 0 ]; then
        print_status "SUCCESS" "Backend server: ✅ Running"
    else
        print_status "ERROR" "Backend server: ❌ Not running"
    fi
    
    if [ $platform_result -eq 0 ]; then
        print_status "SUCCESS" "Platform URLs: ✅ All working"
    else
        print_status "ERROR" "Platform URLs: ❌ Some failed"
    fi
    
    echo ""
    if [ $network_result -eq 0 ] && [ $backend_result -eq 0 ] && [ $platform_result -eq 0 ]; then
        print_status "SUCCESS" "🎉 All tests passed! Your platform configuration is working correctly."
        echo ""
        echo "💡 Next steps:"
        echo "   • Run your React Native app"
        echo "   • Test image upload functionality"
        echo "   • Check console logs for platform detection"
    else
        print_status "ERROR" "⚠️  Some tests failed. Please check the troubleshooting tips above."
        echo ""
        echo "💡 To fix issues:"
        echo "   • Follow the troubleshooting tips above"
        echo "   • Check backend logs: cd backend && npm start"
        echo "   • Test manually: curl http://localhost:3000/health"
    fi
    
    echo ""
    echo "🏁 Test completed at $(date)"
}

# Run the main function
main 