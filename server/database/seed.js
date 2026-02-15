const db = require('./db');

// 2026년 초기 목표 데이터 생성
function seedTargets() {
  const year = 2026;
  const deleteStmt = db.prepare('DELETE FROM targets WHERE year = ?');
  deleteStmt.run(year);

  const insertStmt = db.prepare(`
    INSERT INTO targets (year, month, revenue_target, profit_target)
    VALUES (?, ?, ?, ?)
  `);

  const monthlyTargets = [
    { month: 1, revenue: 1000000000, profit: 150000000 },  // 1월: 10억, 1.5억
    { month: 2, revenue: 1200000000, profit: 180000000 },  // 2월
    { month: 3, revenue: 1500000000, profit: 225000000 },  // 3월
    { month: 4, revenue: 1300000000, profit: 195000000 },  // 4월
    { month: 5, revenue: 1400000000, profit: 210000000 },  // 5월
    { month: 6, revenue: 1600000000, profit: 240000000 },  // 6월
    { month: 7, revenue: 1500000000, profit: 225000000 },  // 7월
    { month: 8, revenue: 1700000000, profit: 255000000 },  // 8월
    { month: 9, revenue: 1800000000, profit: 270000000 },  // 9월
    { month: 10, revenue: 1900000000, profit: 285000000 }, // 10월
    { month: 11, revenue: 2000000000, profit: 300000000 }, // 11월
    { month: 12, revenue: 2200000000, profit: 330000000 }, // 12월
  ];

  const insertMany = db.transaction((targets) => {
    for (const target of targets) {
      insertStmt.run(year, target.month, target.revenue, target.profit);
    }
  });

  insertMany(monthlyTargets);
  console.log(`✅ Seeded targets for year ${year}`);
}

// 샘플 실적 데이터 생성 (1-2월)
function seedActuals() {
  const year = 2026;
  const deleteStmt = db.prepare('DELETE FROM actuals WHERE year = ?');
  deleteStmt.run(year);

  const insertStmt = db.prepare(`
    INSERT INTO actuals (year, month, revenue_actual, profit_actual)
    VALUES (?, ?, ?, ?)
  `);

  const actuals = [
    { month: 1, revenue: 1050000000, profit: 160000000 }, // 1월 실적 (목표 초과)
    { month: 2, revenue: 1180000000, profit: 175000000 }, // 2월 실적 (목표 근접)
  ];

  const insertMany = db.transaction((data) => {
    for (const actual of data) {
      insertStmt.run(year, actual.month, actual.revenue, actual.profit);
    }
  });

  insertMany(actuals);
  console.log(`✅ Seeded actuals for year ${year}`);
}

// 샘플 예상 데이터 생성 (3월)
function seedForecasts() {
  const year = 2026;
  const deleteStmt = db.prepare('DELETE FROM forecasts WHERE year = ?');
  deleteStmt.run(year);

  const insertStmt = db.prepare(`
    INSERT INTO forecasts (year, month, revenue_forecast, profit_forecast)
    VALUES (?, ?, ?, ?)
  `);

  const forecasts = [
    { month: 3, revenue: 1520000000, profit: 230000000 }, // 3월 예상
  ];

  const insertMany = db.transaction((data) => {
    for (const forecast of data) {
      insertStmt.run(year, forecast.month, forecast.revenue, forecast.profit);
    }
  });

  insertMany(forecasts);
  console.log(`✅ Seeded forecasts for year ${year}`);
}

