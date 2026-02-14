# ⚡ 5분 만에 시작하기

## 🌐 온라인 배포 (추천)

### 옵션 1: Render.com (무료, 가장 쉬움)
1. 🔗 https://dashboard.render.com/register 접속
2. GitHub로 로그인
3. "New +" → "Blueprint" 클릭
4. 저장소 선택: `parkh37t/Conversions-2-Devision-Revenue-and-Profit-Management`
5. Branch: `claude/sales-target-dashboard-qdPX3`
6. "Apply" 클릭
7. ☕ 5-10분 대기
8. ✅ 완료! URL로 접속

**자세한 가이드**: [render-deploy.md](./render-deploy.md)

---

## 💻 로컬 실행

### 1단계: 저장소 클론
```bash
git clone https://github.com/parkh37t/Conversions-2-Devision-Revenue-and-Profit-Management.git
cd Conversions-2-Devision-Revenue-and-Profit-Management
git checkout claude/sales-target-dashboard-qdPX3
```

### 2단계: 의존성 설치
```bash
npm run install-all
```

### 3단계: 샘플 데이터 생성
```bash
npm run seed
```

### 4단계: 개발 서버 실행
```bash
npm run dev
```

### 5단계: 접속
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📊 주요 기능

- ✅ 월별 매출/손이익 목표 관리
- ✅ 당월 실적 입력 및 수정
- ✅ 익월 예상 관리
- ✅ 목표 대비 달성률 자동 계산
- ✅ 시각적 대시보드

---

## 🔗 바로 가기

- 📖 [전체 설치 가이드](./INSTALLATION.md)
- 🚀 [배포 가이드](./DEPLOYMENT.md)
- 📋 [Render 배포 (5분)](./render-deploy.md)
- 📘 [README](./README.md)

---

## 💡 추천 순서

1. **온라인에서 바로 보기**: Render 배포 (5분)
2. **로컬 개발 환경**: 위의 로컬 실행 가이드 (5분)
3. **커스터마이징**: 코드 수정 후 재배포

---

**문제가 있나요?**
- GitHub Issues: https://github.com/parkh37t/Conversions-2-Devision-Revenue-and-Profit-Management/issues
