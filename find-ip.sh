#!/bin/bash

echo "🔍 Finding your computer's IP address..."
echo ""

# Detect OS and get IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 macOS detected"
    echo "Your computer's IP address(es):"
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  " $2}'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Linux detected"
    echo "Your computer's IP address(es):"
    hostname -I | tr ' ' '\n' | grep -v '^$' | sed 's/^/  /'
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    echo "🪟 Windows detected"
    echo "Your computer's IP address(es):"
    ipconfig | grep "IPv4" | awk '{print "  " $NF}'
else
    echo "❓ Unknown OS: $OSTYPE"
    echo "Please run one of these commands manually:"
    echo "  macOS/Linux: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo "  Windows: ipconfig"
fi

echo ""
echo "💡 Use one of these IP addresses in your React Native app configuration."
echo "   The app will now automatically detect the correct IP when you start the backend server!"
echo ""
echo "🚀 To start the backend server:"
echo "   cd backend && npm start" 