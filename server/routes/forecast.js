const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 특정 연도의 모든 예상 조회
router.get('/:year', (req, res) => {
  try {
    const { year } = req.params;
    const stmt = db.prepare('SELECT * FROM forecasts WHERE year = ? ORDER BY month');
    const forecasts = stmt.all(year);
    res.json({ success: true, data: forecasts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 월의 예상 조회
router.get('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare('SELECT * FROM forecasts WHERE year = ? AND month = ?');
    const forecast = stmt.get(year, month);

    if (!forecast) {
      return res.status(404).json({ success: false, error: 'Forecast not found' });
    }

    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 예상 생성 또는 업데이트
router.post('/', (req, res) => {
  try {
    const { year, month, revenue_forecast, profit_forecast } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (year, month)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO forecasts (year, month, revenue_forecast, profit_forecast, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(year, month) DO UPDATE SET
        revenue_forecast = excluded.revenue_forecast,
        profit_forecast = excluded.profit_forecast,
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(year, month, revenue_forecast || null, profit_forecast || null);

    res.json({
      success: true,
      message: 'Forecast saved successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 여러 월의 예상 일괄 업데이트
router.post('/bulk', (req, res) => {
  try {
    const { forecasts } = req.body;

    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid forecasts array'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO forecasts (year, month, revenue_forecast, profit_forecast, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(year, month) DO UPDATE SET
        revenue_forecast = excluded.revenue_forecast,
        profit_forecast = excluded.profit_forecast,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((data) => {
      for (const forecast of data) {
        stmt.run(
          forecast.year,
          forecast.month,
          forecast.revenue_forecast || null,
          forecast.profit_forecast || null
        );
      }
    });

    insertMany(forecasts);

    res.json({
      success: true,
      message: `${forecasts.length} forecasts saved successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 예상 삭제
router.delete('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare('DELETE FROM forecasts WHERE year = ? AND month = ?');
    const result = stmt.run(year, month);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Forecast not found' });
    }

    res.json({ success: true, message: 'Forecast deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
