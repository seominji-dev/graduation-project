# 데모 영상 제작 가이드

홍익대학교 C235180 서민지 2026년 졸업프로젝트 데모 녹화 안내

## 개요

이 가이드는 멀티테넌트 LLM 게이트웨이 데모를 영상으로 녹화하는 방법을 안내합니다.

## 사전 준비

### 1. 필수 도구

```bash
# Node.js 및 npm (이미 설치되어 있음)
node --version  # v22.0.0 이상
npm --version

# Ollama 설치 및 모델 다운로드
brew install ollama
ollama pull llama3.2
```

### 2. API 서버 의존성 설치

```bash
cd 02-implementation
npm install
```

## 녹화 방법

### 방법 A: Asciinema (권장)

터미널 세션을 녹화하는 가장 깔끔한 방법입니다.

#### 설치

```bash
# macOS
brew install asciinema

# 또는 Homebrew 없는 경우
curl -sL https://asciinema.org/install | sh
```

#### 녹화 방법

```bash
# 1. demo/video 디렉토리로 이동
cd 03-report/demo/video

# 2. Ollama 서버 시작 (별도 터미널)
ollama serve

# 3. API 서버 시작 (별도 터미널)
cd ../../02-implementation
npm start

# 4. 녹화 시작
cd ../../03-report/demo/video
asciinema rec demo-screencast.cast

# 5. 데모 실행
./run-demo.sh

# 6. 녹화 종료 (Ctrl+D 또는 exit)
```

#### MP4로 변환

```bash
# asciinema-convert 설치
npm install -g asciinema-convert

# 변환
asciinema-convert demo-screencast.cast demo-screencast.mp4
```

#### GIF로 변환

```bash
# agg 설치
brew install agg

# 변환
agg demo-screencast.cast demo-screencast.gif
```

---

### 방법 B: macOS QuickTime Player

별도 설치 없이 macOS 기본 기능으로 녹화합니다.

#### 녹화 방법

1. QuickTime Player 실행
2. 파일 > 새로운 화면 녹화
3. 녹화 버튼 클릭
4. 터미널 선택 후 녹화 시작
5. 데모 실행:

```bash
cd 03-report/demo/video
./run-demo.sh
```

6. 녹화 중지 및 저장

---

### 방법 C: OBS Studio

고급 화면 녹화 및 편집이 필요한 경우.

#### 설치

```bash
brew install obs
```

#### 설정

1. OBS 실행
2. 소스 > 화면 캡처 추가
3. 터미널 영역 선택
4. 녹화 시작
5. 데모 실행

---

## 데모 실행 방법

### 자동 실행 (권장)

```bash
cd 03-report/demo/video
./run-demo.sh
```

### 수동 실행

```bash
# 1. Ollama 시작
ollama serve

# 2. API 서버 시작
cd 02-implementation
npm start

# 3. Health Check
curl http://localhost:3000/api/health

# 4. 요청 제출
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "What is CPU scheduling?",
    "provider": {"name": "ollama", "model": "llama3.2"}
  }'
```

## 녹화 팁

### 화면 설정

- 터미널 폰트: Monaco 14pt 또는 Menlo 14pt
- 터미널 크기: 1200x800 이상
- 색상 테마: 기본 테마 또는 다크 테마

### 녹화 전 체크리스트

- [ ] Ollama 서버 실행 중
- [ ] API 서버 실행 중 (http://localhost:3000)
- [ ] llama3.2 모델 다운로드 완료
- [ ] 터미널 크기 적절히 설정
- [ ] 불필요한 앱 종료

### 녹화 중

- 명령어 실행 후 잠시 대기하여 결과 확인
- 스크롤은 최소화
- 오류 발생 시 녹화 중지 후 재시작

## 녹화 후

### 파일 확인

```bash
# Asciinema
ls -lh demo-screencast.cast

# QuickTime/OBS
ls -lh ~/Movies/
```

### 편집 (선택)

```bash
# MP4 편집
# macOS: iMovie, Final Cut Pro
# 또는 ffmpeg 사용

# GIF 최적화
gifsicle -O3 --lossy=80 -o demo-optimized.gif demo-screencast.gif
```

## 출력물

완성된 파일은 다음 위치에 저장하세요:

```
03-report/demo/video/
├── demo-screencast.mp4   # 최종 영상
├── demo-screencast.gif   # (선택) 애니메이션
├── demo-screencast.cast  # (선택) 원본 asciinema
└── run-demo.sh           # 데모 실행 스크립트
```

## 문제 해결

### Ollama 연결 실패

```bash
# Ollama 재시작
killall ollama
ollama serve
```

### API 서버 시작 실패

```bash
cd 02-implementation
npm install
npm start
```

### 포트 충돌

```bash
# 포트 3000 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

---

**작성일:** 2026-02-07
**버전:** 1.0.0
