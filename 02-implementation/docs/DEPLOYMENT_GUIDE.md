# 배포 가이드 (Deployment Guide)

## 개요 (Overview)

본 문서는 LLM Scheduler 시스템을 개발 환경에서 운영 환경으로 배포하는 방법을 설명합니다. 로컬 개발 환경, Docker 컨테이너, 클라우드 배포(CPUs/VMs)의 세 가지 배포 시나리오를 다룹니다.

---

## 1. 사전 요구 사항 (Prerequisites)

### 1.1 하드웨어 요구 사항

| 구성 | 최소 사양 | 권장 사양 |
|------|----------|----------|
| CPU | 2코어 | 4코어 이상 |
| RAM | 4GB | 8GB 이상 |
| 디스크 | 10GB 여유 공간 | 20GB 이상 SSD |

### 1.2 소프트웨어 요구 사항

| 소프트웨어 | 버전 | 설치 방법 |
|-----------|------|----------|
| Node.js | 22.x LTS | https://nodejs.org/ |
| npm | 10.x 이상 | Node.js 설치 시 포함 |
| Git | 2.x 이상 | https://git-scm.com/ |
| (선택) Docker | 20.x 이상 | https://www.docker.com/ |
| (선택) Ollama | 최신 버전 | https://ollama.ai/ |

---

## 2. 로컬 배포 (Local Deployment)

### 2.1 소스 코드 가져오기

```bash
# 저장소 복제
git clone <repository-url>
cd 졸업프로젝트/02-implementation

# 또는 압축 파일 해제
unzip llm-scheduler.zip
cd llm-scheduler/02-implementation
```

### 2.2 의존성 설치

```bash
# package.json이 있는 디렉토리로 이동
cd 02-implementation

# 의존성 설치
npm install

# 설치 확인
npm list --depth=0
```

**예상 출력:**
```
llm-scheduler@1.0.0 /path/to/02-implementation
├── express@4.18.2
└── jest@29.7.0
```

### 2.3 환경 변수 설정

```bash
# .env 파일 생성 (선택 사항)
cat > .env << EOF
# 서버 설정
PORT=3000
SCHEDULER_TYPE=WFQ

# LLM 설정
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:8b

# 로깅 설정
LOG_LEVEL=info
EOF

# 환경 변수 불러오기 (Linux/Mac)
source .env

# 또는 Node.js에서 직접 설정
export PORT=3000
export SCHEDULER_TYPE=WFQ
```

### 2.4 Ollama LLM 설치 및 실행

```bash
# Ollama 설치 (Mac)
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama 설치 (Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama 설치 (Windows)
# https://ollama.ai/download에서 설치 파일 다운로드

# LLM 모델 다운로드 (8B 파라미터, 약 4.7GB)
ollama pull llama3.2:8b

# Ollama 서버 시작 (백그라운드 실행)
ollama serve &

# Ollama 서버 상태 확인
curl http://localhost:11434/api/tags
```

### 2.5 애플리케이션 실행

```bash
# 개발 모드 (로그 상세)
npm start

# 또는 직접 실행
node src-simple/index.js

# 특정 스케줄러로 실행
SCHEDULER_TYPE=Priority npm start
SCHEDULER_TYPE=MLFQ npm start
SCHEDULER_TYPE=WFQ npm start
```

**예상 출력:**
```
LLM Scheduler Server Started
- Scheduler: WFQ
- Port: 3000
- LLM: Ollama (llama3.2:8b)
- Time: 2026-02-09 14:30:00 KST
```

### 2.6 서버 동작 확인

```bash
# 헬스 체크
curl http://localhost:3000/api/health

# 예상 응답:
# {"status":"healthy","scheduler":"WFQ","uptime":0}

# 스케줄러 상태 확인
curl http://localhost:3000/api/scheduler/status

# 예상 응답:
# {"name":"WFQ","queueSize":0,"processed":0}

# 테스트 요청 제출
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, LLM!",
    "tenantId": "test-tenant",
    "tier": "premium",
    "priority": "NORMAL"
  }'

# 요청 상태 조회 (위 응답의 id 사용)
curl http://localhost:3000/api/requests/<request-id>
```

---

## 3. Docker 배포 (Docker Deployment)

### 3.1 Dockerfile 생성

`02-implementation/Dockerfile`:

