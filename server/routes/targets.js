const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 특정 연도의 모든 목표 조회
router.get('/:year', (req, res) => {
  try {
    const { year } = req.params;
    const stmt = db.prepare('SELECT * FROM targets WHERE year = ? ORDER BY month');
    const targets = stmt.all(year);
    res.json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 월의 목표 조회
router.get('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare('SELECT * FROM targets WHERE year = ? AND month = ?');
    const target = stmt.get(year, month);

    if (!target) {
      return res.status(404).json({ success: false, error: 'Target not found' });
    }

    res.json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 목표 생성 또는 업데이트
router.post('/', (req, res) => {
  try {
    const { year, month, revenue_target, profit_target } = req.body;

    if (!year || !month || revenue_target === undefined || profit_target === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO targets (year, month, revenue_target, profit_target, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(year, month) DO UPDATE SET
        revenue_target = excluded.revenue_target,
        profit_target = excluded.profit_target,
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(year, month, revenue_target, profit_target);

    res.json({
      success: true,
      message: 'Target saved successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 여러 월의 목표 일괄 업데이트
router.post('/bulk', (req, res) => {
  try {
    const { targets } = req.body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid targets array'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO targets (year, month, revenue_target, profit_target, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(year, month) DO UPDATE SET
        revenue_target = excluded.revenue_target,
        profit_target = excluded.profit_target,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((data) => {
      for (const target of data) {
        stmt.run(
          target.year,
          target.month,
          target.revenue_target,
          target.profit_target
        );
      }
    });

    insertMany(targets);

    res.json({
      success: true,
      message: `${targets.length} targets saved successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 목표 삭제
router.delete('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare('DELETE FROM targets WHERE year = ? AND month = ?');
    const result = stmt.run(year, month);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Target not found' });
    }

    res.json({ success: true, message: 'Target deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
