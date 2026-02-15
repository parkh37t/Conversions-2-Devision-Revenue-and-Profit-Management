const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 모든 팀 조회
router.get('/', (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    let stmt;
    if (activeOnly) {
      stmt = db.prepare('SELECT * FROM teams WHERE is_active = 1 ORDER BY sort_order');
    } else {
      stmt = db.prepare('SELECT * FROM teams ORDER BY sort_order');
    }
    const teams = stmt.all();
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 팀 조회
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM teams WHERE id = ?');
    const team = stmt.get(id);

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 팀 생성
router.post('/', (req, res) => {
  try {
    const { name, code, description, sort_order } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (name, code)'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO teams (name, code, description, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(name, code.toUpperCase(), description || null, sort_order || 0);

    res.json({
      success: true,
      message: 'Team created successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ success: false, error: 'Team code already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// 팀 수정
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, sort_order, is_active } = req.body;

    const stmt = db.prepare(`
      UPDATE teams SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(name, code, description, sort_order, is_active, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.json({ success: true, message: 'Team updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 팀 삭제
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM teams WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