```dockerfile
# 베이스 이미지: Node.js 22 LTS
FROM node:22-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY src-simple/ ./src-simple/

# 환경 변수
ENV PORT=3000
ENV SCHEDULER_TYPE=WFQ
ENV OLLAMA_BASE_URL=http://ollama:11434

# 포트 노출
EXPOSE 3000

# 서버 시작
CMD ["node", "src-simple/index.js"]
```

### 3.2 Docker Compose 설정

`02-implementation/docker-compose.yml`:

```yaml
version: '3.8'

services:
  llm-scheduler:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - SCHEDULER_TYPE=WFQ
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama
    networks:
      - llm-network

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - llm-network
    # LLM 모델 다운로드 (컨테이너 시작 시 자동 실행)
    command: >
      sh -c "
      ollama serve &
      sleep 5 &&
      ollama pull llama3.2:8b &&
      tail -f /dev/null
      "

volumes:
  ollama-data:

networks:
  llm-network:
    driver: bridge
```

### 3.3 Docker 빌드 및 실행

```bash
# Docker 이미지 빌드
docker build -t llm-scheduler:latest .

# Docker Compose로 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f llm-scheduler

# 컨테이너 상태 확인
docker-compose ps

# 서비스 중지
docker-compose down

# 볼륨까지 포함하여 완전 제거
docker-compose down -v
```

### 3.4 Docker 컨테이너 테스트

```bash
# 컨테이너 내부에서 테스트 실행
docker-compose exec llm-scheduler npm test

# 컨테이너 리소스 사용량 확인
docker stats llm-scheduler

# Ollama 모델 목록 확인
docker-compose exec ollama ollama list
```

---

## 4. 클라우드 배포 (Cloud Deployment)

### 4.1 AWS EC2 배포

**EC2 인스턴스 유형 추천:**
- 개발: `t3.micro` (2 vCPU, 1GB RAM) - 약 $8/월
- 테스트: `t3.small` (2 vCPU, 2GB RAM) - 약 $16/월
- 프로덕션: `t3.medium` (2 vCPU, 4GB RAM) - 약 $32/월

**배포 절차:**

1. **EC2 인스턴스 시작:**
```bash
# AWS CLI 사용 (또는 AWS Console)
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.small \
  --key-name my-key-pair \
  --security-group-ids sg-903004f8 \
  --subnet-id subnet-6e7f829e
```

2. **SSH 접속:**
```bash
# 키 페어 권한 설정
chmod 400 my-key-pair.pem

# SSH 접속
ssh -i my-key-pair.pem ec2-user@<public-ip>
```

3. **Node.js 설치:**
```bash
# Node.js 22 LTS 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version  # v22.x.x
npm --version   # 10.x.x
```

4. **애플리케이션 배포:**
```bash
# Git에서 소스 코드 복제
git clone <repository-url>
cd 졸업프로젝트/02-implementation

# 의존성 설치
npm install

# PM2로 프로세스 관리 (선택 사항)
sudo npm install -g pm2
pm2 start src-simple/index.js --name llm-scheduler
pm2 startup
pm2 save
```

5. **보안 그룹 설정:**
```bash
# 포트 3000 허용 (인바운드 규칙)
aws ec2 authorize-security-group-ingress \
  --group-id sg-903004f8 \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

6. **Elastic IP 할당 (선택 사항):**
```bash
# 고정 IP 할당
aws ec2 allocate-address --domain vpc

# EC2 인스턴스에 연결
aws ec2 associate-address --instance-id i-1234567890abcdef0 --allocation-id eipalloc-12345678
```

### 4.2 Google Cloud Platform 배포

**Compute Engine 인스턴스 추천:**
- 개발: `e2-micro` (2 vCPU, 1GB RAM) - 약 $5/월
- 테스트: `e2-small` (2 vCPU, 2GB RAM) - 약 $13/월
- 프로덕션: `e2-medium` (2 vCPU, 4GB RAM) - 약 $26/월

**배포 절차:**

1. **인스턴스 생성:**
```bash
gcloud compute instances create llm-scheduler \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server
```

2. **방화벽 규칙 추가:**
```bash
gcloud compute firewall-rules create allow-http \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow port 3000"
```

3. **SSH 접속 및 배포:**
```bash
# SSH 접속
gcloud compute ssh llm-scheduler --zone=us-central1-a

