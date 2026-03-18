# KETI Kiosk Dashboard

Cloudflare Worker로 동작하는 키오스크 대시보드.

```
┌─────────────────────────────┬──────────────┐
│                             │  KETI 회의실  │
│     비디오 플레이어 (70%)     │   타임라인    │
│     URL 기반 자동 반복       │   (30%)      │
│                             │              │
├───────────────────────┬─────┤              │
│  ▶ 플레이리스트        │ ⚙  │              │
└───────────────────────┴─────┴──────────────┘
```

## 배포

```bash
git clone https://github.com/hwkim3330/dooray202603mac.git
cd dooray202603mac
npm install
npx wrangler login     # Cloudflare 계정 로그인
npx wrangler deploy    # 배포
```

배포 완료 시 출력되는 URL로 접속 (예: `https://dooray-kiosk.xxx.workers.dev`).

## 사용법

### 영상 추가

1. 하단 우측 **⚙** 버튼 클릭
2. **📁 파일 선택** → 로컬 mp4 파일 선택 (여러 개 가능)
3. 닫기 → 재생 시작

또는 비디오 영역에 파일을 **드래그 앤 드롭**해도 됩니다.

영상 파일은 **브라우저 IndexedDB**에 저장됩니다. 브라우저를 닫았다 열어도 그대로 유지됩니다.

- ↑/↓ : 순서 변경
- ✕ : 삭제
- 파일명 알파벳순 자동 정렬은 없음, 추가한 순서대로

### 회의실 예약

- Dooray API를 Worker가 프록시 → CORS 문제 없음
- 3분마다 자동 갱신
- 현재 시간 빨간 바 표시

### 키오스크 모드 (맥)

```bash
# Chrome 전체화면
open -a "Google Chrome" --args --kiosk https://dooray-kiosk.xxx.workers.dev
```

## 구조

```
dooray202603mac/
├── wrangler.toml       CF Worker 설정
├── package.json
└── src/
    ├── index.js        Worker (HTML 서빙 + API 프록시)
    └── page.html       키오스크 UI (비디오 + 회의실)
```

## 로컬 개발

```bash
npx wrangler dev
# → http://localhost:8787
```
