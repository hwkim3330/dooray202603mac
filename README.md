# KETI Kiosk Dashboard

회의실 예약 현황 + 로컬 비디오 반복 재생 키오스크.

```
┌─────────────────────────────┬──────────────┐
│                             │  KETI 회의실  │
│     비디오 플레이어 (70%)     │   타임라인    │
│     로컬 mp4 자동 반복       │   (30%)      │
│                             │              │
├─────────────────────────────┤              │
│  ▶ 플레이리스트 (하단 스크롤)  │              │
└─────────────────────────────┴──────────────┘
```

## 요구사항

- **Node.js** (v10 이상, 구형 맥 OK)
- 외부 패키지 없음 (`npm install` 불필요)

### Node.js 설치 (맥)

```bash
# Homebrew 있으면
brew install node

# 없으면 공식 사이트에서 LTS 다운로드
# https://nodejs.org
# → macOS Installer (.pkg) 다운 후 더블클릭
```

> Homebrew 없는 구형 맥이면 https://nodejs.org/en/download 에서 `.pkg` 파일 받아서 설치하면 됩니다.

## 빠른 시작

```bash
# 1. 클론
git clone https://github.com/hwkim3330/dooray202603mac.git
cd dooray202603mac

# 2. 비디오 넣기
cp ~/Desktop/*.mp4 video/

# 3. 실행
bash run.sh
```

브라우저에서 **http://localhost:8080** 열기.

## 사용법

### 비디오

`video/` 폴더에 mp4 파일을 넣으면 **자동으로 인식**됩니다.

- `video_list.js` 수동 편집 불필요 (서버가 폴더를 스캔)
- 파일명 알파벳순 정렬 → 순서 지정하려면 번호 붙이기:
  ```
  video/
  ├── 01_인트로.mp4
  ├── 02_KETI소개.mp4
  └── 03_연구성과.mp4
  ```
- 마지막 영상이 끝나면 처음부터 다시 반복
- 하단 플레이리스트에서 클릭하면 즉시 이동
- 지원 포맷: `.mp4`, `.webm`, `.mov`

### 회의실 예약

- Dooray API를 서버가 프록시 → CORS/외부 프록시 문제 없음
- 3분마다 자동 갱신
- 현재 시간 빨간 바 표시

### 포트 변경

```bash
bash run.sh 3000
# → http://localhost:3000
```

### 전체 화면 키오스크 모드 (맥)

Safari 또는 Chrome에서:

```bash
# Chrome 키오스크 모드로 바로 열기
open -a "Google Chrome" --args --kiosk http://localhost:8080

# Safari: Cmd+Shift+F 로 전체화면
```

### 맥 부팅 시 자동 실행 (선택)

1. `시스템 설정` → `일반` → `로그인 항목`
2. `+` 클릭 → `run.sh` 선택

또는 LaunchAgent 사용:

```bash
cat > ~/Library/LaunchAgents/com.keti.kiosk.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.keti.kiosk</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>FULL_PATH_HERE/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
```

`FULL_PATH_HERE`를 실제 경로로 바꾸세요.

## 구조

```
dooray202603mac/
├── index.html      키오스크 화면 (비디오 + 회의실)
├── server.js       Node.js 서버 (정적파일 + API 프록시)
├── run.sh          실행 스크립트
├── video/          영상 파일 (mp4/webm/mov)
│   └── .gitkeep
└── worker/         Cloudflare Worker (선택, 별도 배포용)
```

## 문제 해결

| 증상 | 해결 |
|------|------|
| `node: command not found` | Node.js 설치 필요 (위 설치 방법 참고) |
| 비디오 안 나옴 | `video/` 폴더에 mp4 파일 있는지 확인 |
| 회의실 데이터 안 나옴 | 인터넷 연결 확인, Dooray 토큰 유효한지 확인 |
| 영상 끊김/버벅임 | 구형 맥이면 해상도 낮은 영상 사용 (720p 권장) |
| 포트 충돌 | `bash run.sh 9090` 등 다른 포트 사용 |
