# 배포 가이드

이 애플리케이션을 웹에 배포하는 여러 방법을 안내합니다.

## 🚀 Render를 통한 배포 (권장)

Render는 무료 티어를 제공하며, SQLite 데이터베이스를 지원합니다.

### 1단계: Render 계정 생성
1. [Render.com](https://render.com) 접속
2. GitHub 계정으로 가입

### 2단계: 새 Web Service 생성
1. Dashboard에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결:
   - `parkh37t/Conversions-2-Devision-Revenue-and-Profit-Management`
   - 브랜치: `claude/sales-target-dashboard-qdPX3`

### 3단계: 서비스 설정
```
Name: conversions-2-revenue-management
Region: Oregon (US West)
Branch: claude/sales-target-dashboard-qdPX3
Runtime: Node
Build Command: ./build.sh
Start Command: npm start
Plan: Free
```

### 4단계: 환경 변수 설정
```
NODE_ENV=production
PORT=10000
DB_PATH=/opt/render/project/data/revenue.db
```

### 5단계: 디스크 추가 (데이터베이스 영구 저장)
- Disk Name: `database`
- Mount Path: `/opt/render/project/data`
- Size: 1 GB

### 6단계: 배포
- "Create Web Service" 클릭
- 자동으로 빌드 및 배포 시작
- 완료 후 URL 확인: `https://conversions-2-revenue-management.onrender.com`

---

## 🔷 Vercel을 통한 배포

### 1단계: Vercel CLI 설치
```bash
npm install -g vercel
```

### 2단계: 배포
```bash
vercel --prod
```

**주의**: Vercel은 SQLite를 영구 저장하지 못하므로, 프로덕션에는 권장하지 않습니다.

---

## 🐳 Docker를 통한 배포

### 1단계: Docker 이미지 빌드
```bash
docker build -t conversions-2-revenue-management .
```

### 2단계: 컨테이너 실행
```bash
docker run -p 5000:5000 \
  -v $(pwd)/database:/app/database \
  -e NODE_ENV=production \
  conversions-2-revenue-management
```

### 3단계: Docker Hub에 푸시 (선택)
```bash
docker tag conversions-2-revenue-management username/conversions-2-revenue-management
docker push username/conversions-2-revenue-management
```

---

## ☁️ Railway를 통한 배포

### 1단계: Railway 계정 생성
1. [Railway.app](https://railway.app) 접속
2. GitHub로 로그인

### 2단계: 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 저장소 선택 및 브랜치 설정

### 3단계: 환경 변수 설정
```
NODE_ENV=production
DB_PATH=/app/database/revenue.db
```

### 4단계: Volume 추가
- Mount Path: `/app/database`
- Size: 1 GB

---

## 🌐 배포 후 확인사항

### 1. 헬스 체크
```bash
curl https://your-app-url.com/api/health
```

### 2. 데이터 확인
- 대시보드 접속: `https://your-app-url.com`
- API 테스트: `https://your-app-url.com/api/targets/2026`

### 3. 데이터베이스 시드
배포 후 데이터가 없다면:
```bash
# Render Shell에서 실행
npm run seed
```

---

## 📊 무료 티어 비교

| 서비스 | 장점 | 단점 | SQLite 지원 |
|--------|------|------|-------------|
| **Render** | 무료, 쉬운 설정, 디스크 지원 | 느린 콜드 스타트 | ✅ |
| **Railway** | 빠름, 좋은 DX | 무료 티어 제한적 | ✅ |
| **Vercel** | 매우 빠름, 자동 배포 | SQLite 미지원 | ❌ |
| **Heroku** | 안정적 | 무료 티어 없음 | ⚠️ |

---

## 🔧 트러블슈팅

### 빌드 실패
```bash
# build.sh에 실행 권한이 있는지 확인
chmod +x build.sh
git add build.sh
git commit -m "Make build.sh executable"
git push
```

### 데이터베이스 오류
- Mount Path가 올바른지 확인
- DB_PATH 환경 변수 확인
- Volume이 생성되었는지 확인

### 포트 오류
- PORT 환경 변수가 설정되었는지 확인
- Render는 자동으로 PORT를 설정함

---

## 📞 지원

배포 관련 문제가 있으면:
1. Render Dashboard의 로그 확인
2. GitHub Issues에 문제 등록
3. 환경 변수 재확인
