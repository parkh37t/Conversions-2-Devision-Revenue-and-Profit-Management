const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 데이터베이스 디렉토리 생성
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'revenue.db');
const db = new Database(dbPath);

// 테이블 생성
db.exec(`
  -- 목표 테이블 (연간 및 월별)
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_target REAL NOT NULL,
    profit_target REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
  );

  -- 실적 테이블
  CREATE TABLE IF NOT EXISTS actuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_actual REAL,
    profit_actual REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
  );

  -- 예상 테이블 (익월 예상)
  CREATE TABLE IF NOT EXISTS forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_forecast REAL,
    profit_forecast REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_targets_year ON targets(year);
  CREATE INDEX IF NOT EXISTS idx_actuals_year ON actuals(year);
  CREATE INDEX IF NOT EXISTS idx_forecasts_year ON forecasts(year);
`);

console.log('✅ Database initialized successfully');

module.exports = db;