# (이후 단계는 AWS EC2와 동일)
```

### 4.3 Azure VM 배포

**VM 사이즈 추천:**
- 개발: `Standard_B1s` (1 vCPU, 1GB RAM) - 약 $8/월
- 테스트: `Standard_B1s` (1 vCPU, 2GB RAM) - 약 $16/월
- 프로덕션: `Standard_B2s` (2 vCPU, 4GB RAM) - 약 $32/월

**배포 절차:**

1. **VM 생성 (Azure Portal 또는 CLI)**
2. **NSG(네트워크 보안 그룹)에 포트 3000 추가**
3. **SSH 접속 및 배포 (이후 단계는 AWS EC2와 동일)**

---

## 5. 운영 가이드 (Operations Guide)

### 5.1 로그 모니터링

```bash
# PM2 로그 확인
pm2 logs llm-scheduler

# PM2 로그 파일 위치
~/.pm2/logs/

# 애플리케이션 로그 확인
tail -f data/llm-scheduler.log
```

### 5.2 성능 모니터링

```bash
# CPU/메모리 사용량 확인
pm2 monit

# 또는 Linux 명령
top -p $(pgrep -f "node src-simple/index.js")

# 디스크 사용량 확인
df -h

# 네트워크 연결 확인
netstat -an | grep 3000
```

### 5.3 무중단 재시작

```bash
# PM2를 사용하는 경우
pm2 reload llm-scheduler

# 또는
pm2 restart llm-scheduler

# Docker를 사용하는 경우
docker-compose up -d --no-deps --build llm-scheduler
```

### 5.4 백업 및 복구

```bash
# 데이터 디렉토리 백업
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# S3에 업로드 (AWS)
aws s3 cp backup-$(date +%Y%m%d).tar.gz s3://my-bucket/backups/

# 복구
tar -xzf backup-20260209.tar.gz
```

---

## 6. 문제 해결 (Troubleshooting)

### 6.1 포트 충돌

**증상:** `Error: listen EADDRINUSE: address already in use :::3000`

**해결:**
```bash
# 포트 3000 사용 프로세스 확인
lsof -i :3000

# 또는
netstat -tulpn | grep 3000

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
PORT=3001 npm start
```

### 6.2 Ollama 연결 실패

**증상:** `Error: connect ECONNREFUSED 127.0.0.1:11434`

**해결:**
```bash
# Ollama 서버 상태 확인
ps aux | grep ollama

# Ollama 서버 시작
ollama serve &

# Ollama 로그 확인
ollama logs
```

### 6.3 메모리 부족

**증상:** `JavaScript heap out of memory`

**해결:**
```bash
# Node.js 메모리 한도 증가
NODE_OPTIONS="--max-old-space-size=4096" npm start

# PM2 설정
pm2 start src-simple/index.js --max-memory-restart 500M
```

### 6.4 Docker 컨테이너 문제

**증상:** 컨테이너가 즉시 종료됨

**해결:**
```bash
# 로그 확인
docker logs <container-id>

# 상세 모드로 실행
docker-compose up --build

# 컨테이너 내부 셸 접속
docker exec -it <container-id> sh
```

---

## 7. 보안 권장 사항 (Security Recommendations)

### 7.1 인증 및 권한 부여

**⚠️ 현재 상태:** 본 시스템은 인증 없이 모든 API 엔드포인트를公開합니다.

**개선 제안:**
- API 키 인증 (`X-API-Key` 헤더)
- JWT 토큰 기반 인증
- OAuth 2.0 / OpenID Connect
- 테넌트별 인증 토큰

### 7.2 HTTPS 설정

**⚠️ 현재 상태:** HTTP(포트 3000) 사용

**개선 제안:**
```bash
# Nginx 리버스 프록시 설정
sudo apt-get install nginx certbot python3-certbot-nginx

# Let's Encrypt 인증서 발급
sudo certbot --nginx -d your-domain.com

# Nginx 설정 (/etc/nginx/sites-available/llm-scheduler)
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7.3 속도 제한 (Rate Limiting)

**⚠️ 현재 상태:** 요청 속도 제한 없음

