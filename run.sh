#!/bin/bash
# KETI Kiosk Dashboard - Mac Local Server
# Usage: bash run.sh [port]

PORT=${1:-8080}
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# video 폴더 확인
mkdir -p video

# Node.js 확인
if command -v node &>/dev/null; then
    NODE_VER=$(node -v)
    echo "Node.js ${NODE_VER} 사용"
    PORT=$PORT node server.js
else
    echo ""
    echo "  ❌ Node.js 가 설치되어 있지 않습니다."
    echo ""
    echo "  설치 방법:"
    echo "    brew install node"
    echo "    또는 https://nodejs.org 에서 LTS 다운로드"
    echo ""
    exit 1
fi