// 팀/사업 데이터 생성
function seedTeams() {
  const deleteStmt = db.prepare('DELETE FROM teams');
  deleteStmt.run();

  const insertStmt = db.prepare(`
    INSERT INTO teams (name, code, description, sort_order, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  const teams = [
    { name: 'AI솔루션팀', code: 'AI', description: 'AI/ML 솔루션 개발 및 서비스', sort_order: 1 },
    { name: '클라우드사업팀', code: 'CLOUD', description: '클라우드 인프라 및 SaaS 사업', sort_order: 2 },
    { name: '데이터사업팀', code: 'DATA', description: '빅데이터 분석 및 데이터 플랫폼', sort_order: 3 },
    { name: '플랫폼개발팀', code: 'PLATFORM', description: '공통 플랫폼 개발 및 운영', sort_order: 4 },
    { name: 'DX컨설팅팀', code: 'DX', description: '디지털 전환 컨설팅', sort_order: 5 },
  ];

  const insertMany = db.transaction((data) => {
    for (const team of data) {
      insertStmt.run(team.name, team.code, team.description, team.sort_order);
    }
  });

  insertMany(teams);
  console.log(`✅ Seeded ${teams.length} teams`);
}

// 팀별 목표 데이터 생성
function seedTeamTargets() {
  const year = 2026;
  const deleteStmt = db.prepare('DELETE FROM team_targets WHERE year = ?');
  deleteStmt.run(year);

  const teams = db.prepare('SELECT * FROM teams ORDER BY sort_order').all();
  const insertStmt = db.prepare(`
    INSERT INTO team_targets (team_id, year, month, revenue_target, profit_target)
    VALUES (?, ?, ?, ?, ?)
  `);

  // 팀별 월간 목표 기본값 (팀마다 다른 규모)
  const teamBaseTargets = {
    'AI': { revenue: 250000000, profit: 40000000 },      // AI솔루션팀: 2.5억/월
    'CLOUD': { revenue: 350000000, profit: 55000000 },    // 클라우드사업팀: 3.5억/월
    'DATA': { revenue: 200000000, profit: 30000000 },     // 데이터사업팀: 2억/월
    'PLATFORM': { revenue: 150000000, profit: 20000000 }, // 플랫폼개발팀: 1.5억/월
    'DX': { revenue: 100000000, profit: 15000000 },       // DX컨설팅팀: 1억/월
  };

  const insertMany = db.transaction(() => {
    for (const team of teams) {
      const base = teamBaseTargets[team.code] || { revenue: 100000000, profit: 15000000 };
      for (let month = 1; month <= 12; month++) {
        // 월별 계절성 반영 (하반기 목표가 더 높음)
        const factor = 0.8 + (month / 12) * 0.4;
        insertStmt.run(
          team.id, year, month,
          Math.round(base.revenue * factor),
          Math.round(base.profit * factor)
        );
      }
    }
  });

  insertMany();
  console.log(`✅ Seeded team targets for year ${year}`);
}

// 팀별 실적 데이터 생성 (1-2월)
function seedTeamActuals() {
  const year = 2026;
  const deleteStmt = db.prepare('DELETE FROM team_actuals WHERE year = ?');
  deleteStmt.run(year);

  const teams = db.prepare('SELECT * FROM teams ORDER BY sort_order').all();
  const insertStmt = db.prepare(`
    INSERT INTO team_actuals (team_id, year, month, revenue_actual, profit_actual)
    VALUES (?, ?, ?, ?, ?)
  `);

  // 팀별 1-2월 실적 (목표 대비 +-10% 변동)
  const teamActuals = {
    'AI': [
      { month: 1, revenue: 215000000, profit: 35000000 },
      { month: 2, revenue: 245000000, profit: 42000000 },
    ],
    'CLOUD': [
      { month: 1, revenue: 310000000, profit: 48000000 },
      { month: 2, revenue: 340000000, profit: 53000000 },
    ],
    'DATA': [
      { month: 1, revenue: 175000000, profit: 28000000 },
      { month: 2, revenue: 198000000, profit: 31000000 },
    ],
    'PLATFORM': [
      { month: 1, revenue: 130000000, profit: 18000000 },
      { month: 2, revenue: 148000000, profit: 21000000 },
    ],
    'DX': [
      { month: 1, revenue: 88000000, profit: 13000000 },
      { month: 2, revenue: 95000000, profit: 14500000 },
    ],
  };

  const insertMany = db.transaction(() => {
    for (const team of teams) {
      const actuals = teamActuals[team.code] || [];
      for (const actual of actuals) {
        insertStmt.run(team.id, year, actual.month, actual.revenue, actual.profit);
      }
    }
  });

  insertMany();
  console.log(`✅ Seeded team actuals for year ${year}`);
}

// 팀별 예상 데이터 생성 (3월)
function seedTeamForecasts() {
  const year = 2026;
  const deleteStmt = db.prepare('DELETE FROM team_forecasts WHERE year = ?');
  deleteStmt.run(year);

  const teams = db.prepare('SELECT * FROM teams ORDER BY sort_order').all();
  const insertStmt = db.prepare(`
    INSERT INTO team_forecasts (team_id, year, month, revenue_forecast, profit_forecast)
    VALUES (?, ?, ?, ?, ?)
  `);

  const teamForecasts = {
    'AI': { month: 3, revenue: 260000000, profit: 43000000 },
    'CLOUD': { month: 3, revenue: 365000000, profit: 58000000 },
    'DATA': { month: 3, revenue: 210000000, profit: 33000000 },
    'PLATFORM': { month: 3, revenue: 155000000, profit: 22000000 },
    'DX': { month: 3, revenue: 105000000, profit: 16000000 },
  };

  const insertMany = db.transaction(() => {
    for (const team of teams) {
      const forecast = teamForecasts[team.code];
      if (forecast) {
        insertStmt.run(team.id, year, forecast.month, forecast.revenue, forecast.profit);
      }
    }
  });

  insertMany();
  console.log(`✅ Seeded team forecasts for year ${year}`);
}

// 실적 비고 데이터 생성
function seedPerformanceNotes() {
  const deleteStmt = db.prepare('DELETE FROM performance_notes');
  deleteStmt.run();

  const teams = db.prepare('SELECT * FROM teams ORDER BY sort_order').all();
  const aiTeam = teams.find(t => t.code === 'AI');
  const cloudTeam = teams.find(t => t.code === 'CLOUD');

  const insertStmt = db.prepare(`
    INSERT INTO performance_notes (year, month, team_id, note_type, content)
    VALUES (?, ?, ?, ?, ?)
  `);

  const notes = [
    { year: 2026, month: 1, team_id: null, note_type: 'general', content: '1월 전체 실적은 목표 대비 소폭 초과 달성. 신규 프로젝트 수주 증가 추세.' },
    { year: 2026, month: 1, team_id: aiTeam?.id, note_type: 'issue', content: 'AI 모델 개발 프로젝트 일부 지연으로 매출 인식 2월로 이연.' },
    { year: 2026, month: 2, team_id: cloudTeam?.id, note_type: 'achievement', content: '대형 고객사 클라우드 마이그레이션 프로젝트 수주 성공.' },
    { year: 2026, month: 2, team_id: null, note_type: 'general', content: '2월 실적은 전반적으로 양호. 3월 대형 프로젝트 착수 예정.' },
  ];

  const insertMany = db.transaction(() => {
    for (const note of notes) {
      insertStmt.run(note.year, note.month, note.team_id, note.note_type, note.content);
    }
  });

  insertMany();
  console.log(`✅ Seeded performance notes`);
}

// 모든 시드 데이터 생성
function seedAll() {
  try {
    seedTargets();
    seedActuals();
    seedForecasts();
    seedTeams();
    seedTeamTargets();
    seedTeamActuals();
    seedTeamForecasts();
    seedPerformanceNotes();
    console.log('✅ All seed data created successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// 직접 실행 시 시드 데이터 생성
if (require.main === module) {
  seedAll();
}

module.exports = {
  seedAll, seedTargets, seedActuals, seedForecasts,
  seedTeams, seedTeamTargets, seedTeamActuals, seedTeamForecasts, seedPerformanceNotes
};