**개선 제안:**
```javascript
// Express Rate Limit 미들웨어
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // 최대 100개 요청
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 7.4 입력 검증

**⚠️ 현재 상태:** 기본 입력 검증만 구현

**개선 제안:**
```javascript
// Joi 스키마 검증
const Joi = require('joi');

const requestSchema = Joi.object({
  prompt: Joi.string().min(1).max(10000).required(),
  tenantId: Joi.string().alphanum().min(1).max(50).required(),
  tier: Joi.string().valid('enterprise', 'premium', 'standard', 'free').required(),
  priority: Joi.string().valid('URGENT', 'HIGH', 'NORMAL', 'LOW').optional()
});

// 요청 검증 미들웨어
app.post('/api/requests', validateRequest(requestSchema), (req, res) => {
  // 요청 처리
});
```

---

## 8. 모니터링 및 알림 (Monitoring & Alerting)

### 8.1 기본 모니터링

**현재 구현:**
- `/api/health`: 헬스 체크 엔드포인트
- `/api/stats`: 기본 통계 (총 요청, 처리량, 평균 대기 시간)

**개선 제안:**
```javascript
// Prometheus 메트릭 엔드포인트
app.get('/metrics', (req, res) => {
  const metrics = `
    # HELP llm_scheduler_queue_size Current queue size
    # TYPE llm_scheduler_queue_size gauge
    llm_scheduler_queue_size ${scheduler.size()}

    # HELP llm_scheduler_processed_total Total processed requests
    # TYPE llm_scheduler_processed_total counter
    llm_scheduler_processed_total ${scheduler.getStats().processed}
  `;
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

### 8.2 알림 설정

**개선 제안:**
- 큐 크기 임계값 초과 시 알림 (예: 100개 이상)
- 평균 대기 시간 임계값 초과 시 알림 (예: 10초 이상)
- LLM 응답 실패율 모니터링
- PagerDuty, Slack, 이메일 알림 연동

---

## 9. 확장성 고려 사항 (Scalability Considerations)

### 9.1 수직 확장 (Vertical Scaling)

**현재 한계:** 단일 서버, 단일 코어 사용

**개선 방향:**
- Node.js 클러스터링 (멀티 코어 활용)
- PM2 클러스터 모드
- Worker Threads 사용

```javascript
// PM2 클러스터 모드
pm2 start src-simple/index.js -i max
```

### 9.2 수평 확장 (Horizontal Scaling)

**현재 한계:** 단일 서버 아키텍처

**개선 방향:**
- 로드 밸런서 (Nginx, HAProxy)
- 여러 LLM Scheduler 인스턴스
- 공유 큐 (Redis, RabbitMQ)
- 세션 스토어 (Redis)

### 9.3 데이터베이스 마이그레이션

**현재 한계:** JSON 파일 기반 저장소

**개선 방향:**
- PostgreSQL (관계형 데이터베이스)
- MongoDB (문서 지향 데이터베이스)
- Redis (캐시 및 세션 저장소)

---

## 10. 비용 견적 (Cost Estimation)

### 10.1 클라우드 비용 (월간 추정)

| 클라우드 | 인스턴스 유형 | 사양 | 비용 (USD) |
|----------|-------------|------|-----------|
| AWS | t3.small | 2 vCPU, 2GB RAM | ~$16 |
| GCP | e2-small | 2 vCPU, 2GB RAM | ~$13 |
| Azure | Standard_B1s | 1 vCPU, 2GB RAM | ~$16 |

### 10.2 추가 비용

| 항목 | 비용 (USD) | 비고 |
|------|-----------|------|
| 도메인 | ~$10/년 | .com 도메인 |
| SSL 인증서 | $0 | Let's Encrypt 무료 |
| 모니터링 | ~$5/월 | Datadog, New Relic 등 |
| 로그 저장 | ~$5/월 | S3, Cloud Storage 등 |

**총 비용:** 월 $20-30 (테스트 환경 기준)

---

## 11. 지원 및 문의 (Support)

### 11.1 문서

- GitHub Repository: [링크]
- Issue Tracker: [링크]
- Wiki: [링크]

### 11.2 연락처

- 개발자: 서민지 (C235180)
- 이메일: [이메일 주소]
- 지도교수: [교수님 성함]

---

**작성일:** 2026년 2월 9일
**버전:** 1.0
**작성자:** 서민지 (C235180)
