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
2. 영상 URL 입력 → **추가**
3. 닫기 → 재생 시작

재생 목록은 **브라우저 localStorage**에 저장됩니다. 같은 브라우저에서 다시 열면 그대로 유지됩니다.

- ↑/↓ : 순서 변경
- ✕ : 삭제
- Enter : 빠른 추가

### 영상 호스팅 방법

Worker는 URL로 영상을 재생하므로 파일을 어딘가에 올려야 합니다:

| 방법 | 설명 |
|------|------|
| **Cloudflare R2** | 같은 CF 계정에서 바로 사용, 빠름 |
| **GitHub Releases** | 무료, 파일 크기 제한 2GB |
| **Google Drive** | 직접 링크 변환 필요 |
| **자체 서버** | NAS, 사내 서버 등에 mp4 올리기 |

직접 접근 가능한 `.mp4` URL이면 됩니다.

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
