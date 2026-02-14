# 설치 및 실행 가이드

## 사전 요구사항

- Node.js (v16 이상)
- npm 또는 yarn

## 설치 방법

### 1. 의존성 설치

```bash
# 루트 디렉토리에서 서버 의존성 설치
npm install

# 클라이언트 디렉토리로 이동하여 프론트엔드 의존성 설치
cd client
npm install
cd ..
```

또는 한번에 설치:

```bash
npm run install-all
```

### 2. 데이터베이스 초기화 및 시드 데이터 생성

```bash
# 서버를 한 번 실행하면 자동으로 데이터베이스가 생성됩니다
# 시드 데이터를 생성하려면:
node server/database/seed.js
```

### 3. 개발 서버 실행

```bash
# 백엔드와 프론트엔드를 동시에 실행
npm run dev
```

개별 실행:

```bash
# 백엔드만 실행
npm run server

# 프론트엔드만 실행 (별도 터미널)
npm run client
```

### 4. 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

## 프로덕션 빌드

```bash
# 프론트엔드 빌드
npm run build

# 프로덕션 서버 실행
NODE_ENV=production npm start
```

## 디렉토리 구조

```
.
├── server/                 # 백엔드 서버
│   ├── database/          # 데이터베이스 설정 및 시드
│   ├── routes/            # API 라우트
│   └── index.js           # 서버 진입점
├── client/                # 프론트엔드 React 앱
│   ├── public/            # 정적 파일
│   └── src/               # React 소스 코드
│       ├── components/    # 재사용 가능한 컴포넌트
│       ├── pages/         # 페이지 컴포넌트
│       ├── services/      # API 서비스
│       └── utils/         # 유틸리티 함수
├── database/              # SQLite 데이터베이스 파일 (자동 생성)
└── package.json           # 프로젝트 설정
```

## 주요 기능

1. **대시보드** - 연간 및 월별 매출/손이익 현황 조회
2. **목표 관리** - 월별 매출 및 손이익 목표 설정
3. **실적 관리** - 당월 실적 입력 및 수정
4. **예상 관리** - 익월 예상 입력 및 관리

## 문제 해결

### 포트 충돌
- 5000번 포트가 사용 중이면 `.env` 파일에서 `PORT` 변경
- 3000번 포트가 사용 중이면 React가 자동으로 다른 포트 제안

### 데이터베이스 초기화
```bash
# database 폴더를 삭제하고 다시 시작
rm -rf database/
node server/database/seed.js
```

### 의존성 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules client/node_modules
npm run install-all
```
