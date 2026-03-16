#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KETI Kiosk Dashboard - Local Server
외부 패키지 없음, Python 3 내장 모듈만 사용
기능: 정적파일(Range Request) + Dooray API 프록시 + 비디오 자동스캔
"""

import os
import sys
import json
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PORT', 8080))
ROOT = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.join(ROOT, 'video')
DOORAY_TOKEN = 's701wolho5si:sQYP0UfqQD-R6C626bOJtQ'

# video 폴더 없으면 생성
os.makedirs(VIDEO_DIR, exist_ok=True)


class Handler(BaseHTTPRequestHandler):
    """하나의 핸들러로 정적파일 + API프록시 + 비디오목록 모두 처리"""

    def log_message(self, fmt, *args):
        # 로그 간소화
        sys.stdout.write('[%s] %s\n' % (self.log_date_time_string(), fmt % args))
        sys.stdout.flush()

    def do_GET(self):
        path = self.path.split('?')[0]
        query = self.path[len(path):]  # ?key=val... 부분

        # 1) Dooray API 프록시
        if path.startswith('/api/'):
            return self.proxy_dooray(path[4:] + query)

        # 2) video_list.js 자동 생성
        if path == '/video/video_list.js':
            return self.serve_video_list()

        # 3) 정적 파일
        if path == '/':
            path = '/index.html'
        self.serve_static(path)

    # ── Dooray API 프록시 ──
    def proxy_dooray(self, dooray_path):
        url = 'https://api.dooray.com' + dooray_path
        req = Request(url, headers={
            'Authorization': 'dooray-api ' + DOORAY_TOKEN,
            'Accept': 'application/json',
        })
        try:
            resp = urlopen(req, timeout=15)
            body = resp.read()
            self.send_response(resp.getcode())
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        except URLError as e:
            err = json.dumps({'error': str(e)}).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(err))
            self.end_headers()
            self.wfile.write(err)

    # ── video/ 자동 스캔 ──
    def serve_video_list(self):
        exts = ('.mp4', '.webm', '.mov')
        try:
            files = sorted(f for f in os.listdir(VIDEO_DIR)
                           if f.lower().endswith(exts) and not f.startswith('.'))
        except OSError:
            files = []

        js = ('const videoList = %s;\n' % json.dumps(files)).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        self.send_header('Content-Length', len(js))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(js)

    # ── 정적 파일 + Range Request ──
    def serve_static(self, path):
        # 경로 정리 (디렉토리 탈출 방지)
        path = path.lstrip('/')
        filepath = os.path.normpath(os.path.join(ROOT, path))
        if not filepath.startswith(ROOT):
            self.send_error(403)
            return

        if not os.path.isfile(filepath):
            self.send_error(404)
            return

        size = os.path.getsize(filepath)
        ctype, _ = mimetypes.guess_type(filepath)
        if ctype is None:
            ctype = 'application/octet-stream'

        # Range Request 처리 (비디오 탐색에 필수)
        range_header = self.headers.get('Range')
        if range_header:
            try:
                # bytes=START-END
                r = range_header.replace('bytes=', '').strip()
                parts = r.split('-')
                start = int(parts[0]) if parts[0] else 0
                end = int(parts[1]) if parts[1] else size - 1
            except (ValueError, IndexError):
                start, end = 0, size - 1

            if start >= size:
                self.send_response(416)
                self.send_header('Content-Range', 'bytes */%d' % size)
                self.end_headers()
                return

            end = min(end, size - 1)
            length = end - start + 1

            self.send_response(206)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
            self.send_header('Content-Length', length)
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()

            with open(filepath, 'rb') as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
        else:
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', size)
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()

            with open(filepath, 'rb') as f:
                while True:
                    chunk = f.read(65536)
                    if not chunk:
                        break
                    self.wfile.write(chunk)


def main():
    # 비디오 목록 출력
    exts = ('.mp4', '.webm', '.mov')
    try:
        vids = sorted(f for f in os.listdir(VIDEO_DIR)
                      if f.lower().endswith(exts) and not f.startswith('.'))
    except OSError:
        vids = []

    print('')
    print('  ┌──────────────────────────────────────┐')
    print('  │  KETI Kiosk Dashboard                │')
    print('  │  http://localhost:%-5d               │' % PORT)
    print('  │                                      │')
    print('  │  video/ 에 mp4를 넣으면 자동 인식      │')
    print('  │  Ctrl+C 로 종료                      │')
    print('  └──────────────────────────────────────┘')
    print('')

    if vids:
        print('  [영상 %d개]' % len(vids))
        for v in vids:
            print('    - %s' % v)
    else:
        print('  [영상 없음] video/ 폴더에 mp4 파일을 넣어주세요')
    print('')

    server = HTTPServer(('0.0.0.0', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  서버 종료')
        server.server_close()


if __name__ == '__main__':
    main()
