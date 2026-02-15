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

  -- 팀/사업 테이블
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 팀별 목표 테이블
  CREATE TABLE IF NOT EXISTS team_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_target REAL NOT NULL DEFAULT 0,
    profit_target REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, year, month),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  -- 팀별 실적 테이블
  CREATE TABLE IF NOT EXISTS team_actuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_actual REAL DEFAULT 0,
    profit_actual REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, year, month),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  -- 팀별 예상 테이블
  CREATE TABLE IF NOT EXISTS team_forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_forecast REAL DEFAULT 0,
    profit_forecast REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, year, month),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  -- 실적 비고/특이사항 테이블
  CREATE TABLE IF NOT EXISTS performance_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    team_id INTEGER,
    note_type TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
  );

  -- 팀 관련 인덱스
  CREATE INDEX IF NOT EXISTS idx_team_targets_year ON team_targets(year);
  CREATE INDEX IF NOT EXISTS idx_team_targets_team ON team_targets(team_id);
  CREATE INDEX IF NOT EXISTS idx_team_actuals_year ON team_actuals(year);
  CREATE INDEX IF NOT EXISTS idx_team_actuals_team ON team_actuals(team_id);
  CREATE INDEX IF NOT EXISTS idx_team_forecasts_year ON team_forecasts(year);
  CREATE INDEX IF NOT EXISTS idx_team_forecasts_team ON team_forecasts(team_id);
  CREATE INDEX IF NOT EXISTS idx_performance_notes_year_month ON performance_notes(year, month);
`);

console.log('✅ Database initialized successfully');

module.exports = db;
