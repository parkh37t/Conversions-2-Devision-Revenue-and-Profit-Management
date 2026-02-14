const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 특정 연도의 모든 실적 조회
router.get('/:year', (req, res) => {
  try {
    const { year } = req.params;
    const stmt = db.prepare('SELECT * FROM actuals WHERE year = ? ORDER BY month');
    const actuals = stmt.all(year);
    res.json({ success: true, data: actuals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 월의 실적 조회
router.get('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare('SELECT * FROM actuals WHERE year = ? AND month = ?');
    const actual = stmt.get(year, month);

    if (!actual) {
      return res.status(404).json({ success: false, error: 'Actual not found' });
    }

    res.json({ success: true, data: actual });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 실적 생성 또는 업데이트
router.post('/', (req, res) => {
  try {
    const { year, month, revenue_actual, profit_actual } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (year, month)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO actuals (year, month, revenue_actual, profit_actual, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(year, month) DO UPDATE SET
        revenue_actual = excluded.revenue_actual,
        profit_actual = excluded.profit_actual,
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(year, month, revenue_actual || null, profit_actual || null);

    res.json({
      success: true,
      message: 'Actual saved successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 여러 월의 실적 일괄 업데이트
router.post('/bulk', (req, res) => {
  try {
    const { actuals } = req.body;

    if (!Array.isArray(actuals) || actuals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid actuals array'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO actuals (year, month, revenue_actual, profit_actual, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(year, month) DO UPDATE SET
        revenue_actual = excluded.revenue_actual,
        profit_actual = excluded.profit_actual,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((data) => {
      for (const actual of data) {
        stmt.run(
          actual.year,
          actual.month,
          actual.revenue_actual || null,
          actual.profit_actual || null
        );
      }
    });

    insertMany(actuals);

    res.json({
      success: true,
      message: `${actuals.length} actuals saved successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 실적 삭제
router.delete('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare('DELETE FROM actuals WHERE year = ? AND month = ?');
    const result = stmt.run(year, month);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Actual not found' });
    }

    res.json({ success: true, message: 'Actual deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
