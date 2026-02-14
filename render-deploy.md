# Render.com 배포 가이드 (5분 완성)

## ✨ 준비사항
- [x] GitHub 계정
- [x] 코드가 GitHub에 푸시됨
- [ ] Render.com 계정 (아래에서 생성)

---

## 📋 단계별 배포 가이드

### 1단계: Render 계정 생성 (1분)

1. 🔗 **Render 접속**: https://dashboard.render.com/register
2. **"Sign up with GitHub"** 클릭
3. GitHub 인증 허용

### 2단계: Blueprint에서 자동 배포 (3분)

#### 방법 A: Blueprint 사용 (가장 쉬움 ⭐⭐⭐)

1. Render Dashboard에서 **"New +"** → **"Blueprint"** 클릭
2. GitHub 저장소 연결:
   ```
   Repository: parkh37t/Conversions-2-Devision-Revenue-and-Profit-Management
   Branch: claude/sales-target-dashboard-qdPX3
   ```
3. `render.yaml` 파일 자동 인식됨
4. **"Apply"** 클릭
5. 자동으로 모든 설정 적용 및 배포 시작! 🎉

#### 방법 B: 수동 Web Service 생성

1. Render Dashboard에서 **"New +"** → **"Web Service"** 클릭

2. **저장소 연결**
   - Connect repository 클릭
   - `parkh37t/Conversions-2-Devision-Revenue-and-Profit-Management` 선택
   - Branch: `claude/sales-target-dashboard-qdPX3` 선택

3. **기본 설정**
   ```
   Name: conversions-2-revenue-management
   Region: Oregon (US West)
   Branch: claude/sales-target-dashboard-qdPX3
   Runtime: Node
   ```

4. **빌드 설정**
   ```
   Build Command: ./build.sh
   Start Command: npm start
   ```

5. **인스턴스 타입**
   ```
   Instance Type: Free
   ```

6. **환경 변수 설정**

   "Advanced" 클릭 후 아래 변수 추가:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DB_PATH` | `/opt/render/project/data/revenue.db` |

7. **디스크 추가** (중요! 데이터베이스 영구 저장)

   여전히 "Advanced" 섹션에서:
   - "Add Disk" 클릭
   - Name: `database`
   - Mount Path: `/opt/render/project/data`
   - Size: `1` GB

8. **배포 시작**
   - **"Create Web Service"** 클릭
   - 빌드 로그 자동 표시
   - 5-10분 대기

---

### 3단계: 배포 확인 (1분)

배포가 완료되면 Render가 제공하는 URL 확인:

```
https://conversions-2-revenue-management.onrender.com
```

또는 커스텀 이름:
```
https://[your-service-name].onrender.com
```

#### 확인 항목:

✅ **헬스 체크**
```
https://[your-app].onrender.com/api/health
```
응답: `{"status":"OK","timestamp":"..."}`

✅ **대시보드 접속**
```
https://[your-app].onrender.com
```
→ 컨버전스 2본부 대시보드 화면 표시

✅ **API 테스트**
```
https://[your-app].onrender.com/api/targets/2026
```
→ JSON 데이터 표시

---

## 🎯 배포 완료 후

### 제공되는 기능:
- 🏠 **대시보드**: `/`
- 📊 **목표 관리**: `/targets`
- 📈 **실적 관리**: `/actuals`
- 🔮 **예상 관리**: `/forecast`

### 샘플 데이터
2026년 데이터가 자동으로 생성됩니다:
- ✅ 12개월 목표
- ✅ 1-2월 실적
- ✅ 3월 예상

---

## ⚠️ 중요 노트

### 무료 티어 제한사항:
- ✅ 무제한 배포
- ✅ SSL/HTTPS 자동
- ✅ 자동 재배포 (git push 시)
- ⚠️ 15분 비활성 시 슬립 모드 (첫 접속 시 30초 대기)
- ✅ 1GB 영구 저장소

### 슬립 모드 해결:
무료 플랜은 15분 미사용 시 슬립 상태가 됩니다.
- 첫 접속 시 30초 정도 대기
- 또는 Cron Job으로 주기적 핑 설정

---

## 🔄 자동 재배포

GitHub에 코드를 푸시하면 자동으로 재배포됩니다:

```bash
git add .
git commit -m "Update feature"
git push origin claude/sales-target-dashboard-qdPX3
```

Render가 자동으로 감지하고 재빌드/재배포합니다! 🎉

---

## 🐛 트러블슈팅

### 빌드 실패 시:
1. Render Dashboard → Logs 확인
2. build.sh 실행 권한 확인
3. 환경 변수 재확인

### 데이터베이스 오류:
1. Disk가 올바르게 마운트되었는지 확인
2. DB_PATH 환경 변수 확인
3. Shell 접속하여 확인:
   ```bash
   ls -la /opt/render/project/data
   ```

### 포트 오류:
- Render는 PORT 환경 변수를 자동 설정
- server/index.js가 process.env.PORT 사용 확인됨 ✅

---

## 📞 다음 단계

1. ✅ 위 링크로 Render 가입
2. ✅ Blueprint 또는 Web Service 생성
3. ✅ 5-10분 대기
4. ✅ URL 접속하여 확인
5. 🎉 완료!

**배포 URL을 받으면 저와 공유해주세요!**
함께 확인하고 필요한 추가 설정을 도와드리겠습니다.
