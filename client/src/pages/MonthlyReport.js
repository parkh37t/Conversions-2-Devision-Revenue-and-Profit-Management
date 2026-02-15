import React, { useState, useEffect, useCallback } from 'react';
import { performanceAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrencySimple, formatPercent } from '../utils/formatters';
import './Management.css';
import './MonthlyReport.css';

const MonthlyReport = ({ year }) => {
  const [month, setMonth] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m > 12 ? 12 : m;
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteForm, setNoteForm] = useState({ content: '', note_type: 'general', team_id: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await performanceAPI.getMonthData(year, month);
      setReportData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || '보고서 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async () => {
    if (!noteForm.content.trim()) return;
    try {
      setSavingNote(true);
      await performanceAPI.addNote({
        year,
        month,
        team_id: noteForm.team_id || null,
        note_type: noteForm.note_type,
        content: noteForm.content,
      });
      setNoteForm({ content: '', note_type: 'general', team_id: '' });
      setShowNoteForm(false);
      await fetchData();
    } catch (err) {
      alert('비고 저장에 실패했습니다.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('이 비고를 삭제하시겠습니까?')) return;
    try {
      await performanceAPI.deleteNote(noteId);
      await fetchData();
    } catch (err) {
      alert('비고 삭제에 실패했습니다.');
    }
  };

  if (loading) return <Loading message="월간 보고서를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!reportData) return null;

  const { teams: teamData, notes } = reportData;

  // 팀별 합산 (당월)
  const teamTotals = teamData.reduce(
    (acc, td) => {
      acc.target_revenue += td.target?.revenue_target || 0;
      acc.target_profit += td.target?.profit_target || 0;
      acc.actual_revenue += td.actual?.revenue_actual || 0;
      acc.actual_profit += td.actual?.profit_actual || 0;
      acc.forecast_revenue += td.forecast?.revenue_forecast || 0;
      acc.forecast_profit += td.forecast?.profit_forecast || 0;
      acc.cum_actual_revenue += td.cumulative_actual?.cumulative_revenue || 0;
      acc.cum_actual_profit += td.cumulative_actual?.cumulative_profit || 0;
      acc.cum_target_revenue += td.cumulative_target?.cumulative_revenue || 0;
      acc.cum_target_profit += td.cumulative_target?.cumulative_profit || 0;
      return acc;
    },
    {
      target_revenue: 0, target_profit: 0,
      actual_revenue: 0, actual_profit: 0,
      forecast_revenue: 0, forecast_profit: 0,
      cum_actual_revenue: 0, cum_actual_profit: 0,
      cum_target_revenue: 0, cum_target_profit: 0,
    }
  );

  const revenueRate = teamTotals.target_revenue > 0
    ? ((teamTotals.actual_revenue - teamTotals.target_revenue) / teamTotals.target_revenue * 100)
    : null;

  const profitRate = teamTotals.target_profit > 0
    ? ((teamTotals.actual_profit - teamTotals.target_profit) / teamTotals.target_profit * 100)
    : null;

  const getNoteTypeLabel = (type) => {
    switch (type) {
      case 'general': return '일반';
      case 'issue': return '이슈';
      case 'achievement': return '성과';
      case 'plan': return '계획';
      default: return type;
    }
  };

  const getNoteTypeClass = (type) => {
    switch (type) {
      case 'issue': return 'note-type-issue';
      case 'achievement': return 'note-type-achievement';
      case 'plan': return 'note-type-plan';
      default: return 'note-type-general';
    }
  };

  return (
    <div className="management-page monthly-report">
      <div className="page-header">
        <div>
          <h2 className="page-title">{year}년 {month}월 실적 보고서</h2>
          <p className="page-subtitle">컨버전스 2본부 월간 실적 현황 보고</p>
        </div>
        <div className="month-nav">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setMonth(m => Math.max(1, m - 1))}
            disabled={month <= 1}
          >
            &lt; 전월
          </button>
          <select
            className="month-select"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setMonth(m => Math.min(12, m + 1))}
            disabled={month >= 12}
          >
            익월 &gt;
          </button>
        </div>
      </div>

      {/* 본부 전체 요약 카드 */}
      <div className="report-summary-cards">
        <div className="report-card revenue-card">
          <h3>당월 매출</h3>
          <div className="report-card-body">
            <div className="report-metric">
              <span className="report-metric-label">목표</span>
              <span className="report-metric-value">{formatCurrencySimple(teamTotals.target_revenue)}</span>
            </div>
            <div className="report-metric">
              <span className="report-metric-label">실적</span>
              <span className="report-metric-value highlight-green">
                {teamTotals.actual_revenue > 0 ? formatCurrencySimple(teamTotals.actual_revenue) : '-'}
              </span>
            </div>
            <div className="report-metric">
              <span className="report-metric-label">달성률</span>
              <span className={`report-metric-value ${revenueRate !== null ? (revenueRate >= 0 ? 'highlight-green' : 'highlight-red') : ''}`}>
                {revenueRate !== null ? formatPercent(revenueRate) : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="report-card profit-card">
          <h3>당월 손이익</h3>
          <div className="report-card-body">
            <div className="report-metric">
              <span className="report-metric-label">목표</span>
              <span className="report-metric-value">{formatCurrencySimple(teamTotals.target_profit)}</span>
            </div>
            <div className="report-metric">
              <span className="report-metric-label">실적</span>
              <span className="report-metric-value highlight-green">
                {teamTotals.actual_profit > 0 ? formatCurrencySimple(teamTotals.actual_profit) : '-'}
              </span>
            </div>
            <div className="report-metric">
              <span className="report-metric-label">달성률</span>
              <span className={`report-metric-value ${profitRate !== null ? (profitRate >= 0 ? 'highlight-green' : 'highlight-red') : ''}`}>
                {profitRate !== null ? formatPercent(profitRate) : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="report-card cumulative-card">
          <h3>누적 실적 ({month}월까지)</h3>
          <div className="report-card-body">
            <div className="report-metric">
              <span className="report-metric-label">누적 매출</span>
              <span className="report-metric-value">{formatCurrencySimple(teamTotals.cum_actual_revenue)}</span>
            </div>
            <div className="report-metric">
              <span className="report-metric-label">누적 손이익</span>
              <span className="report-metric-value">{formatCurrencySimple(teamTotals.cum_actual_profit)}</span>
            </div>
            <div className="report-metric">
              <span className="report-metric-label">매출 달성률</span>
              <span className="report-metric-value">
                {teamTotals.cum_target_revenue > 0
                  ? `${((teamTotals.cum_actual_revenue / teamTotals.cum_target_revenue) * 100).toFixed(1)}%`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 팀별 상세 실적 테이블 */}
      <div className="card report-section">
        <h3 className="section-title">팀별 실적 상세</h3>
        <div className="table-container">
          <table className="table management-table report-table">
            <thead>
              <tr>
                <th rowSpan={2}>팀명</th>
                <th colSpan={4} className="revenue-header">매출 (억원)</th>
                <th colSpan={4} className="profit-header">손이익 (억원)</th>
              </tr>
              <tr>
                <th>목표</th>
                <th>실적</th>
                <th>달성률</th>
                <th>전월비</th>
                <th>목표</th>
                <th>실적</th>
                <th>달성률</th>
                <th>이익률</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map(({ team, target, actual, prev_actual }) => {
                const revTarget = target?.revenue_target || 0;
                const revActual = actual?.revenue_actual || 0;
                const profTarget = target?.profit_target || 0;
                const profActual = actual?.profit_actual || 0;
                const prevRevActual = prev_actual?.revenue_actual || 0;

                const revRate = revTarget > 0 && revActual > 0
                  ? ((revActual - revTarget) / revTarget * 100) : null;
                const profRate = profTarget > 0 && profActual > 0
                  ? ((profActual - profTarget) / profTarget * 100) : null;
                const momRate = prevRevActual > 0 && revActual > 0
                  ? ((revActual - prevRevActual) / prevRevActual * 100) : null;
                const profitMargin = revActual > 0 && profActual > 0
                  ? (profActual / revActual * 100) : null;

                return (
                  <tr key={team.id}>
                    <td className="team-name-cell">{team.name}</td>
                    <td>{revTarget > 0 ? formatCurrencySimple(revTarget) : '-'}</td>
                    <td className={revActual > 0 ? 'actual-highlight' : ''}>
                      {revActual > 0 ? formatCurrencySimple(revActual) : '-'}
                    </td>
                    <td>
                      {revRate !== null ? (
                        <span className={getAchievementClass(revRate)}>{formatPercent(revRate)}</span>
                      ) : '-'}
                    </td>
                    <td>
                      {momRate !== null ? (
                        <span className={getMomClass(momRate)}>{formatPercent(momRate)}</span>
                      ) : '-'}
                    </td>
                    <td>{profTarget > 0 ? formatCurrencySimple(profTarget) : '-'}</td>
                    <td className={profActual > 0 ? 'actual-highlight' : ''}>
                      {profActual > 0 ? formatCurrencySimple(profActual) : '-'}
                    </td>
                    <td>
                      {profRate !== null ? (
                        <span className={getAchievementClass(profRate)}>{formatPercent(profRate)}</span>
                      ) : '-'}
                    </td>
                    <td>
                      {profitMargin !== null ? (
                        <span className={`badge ${profitMargin >= 15 ? 'badge-success' : profitMargin >= 10 ? 'badge-warning' : 'badge-danger'}`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}

              {/* 합계 행 */}
              <tr className="total-row">
                <td><strong>본부 합계</strong></td>
                <td><strong>{formatCurrencySimple(teamTotals.target_revenue)}</strong></td>
                <td className="actual-highlight">
                  <strong>{teamTotals.actual_revenue > 0 ? formatCurrencySimple(teamTotals.actual_revenue) : '-'}</strong>
                </td>
                <td>
                  {revenueRate !== null ? (
                    <span className={getAchievementClass(revenueRate)}><strong>{formatPercent(revenueRate)}</strong></span>
                  ) : '-'}
                </td>
                <td>-</td>
                <td><strong>{formatCurrencySimple(teamTotals.target_profit)}</strong></td>
                <td className="actual-highlight">
                  <strong>{teamTotals.actual_profit > 0 ? formatCurrencySimple(teamTotals.actual_profit) : '-'}</strong>
                </td>
                <td>
                  {profitRate !== null ? (
                    <span className={getAchievementClass(profitRate)}><strong>{formatPercent(profitRate)}</strong></span>
                  ) : '-'}
                </td>
                <td>
                  {teamTotals.actual_revenue > 0 && teamTotals.actual_profit > 0 ? (
                    <strong>{((teamTotals.actual_profit / teamTotals.actual_revenue) * 100).toFixed(1)}%</strong>
                  ) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 누적 실적 테이블 */}
      <div className="card report-section">
        <h3 className="section-title">누적 실적 현황 (1~{month}월)</h3>
        <div className="table-container">
          <table className="table management-table report-table">
            <thead>
              <tr>
                <th>팀명</th>
                <th>누적 매출 목표</th>
                <th>누적 매출 실적</th>
                <th>매출 달성률</th>
                <th>누적 손이익 목표</th>
                <th>누적 손이익 실적</th>
                <th>손이익 달성률</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map(({ team, cumulative_actual, cumulative_target }) => {
                const cumRevTarget = cumulative_target?.cumulative_revenue || 0;
                const cumRevActual = cumulative_actual?.cumulative_revenue || 0;
                const cumProfTarget = cumulative_target?.cumulative_profit || 0;
                const cumProfActual = cumulative_actual?.cumulative_profit || 0;

                const cumRevRate = cumRevTarget > 0 && cumRevActual > 0
                  ? ((cumRevActual / cumRevTarget) * 100) : null;
                const cumProfRate = cumProfTarget > 0 && cumProfActual > 0
                  ? ((cumProfActual / cumProfTarget) * 100) : null;

                return (
                  <tr key={team.id}>
                    <td className="team-name-cell">{team.name}</td>
                    <td>{formatCurrencySimple(cumRevTarget)}</td>
                    <td className="actual-highlight">{cumRevActual > 0 ? formatCurrencySimple(cumRevActual) : '-'}</td>
                    <td>
                      {cumRevRate !== null ? (
                        <span className={cumRevRate >= 100 ? 'badge badge-success' : cumRevRate >= 90 ? 'badge badge-warning' : 'badge badge-danger'}>
                          {cumRevRate.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td>{formatCurrencySimple(cumProfTarget)}</td>
                    <td className="actual-highlight">{cumProfActual > 0 ? formatCurrencySimple(cumProfActual) : '-'}</td>
                    <td>
                      {cumProfRate !== null ? (
                        <span className={cumProfRate >= 100 ? 'badge badge-success' : cumProfRate >= 90 ? 'badge badge-warning' : 'badge badge-danger'}>
                          {cumProfRate.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td><strong>본부 합계</strong></td>
                <td><strong>{formatCurrencySimple(teamTotals.cum_target_revenue)}</strong></td>
                <td className="actual-highlight"><strong>{formatCurrencySimple(teamTotals.cum_actual_revenue)}</strong></td>
                <td>
                  <strong>
                    {teamTotals.cum_target_revenue > 0 && teamTotals.cum_actual_revenue > 0
                      ? `${((teamTotals.cum_actual_revenue / teamTotals.cum_target_revenue) * 100).toFixed(1)}%`
                      : '-'}
                  </strong>
                </td>
                <td><strong>{formatCurrencySimple(teamTotals.cum_target_profit)}</strong></td>
                <td className="actual-highlight"><strong>{formatCurrencySimple(teamTotals.cum_actual_profit)}</strong></td>
                <td>
                  <strong>
                    {teamTotals.cum_target_profit > 0 && teamTotals.cum_actual_profit > 0
                      ? `${((teamTotals.cum_actual_profit / teamTotals.cum_target_profit) * 100).toFixed(1)}%`
                      : '-'}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 비고/특이사항 */}
      <div className="card report-section">
        <div className="section-header">
          <h3 className="section-title">비고 / 특이사항</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowNoteForm(!showNoteForm)}
          >
            {showNoteForm ? '취소' : '+ 비고 추가'}
          </button>
        </div>

        {showNoteForm && (
          <div className="note-form">
            <div className="note-form-row">
              <select
                value={noteForm.note_type}
                onChange={(e) => setNoteForm(prev => ({ ...prev, note_type: e.target.value }))}
                className="note-type-select"
              >
                <option value="general">일반</option>
                <option value="issue">이슈</option>
                <option value="achievement">성과</option>
                <option value="plan">계획</option>
              </select>
              <select
                value={noteForm.team_id}
                onChange={(e) => setNoteForm(prev => ({ ...prev, team_id: e.target.value }))}
                className="note-team-select"
              >
                <option value="">본부 전체</option>
                {teamData.map(({ team }) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <textarea
              className="note-textarea"
              value={noteForm.content}
              onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="비고 내용을 입력하세요..."
              rows={3}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddNote}
              disabled={savingNote || !noteForm.content.trim()}
            >
              {savingNote ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        <div className="notes-list">
          {notes.length === 0 ? (
            <p className="empty-notes">등록된 비고가 없습니다.</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className={`note-item ${getNoteTypeClass(note.note_type)}`}>
                <div className="note-header">
                  <span className={`note-type-badge ${getNoteTypeClass(note.note_type)}`}>
                    {getNoteTypeLabel(note.note_type)}
                  </span>
                  {note.team_name && (
                    <span className="note-team-badge">{note.team_name}</span>
                  )}
                  <button
                    className="note-delete-btn"
                    onClick={() => handleDeleteNote(note.id)}
                    title="삭제"
                  >
                    x
                  </button>
                </div>
                <p className="note-content">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const getAchievementClass = (rate) => {
  if (rate >= 10) return 'badge badge-success';
  if (rate >= 0) return 'badge badge-warning';
  return 'badge badge-danger';
};

const getMomClass = (rate) => {
  if (rate > 0) return 'badge badge-success';
  if (rate === 0) return 'badge badge-warning';
  return 'badge badge-danger';
};

export default MonthlyReport;
