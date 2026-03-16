#!/bin/bash
# KETI Kiosk Dashboard - Mac Local Server
# Usage: bash run.sh [port]
#   port: 서버 포트 (기본 8080)

PORT=${1:-8080}
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  KETI Kiosk Dashboard"
echo "  http://localhost:${PORT}"
echo "============================================"
echo ""
echo "  video/ 폴더에 mp4 파일을 넣고"
echo "  video/video_list.js 에 파일명을 추가하세요"
echo ""
echo "  Ctrl+C 로 종료"
echo "============================================"

cd "$DIR"

# Python 3 내장 HTTP 서버 사용
if command -v python3 &>/dev/null; then
    python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
    python -m http.server "$PORT"
else
    echo "Error: python3 이 설치되어 있지 않습니다."
    exit 1
fi
