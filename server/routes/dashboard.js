const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 대시보드용 통합 데이터 조회
router.get('/:year', (req, res) => {
  try {
    const { year } = req.params;

    // 목표, 실적, 예상 데이터를 월별로 조인
    const stmt = db.prepare(`
      SELECT
        t.month,
        t.revenue_target,
        t.profit_target,
        a.revenue_actual,
        a.profit_actual,
        f.revenue_forecast,
        f.profit_forecast,
        CASE
          WHEN a.revenue_actual IS NOT NULL THEN
            ROUND((a.revenue_actual - t.revenue_target) * 100.0 / t.revenue_target, 2)
          ELSE NULL
        END as revenue_achievement_rate,
        CASE
          WHEN a.profit_actual IS NOT NULL THEN
            ROUND((a.profit_actual - t.profit_target) * 100.0 / t.profit_target, 2)
          ELSE NULL
        END as profit_achievement_rate
      FROM targets t
      LEFT JOIN actuals a ON t.year = a.year AND t.month = a.month
      LEFT JOIN forecasts f ON t.year = f.year AND t.month = f.month
      WHERE t.year = ?
      ORDER BY t.month
    `);

    const monthlyData = stmt.all(year);

    // 연간 요약 계산
    const summary = {
      total_revenue_target: 0,
      total_profit_target: 0,
      total_revenue_actual: 0,
      total_profit_actual: 0,
      total_revenue_forecast: 0,
      total_profit_forecast: 0,
      months_with_actuals: 0,
      months_with_forecasts: 0,
    };

    monthlyData.forEach(month => {
      summary.total_revenue_target += month.revenue_target || 0;
      summary.total_profit_target += month.profit_target || 0;

      if (month.revenue_actual !== null) {
        summary.total_revenue_actual += month.revenue_actual;
        summary.months_with_actuals++;
      }

      if (month.profit_actual !== null) {
        summary.total_profit_actual += month.profit_actual;
      }

      if (month.revenue_forecast !== null) {
        summary.total_revenue_forecast += month.revenue_forecast;
        summary.months_with_forecasts++;
      }

      if (month.profit_forecast !== null) {
        summary.total_profit_forecast += month.profit_forecast;
      }
    });

    // 전체 달성률 계산
    if (summary.total_revenue_target > 0) {
      summary.revenue_achievement_rate =
        ((summary.total_revenue_actual / summary.total_revenue_target) * 100).toFixed(2);
    }

    if (summary.total_profit_target > 0) {
      summary.profit_achievement_rate =
        ((summary.total_profit_actual / summary.total_profit_target) * 100).toFixed(2);
    }

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthly: monthlyData,
        summary: summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 최근 업데이트 내역
router.get('/:year/recent-updates', (req, res) => {
  try {
    const { year } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const stmt = db.prepare(`
      SELECT 'actual' as type, year, month, updated_at FROM actuals WHERE year = ?
      UNION ALL
      SELECT 'forecast' as type, year, month, updated_at FROM forecasts WHERE year = ?
      UNION ALL
      SELECT 'target' as type, year, month, updated_at FROM targets WHERE year = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `);

    const updates = stmt.all(year, year, year, limit);

    res.json({ success: true, data: updates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
