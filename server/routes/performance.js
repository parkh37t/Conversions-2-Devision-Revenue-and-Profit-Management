const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ===== 팀별 실적 통합 조회 =====

// 특정 연도의 전체 팀별 실적 조회
router.get('/:year', (req, res) => {
  try {
    const { year } = req.params;

    const teams = db.prepare(
      'SELECT * FROM teams WHERE is_active = 1 ORDER BY sort_order'
    ).all();

    const teamData = teams.map(team => {
      const targets = db.prepare(
        'SELECT * FROM team_targets WHERE team_id = ? AND year = ? ORDER BY month'
      ).all(team.id, year);

      const actuals = db.prepare(
        'SELECT * FROM team_actuals WHERE team_id = ? AND year = ? ORDER BY month'
      ).all(team.id, year);

      const forecasts = db.prepare(
        'SELECT * FROM team_forecasts WHERE team_id = ? AND year = ? ORDER BY month'
      ).all(team.id, year);

      return {
        team,
        targets,
        actuals,
        forecasts,
      };
    });

    res.json({ success: true, data: teamData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 연도/월의 팀별 실적 상세 조회 (월간 보고서용)
router.get('/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;

    const teams = db.prepare(
      'SELECT * FROM teams WHERE is_active = 1 ORDER BY sort_order'
    ).all();

    const teamMonthlyData = teams.map(team => {
      const target = db.prepare(
        'SELECT * FROM team_targets WHERE team_id = ? AND year = ? AND month = ?'
      ).get(team.id, year, month);

      const actual = db.prepare(
        'SELECT * FROM team_actuals WHERE team_id = ? AND year = ? AND month = ?'
      ).get(team.id, year, month);

      const forecast = db.prepare(
        'SELECT * FROM team_forecasts WHERE team_id = ? AND year = ? AND month = ?'
      ).get(team.id, year, month);

      // 해당 월까지의 누적 실적
      const cumulativeActual = db.prepare(`
        SELECT
          COALESCE(SUM(revenue_actual), 0) as cumulative_revenue,
          COALESCE(SUM(profit_actual), 0) as cumulative_profit
        FROM team_actuals
        WHERE team_id = ? AND year = ? AND month <= ?
      `).get(team.id, year, month);

      // 해당 월까지의 누적 목표
      const cumulativeTarget = db.prepare(`
        SELECT
          COALESCE(SUM(revenue_target), 0) as cumulative_revenue,
          COALESCE(SUM(profit_target), 0) as cumulative_profit
        FROM team_targets
        WHERE team_id = ? AND year = ? AND month <= ?
      `).get(team.id, year, month);

      // 전월 실적
      const prevMonth = parseInt(month) - 1;
      const prevActual = prevMonth > 0 ? db.prepare(
        'SELECT * FROM team_actuals WHERE team_id = ? AND year = ? AND month = ?'
      ).get(team.id, year, prevMonth) : null;

      return {
        team,
        target,
        actual,
        forecast,
        cumulative_actual: cumulativeActual,
        cumulative_target: cumulativeTarget,
        prev_actual: prevActual,
      };
    });

    // 본부 전체 합산
    const divisionTarget = db.prepare(
      'SELECT * FROM targets WHERE year = ? AND month = ?'
    ).get(year, month);

    const divisionActual = db.prepare(
      'SELECT * FROM actuals WHERE year = ? AND month = ?'
    ).get(year, month);

    const divisionForecast = db.prepare(
      'SELECT * FROM forecasts WHERE year = ? AND month = ?'
    ).get(year, month);

    // 비고/특이사항
    const notes = db.prepare(
      'SELECT pn.*, t.name as team_name FROM performance_notes pn LEFT JOIN teams t ON pn.team_id = t.id WHERE pn.year = ? AND pn.month = ? ORDER BY pn.created_at DESC'
    ).all(year, month);

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        teams: teamMonthlyData,
        division: {
          target: divisionTarget,
          actual: divisionActual,
          forecast: divisionForecast,
        },
        notes,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 팀별 목표 관리 =====

// 팀별 목표 저장 (단일)
router.post('/team-targets', (req, res) => {
  try {
    const { team_id, year, month, revenue_target, profit_target } = req.body;

    if (!team_id || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (team_id, year, month)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO team_targets (team_id, year, month, revenue_target, profit_target, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(team_id, year, month) DO UPDATE SET
        revenue_target = excluded.revenue_target,
        profit_target = excluded.profit_target,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(team_id, year, month, revenue_target || 0, profit_target || 0);

    res.json({ success: true, message: 'Team target saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 팀별 목표 일괄 저장
router.post('/team-targets/bulk', (req, res) => {
  try {
    const { targets } = req.body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid targets array' });
    }

    const stmt = db.prepare(`
      INSERT INTO team_targets (team_id, year, month, revenue_target, profit_target, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(team_id, year, month) DO UPDATE SET
        revenue_target = excluded.revenue_target,
        profit_target = excluded.profit_target,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((data) => {
      for (const t of data) {
        stmt.run(t.team_id, t.year, t.month, t.revenue_target || 0, t.profit_target || 0);
      }
    });

    insertMany(targets);

    res.json({ success: true, message: `${targets.length} team targets saved successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 팀별 실적 관리 =====

// 팀별 실적 저장 (단일)
router.post('/team-actuals', (req, res) => {
  try {
    const { team_id, year, month, revenue_actual, profit_actual } = req.body;

    if (!team_id || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (team_id, year, month)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO team_actuals (team_id, year, month, revenue_actual, profit_actual, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(team_id, year, month) DO UPDATE SET
        revenue_actual = excluded.revenue_actual,
        profit_actual = excluded.profit_actual,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(team_id, year, month, revenue_actual || 0, profit_actual || 0);

    res.json({ success: true, message: 'Team actual saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 팀별 실적 일괄 저장
router.post('/team-actuals/bulk', (req, res) => {
  try {
    const { actuals } = req.body;

    if (!Array.isArray(actuals) || actuals.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid actuals array' });
    }

    const stmt = db.prepare(`
      INSERT INTO team_actuals (team_id, year, month, revenue_actual, profit_actual, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(team_id, year, month) DO UPDATE SET
        revenue_actual = excluded.revenue_actual,
        profit_actual = excluded.profit_actual,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((data) => {
      for (const a of data) {
        stmt.run(a.team_id, a.year, a.month, a.revenue_actual || 0, a.profit_actual || 0);
      }
    });

    insertMany(actuals);

    res.json({ success: true, message: `${actuals.length} team actuals saved successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 팀별 예상 관리 =====

// 팀별 예상 저장 (단일)
router.post('/team-forecasts', (req, res) => {
  try {
    const { team_id, year, month, revenue_forecast, profit_forecast } = req.body;

    if (!team_id || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (team_id, year, month)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO team_forecasts (team_id, year, month, revenue_forecast, profit_forecast, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(team_id, year, month) DO UPDATE SET
        revenue_forecast = excluded.revenue_forecast,
        profit_forecast = excluded.profit_forecast,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(team_id, year, month, revenue_forecast || 0, profit_forecast || 0);

    res.json({ success: true, message: 'Team forecast saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 팀별 예상 일괄 저장
router.post('/team-forecasts/bulk', (req, res) => {
  try {
    const { forecasts } = req.body;

    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid forecasts array' });
    }

    const stmt = db.prepare(`
      INSERT INTO team_forecasts (team_id, year, month, revenue_forecast, profit_forecast, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(team_id, year, month) DO UPDATE SET
        revenue_forecast = excluded.revenue_forecast,
        profit_forecast = excluded.profit_forecast,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((data) => {
      for (const f of data) {
        stmt.run(f.team_id, f.year, f.month, f.revenue_forecast || 0, f.profit_forecast || 0);
      }
    });

    insertMany(forecasts);

    res.json({ success: true, message: `${forecasts.length} team forecasts saved successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 비고/특이사항 관리 =====

// 비고 조회
router.get('/notes/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const stmt = db.prepare(`
      SELECT pn.*, t.name as team_name
      FROM performance_notes pn
      LEFT JOIN teams t ON pn.team_id = t.id
      WHERE pn.year = ? AND pn.month = ?
      ORDER BY pn.created_at DESC
    `);
    const notes = stmt.all(year, month);
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 비고 추가
router.post('/notes', (req, res) => {
  try {
    const { year, month, team_id, note_type, content } = req.body;

    if (!year || !month || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (year, month, content)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO performance_notes (year, month, team_id, note_type, content)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(year, month, team_id || null, note_type || 'general', content);

    res.json({
      success: true,
      message: 'Note added successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 비고 수정
router.put('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content, note_type } = req.body;

    const stmt = db.prepare(`
      UPDATE performance_notes SET
        content = COALESCE(?, content),
        note_type = COALESCE(?, note_type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(content, note_type, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 비고 삭제
router.delete('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM performance_notes WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
