# 컨버전스 2본부 매출 및 손이익 관리 시스템

2026년 전체 매출 목표와 손이익 목표를 월별로 관리하는 관리자 페이지

## 주요 기능

- 📊 월별 매출 목표 및 실적 관리
- 💰 월별 손이익 목표 및 실적 관리
- 📈 당월 실적 입력 및 수정
- 🔮 익월 예상 입력 및 관리
- 📉 대시보드를 통한 시각화 및 통계

## 기술 스택

- **Frontend**: React, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express
- **Database**: SQLite

## 설치 및 실행

```bash
# 모든 의존성 설치
npm run install-all

# 개발 서버 실행 (백엔드 + 프론트엔드)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 포트

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API 엔드포인트

- `GET /api/targets/:year` - 연도별 목표 조회
- `POST /api/targets` - 목표 생성/수정
- `GET /api/actuals/:year` - 연도별 실적 조회
- `POST /api/actuals` - 실적 입력/수정
- `GET /api/forecast/:year` - 연도별 예상 조회
- `POST /api/forecast` - 예상 입력/수정
- `GET /api/dashboard/:year` - 대시보드 데이터 조회
