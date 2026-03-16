#!/bin/bash
# KETI Kiosk Dashboard
# Usage: bash run.sh [port]

PORT=${1:-8080}
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

mkdir -p video

echo ""
echo "  KETI Kiosk Dashboard 시작..."
echo ""

# Node 먼저 시도, 안되면 Python
if command -v node &>/dev/null; then
    echo "  [Node.js $(node -v)]"
    PORT=$PORT node server.js
elif command -v python3 &>/dev/null; then
    echo "  [Python3 $(python3 --version 2>&1 | cut -d' ' -f2)]"
    PORT=$PORT python3 server.py
elif command -v python &>/dev/null; then
    echo "  [Python $(python --version 2>&1 | cut -d' ' -f2)]"
    PORT=$PORT python server.py
else
    echo "  ❌ Node.js 또는 Python3 이 필요합니다"
    echo "     brew install node  또는  brew install python3"
    exit 1
fi
