#!/usr/bin/env node
// KETI Kiosk Dashboard - Local Server
// Node.js 내장 모듈만 사용, npm install 불필요
// 기능: 정적 파일 서빙 + Range Request(비디오) + Dooray API 프록시 + 비디오 자동 스캔

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = __dirname;
const VIDEO_DIR = path.join(ROOT, 'video');
const DOORAY_TOKEN = 's701wolho5si:sQYP0UfqQD-R6C626bOJtQ';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // Dooray API 프록시: /api/* → api.dooray.com/*
  if (pathname.startsWith('/api/')) {
    return proxyDooray(pathname.slice(4) + (parsed.search || ''), res);
  }

  // video/ 자동 스캔: video_list.js를 동적 생성
  if (pathname === '/video/video_list.js') {
    return serveVideoList(res);
  }

  // 정적 파일
  serveStatic(pathname === '/' ? '/index.html' : pathname, req, res);
});

// ── video/ 디렉토리 자동 스캔 ──
function serveVideoList(res) {
  let files = [];
  try {
    files = fs.readdirSync(VIDEO_DIR)
      .filter(f => /\.(mp4|webm|mov)$/i.test(f))
      .sort();
  } catch (e) { /* video 폴더 없으면 빈 배열 */ }

  const js = 'const videoList = ' + JSON.stringify(files) + ';\n';
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(js);
}

// ── 정적 파일 서빙 (Range Request 지원) ──
function serveStatic(pathname, req, res) {
  const filePath = path.join(ROOT, pathname);

  // 디렉토리 탈출 방지
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  let stat;
  try { stat = fs.statSync(filePath); } catch (e) {
    res.writeHead(404);
    return res.end('Not Found');
  }

  if (stat.isDirectory()) {
    return serveStatic(pathname + '/index.html', req, res);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const size = stat.size;

  // Range Request (비디오 탐색에 필수)
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : size - 1;

    if (start >= size || end >= size) {
      res.writeHead(416, { 'Content-Range': 'bytes */' + size });
      return res.end();
    }

    res.writeHead(206, {
      'Content-Type': contentType,
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
      'Content-Length': end - start + 1,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

// ── Dooray API 프록시 ──
function proxyDooray(doorayPath, res) {
  const opts = {
    hostname: 'api.dooray.com',
    path: doorayPath,
    method: 'GET',
    headers: {
      'Authorization': 'dooray-api ' + DOORAY_TOKEN,
      'Accept': 'application/json',
    },
    timeout: 15000,
  };

  const proxy = https.request(opts, (upstream) => {
    const chunks = [];
    upstream.on('data', c => chunks.push(c));
    upstream.on('end', () => {
      const body = Buffer.concat(chunks);
      res.writeHead(upstream.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    });
  });

  proxy.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  });

  proxy.on('timeout', () => {
    proxy.destroy();
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Gateway Timeout' }));
  });

  proxy.end();
}

// ── 서버 시작 ──
server.listen(PORT, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────┐');
  console.log('  │  KETI Kiosk Dashboard                │');
  console.log('  │  http://localhost:' + PORT + ('          │').slice(String(PORT).length));
  console.log('  │                                      │');
  console.log('  │  video/ 폴더에 mp4를 넣으면 자동 인식  │');
  console.log('  │  Ctrl+C 로 종료                      │');
  console.log('  └──────────────────────────────────────┘');
  console.log('');

  // 비디오 파일 목록 출력
  try {
    const vids = fs.readdirSync(VIDEO_DIR).filter(f => /\.(mp4|webm|mov)$/i.test(f));
    if (vids.length > 0) {
      console.log('  [영상 ' + vids.length + '개 감지]');
      vids.forEach(v => console.log('    - ' + v));
    } else {
      console.log('  [영상 없음] video/ 폴더에 mp4 파일을 넣어주세요');
    }
  } catch (e) {
    console.log('  [영상 없음] video/ 폴더가 없습니다 — 생성합니다');
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }
  console.log('');
});
