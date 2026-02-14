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

// 모든 시드 데이터 생성
function seedAll() {
  try {
    seedTargets();
    seedActuals();
    seedForecasts();
    console.log('✅ All seed data created successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// 직접 실행 시 시드 데이터 생성
if (require.main === module) {
  seedAll();
}

module.exports = { seedAll, seedTargets, seedActuals, seedForecasts };
