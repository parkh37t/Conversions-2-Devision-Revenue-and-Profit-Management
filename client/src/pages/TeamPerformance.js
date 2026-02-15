import React, { useState, useEffect, useCallback } from 'react';
import { performanceAPI, teamsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrencySimple, formatPercent } from '../utils/formatters';
import './Management.css';
import './TeamPerformance.css';

const TeamPerformance = ({ year }) => {
  const [teams, setTeams] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { teamId, month, type }
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('revenue'); // 'revenue' or 'profit'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsRes, perfRes] = await Promise.all([
        teamsAPI.getAll(),
        performanceAPI.getYearData(year),
      ]);
      setTeams(teamsRes.data.data);
      setPerformanceData(perfRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 현재 월 자동 선택
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    setSelectedMonth(currentMonth > 12 ? 12 : currentMonth);
  }, []);

  const getTeamData = (teamId) => {
    return performanceData.find(d => d.team.id === teamId);
  };

  const getMonthTarget = (teamId, month) => {
    const data = getTeamData(teamId);
    return data?.targets?.find(t => t.month === month);
  };

  const getMonthActual = (teamId, month) => {
    const data = getTeamData(teamId);
    return data?.actuals?.find(a => a.month === month);
  };

  const getMonthForecast = (teamId, month) => {
    const data = getTeamData(teamId);
    return data?.forecasts?.find(f => f.month === month);
  };

  const handleEdit = (teamId, month, type) => {
    const target = getMonthTarget(teamId, month);
    const actual = getMonthActual(teamId, month);
    const forecast = getMonthForecast(teamId, month);

    setEditingCell({ teamId, month, type });
    if (type === 'target') {
      setFormData({
        revenue_target: target?.revenue_target || '',
        profit_target: target?.profit_target || '',
      });
    } else if (type === 'actual') {
      setFormData({
        revenue_actual: actual?.revenue_actual || '',
        profit_actual: actual?.profit_actual || '',
      });
    } else if (type === 'forecast') {
      setFormData({
        revenue_forecast: forecast?.revenue_forecast || '',
        profit_forecast: forecast?.profit_forecast || '',
      });
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;
    const { teamId, month, type } = editingCell;

    try {
      setSaving(true);
      if (type === 'target') {
        await performanceAPI.saveTeamTarget({
          team_id: teamId,
          year,
          month,
          revenue_target: formData.revenue_target ? parseFloat(formData.revenue_target) : 0,
          profit_target: formData.profit_target ? parseFloat(formData.profit_target) : 0,
        });
      } else if (type === 'actual') {
        await performanceAPI.saveTeamActual({
          team_id: teamId,
          year,
          month,
          revenue_actual: formData.revenue_actual ? parseFloat(formData.revenue_actual) : 0,
          profit_actual: formData.profit_actual ? parseFloat(formData.profit_actual) : 0,
        });
      } else if (type === 'forecast') {
        await performanceAPI.saveTeamForecast({
          team_id: teamId,
          year,
          month,
          revenue_forecast: formData.revenue_forecast ? parseFloat(formData.revenue_forecast) : 0,
          profit_forecast: formData.profit_forecast ? parseFloat(formData.profit_forecast) : 0,
        });
      }
      await fetchData();
      setEditingCell(null);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setFormData({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <Loading message="팀별 실적 데이터를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  // 팀별 누적 합산 계산
  const getTeamCumulative = (teamId) => {
    const data = getTeamData(teamId);
    if (!data) return { revenue: 0, profit: 0, target_revenue: 0, target_profit: 0 };
    const revenue = data.actuals.reduce((sum, a) => sum + (a.revenue_actual || 0), 0);
    const profit = data.actuals.reduce((sum, a) => sum + (a.profit_actual || 0), 0);
    const target_revenue = data.targets.reduce((sum, t) => sum + (t.revenue_target || 0), 0);
    const target_profit = data.targets.reduce((sum, t) => sum + (t.profit_target || 0), 0);
    return { revenue, profit, target_revenue, target_profit };
  };

  // 본부 전체 합산
  const divisionTotal = teams.reduce(
    (acc, team) => {
      const cum = getTeamCumulative(team.id);
      acc.revenue += cum.revenue;
      acc.profit += cum.profit;
      acc.target_revenue += cum.target_revenue;
      acc.target_profit += cum.target_profit;
      return acc;
    },
    { revenue: 0, profit: 0, target_revenue: 0, target_profit: 0 }
  );

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{year}년 팀별 실적 관리</h2>
          <p className="page-subtitle">팀/사업별 월간 매출 및 손이익 실적을 관리합니다 (Cowork 대체)</p>
        </div>
        <div className="summary-box">
          <div className="summary-item">
            <span className="summary-label">본부 누적 매출</span>
            <span className="summary-value">{formatCurrencySimple(divisionTotal.revenue)}</span>
            {divisionTotal.target_revenue > 0 && (
              <span className="summary-detail">
                연간목표 대비 {((divisionTotal.revenue / divisionTotal.target_revenue) * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="summary-item">
            <span className="summary-label">본부 누적 손이익</span>
            <span className="summary-value">{formatCurrencySimple(divisionTotal.profit)}</span>
            {divisionTotal.target_profit > 0 && (
              <span className="summary-detail">
                연간목표 대비 {((divisionTotal.profit / divisionTotal.target_profit) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 뷰 모드 및 월 선택 */}
      <div className="controls-bar">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'revenue' ? 'active' : ''}`}
            onClick={() => setViewMode('revenue')}
          >
            매출
          </button>
          <button
            className={`toggle-btn ${viewMode === 'profit' ? 'active' : ''}`}
            onClick={() => setViewMode('profit')}
          >
            손이익
          </button>
        </div>
        <div className="month-selector">
          <label>조회 월: </label>
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            <option value="">전체</option>
            {months.map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>

      {/* 팀별 실적 테이블 */}
      <div className="card">
        <div className="table-container">
          <table className="table management-table team-perf-table">
            <thead>
              <tr>
                <th className="sticky-col">팀명</th>
                {(selectedMonth ? [selectedMonth] : months).map(m => (
                  <th key={m} colSpan={3} className="month-header">{m}월</th>
                ))}
                <th colSpan={2} className="total-header">누적</th>
              </tr>
              <tr>
                <th className="sticky-col sub-header"></th>
                {(selectedMonth ? [selectedMonth] : months).map(m => (
                  <React.Fragment key={m}>
                    <th className="sub-header">목표</th>
                    <th className="sub-header">실적</th>
                    <th className="sub-header">달성률</th>
                  </React.Fragment>
                ))}
                <th className="sub-header">실적합계</th>
                <th className="sub-header">달성률</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => {
                const cumulative = getTeamCumulative(team.id);
                const cumulativeTarget = viewMode === 'revenue' ? cumulative.target_revenue : cumulative.target_profit;
                const cumulativeActual = viewMode === 'revenue' ? cumulative.revenue : cumulative.profit;
                const cumulativeRate = cumulativeTarget > 0
                  ? ((cumulativeActual / cumulativeTarget) * 100).toFixed(1)
                  : '-';

                return (
                  <tr key={team.id}>
                    <td className="sticky-col team-name-cell">{team.name}</td>
                    {(selectedMonth ? [selectedMonth] : months).map(m => {
                      const target = getMonthTarget(team.id, m);
                      const actual = getMonthActual(team.id, m);
                      const forecast = getMonthForecast(team.id, m);

                      const targetVal = viewMode === 'revenue' ? target?.revenue_target : target?.profit_target;
                      const actualVal = viewMode === 'revenue' ? actual?.revenue_actual : actual?.profit_actual;
                      const forecastVal = viewMode === 'revenue' ? forecast?.revenue_forecast : forecast?.profit_forecast;
                      const rate = targetVal && actualVal
                        ? (((actualVal - targetVal) / targetVal) * 100)
                        : null;

                      const isEditingTarget = editingCell?.teamId === team.id && editingCell?.month === m && editingCell?.type === 'target';
                      const isEditingActual = editingCell?.teamId === team.id && editingCell?.month === m && editingCell?.type === 'actual';

                      return (
                        <React.Fragment key={m}>
                          {/* 목표 */}
                          <td
                            className="data-cell target-cell"
                            onDoubleClick={() => handleEdit(team.id, m, 'target')}
                            title="더블클릭하여 목표 수정"
                          >
                            {isEditingTarget ? (
                              <div className="inline-edit">
                                <input
                                  type="number"
                                  className="inline-input"
                                  value={viewMode === 'revenue' ? formData.revenue_target : formData.profit_target}
                                  onChange={(e) => handleChange(
                                    viewMode === 'revenue' ? 'revenue_target' : 'profit_target',
                                    e.target.value
                                  )}
                                  step="10000000"
                                  autoFocus
                                />
                                <div className="inline-actions">
                                  <button className="inline-btn save" onClick={handleSave} disabled={saving}>V</button>
                                  <button className="inline-btn cancel" onClick={handleCancel}>X</button>
                                </div>
                              </div>
                            ) : (
                              <span className="cell-value">{targetVal ? formatCurrencySimple(targetVal) : '-'}</span>
                            )}
                          </td>
                          {/* 실적 */}
                          <td
                            className={`data-cell actual-cell ${actualVal ? 'has-value' : ''}`}
                            onDoubleClick={() => handleEdit(team.id, m, 'actual')}
                            title="더블클릭하여 실적 입력/수정"
                          >
                            {isEditingActual ? (
                              <div className="inline-edit">
                                <input
                                  type="number"
                                  className="inline-input"
                                  value={viewMode === 'revenue' ? formData.revenue_actual : formData.profit_actual}
                                  onChange={(e) => handleChange(
                                    viewMode === 'revenue' ? 'revenue_actual' : 'profit_actual',
                                    e.target.value
                                  )}
                                  step="10000000"
                                  autoFocus
                                />
                                <div className="inline-actions">
                                  <button className="inline-btn save" onClick={handleSave} disabled={saving}>V</button>
                                  <button className="inline-btn cancel" onClick={handleCancel}>X</button>
                                </div>
                              </div>
                            ) : (
                              <span className={`cell-value ${actualVal ? 'actual-highlight' : ''} ${!actualVal && forecastVal ? 'forecast-highlight' : ''}`}>
                                {actualVal ? formatCurrencySimple(actualVal) : forecastVal ? `(${formatCurrencySimple(forecastVal)})` : '-'}
                              </span>
                            )}
                          </td>
                          {/* 달성률 */}
                          <td className="data-cell rate-cell">
                            {rate !== null ? (
                              <span className={getAchievementClass(rate)}>
                                {formatPercent(rate)}
                              </span>
                            ) : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {/* 누적 */}
                    <td className="data-cell total-cell">
                      <strong>{formatCurrencySimple(cumulativeActual)}</strong>
                    </td>
                    <td className="data-cell total-cell">
                      <span className={typeof cumulativeRate === 'string' ? '' : getAchievementClass(parseFloat(cumulativeRate) - 100)}>
                        {cumulativeRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* 본부 합계 행 */}
              <tr className="total-row">
                <td className="sticky-col team-name-cell"><strong>본부 합계</strong></td>
                {(selectedMonth ? [selectedMonth] : months).map(m => {
                  const monthTargetSum = teams.reduce((sum, team) => {
                    const t = getMonthTarget(team.id, m);
                    return sum + (viewMode === 'revenue' ? (t?.revenue_target || 0) : (t?.profit_target || 0));
                  }, 0);
                  const monthActualSum = teams.reduce((sum, team) => {
                    const a = getMonthActual(team.id, m);
                    return sum + (viewMode === 'revenue' ? (a?.revenue_actual || 0) : (a?.profit_actual || 0));
                  }, 0);
                  const monthRate = monthTargetSum > 0 && monthActualSum > 0
                    ? (((monthActualSum - monthTargetSum) / monthTargetSum) * 100)
                    : null;

                  return (
                    <React.Fragment key={m}>
                      <td className="data-cell"><strong>{formatCurrencySimple(monthTargetSum)}</strong></td>
                      <td className="data-cell"><strong>{monthActualSum > 0 ? formatCurrencySimple(monthActualSum) : '-'}</strong></td>
                      <td className="data-cell">
                        {monthRate !== null ? (
                          <span className={getAchievementClass(monthRate)}>
                            <strong>{formatPercent(monthRate)}</strong>
                          </span>
                        ) : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="data-cell total-cell">
                  <strong>{formatCurrencySimple(viewMode === 'revenue' ? divisionTotal.revenue : divisionTotal.profit)}</strong>
                </td>
                <td className="data-cell total-cell">
                  <strong>
                    {(viewMode === 'revenue' ? divisionTotal.target_revenue : divisionTotal.target_profit) > 0
                      ? `${(((viewMode === 'revenue' ? divisionTotal.revenue : divisionTotal.profit) /
                          (viewMode === 'revenue' ? divisionTotal.target_revenue : divisionTotal.target_profit)) * 100).toFixed(1)}%`
                      : '-'}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="legend-box">
        <span className="legend-item"><span className="legend-dot actual"></span> 실적 입력 완료</span>
        <span className="legend-item"><span className="legend-dot forecast"></span> 예상 (괄호 표시)</span>
        <span className="legend-item">* 셀을 더블클릭하면 목표/실적을 수정할 수 있습니다</span>
      </div>
    </div>
  );
};

const getAchievementClass = (rate) => {
  if (rate >= 10) return 'badge badge-success';
  if (rate >= 0) return 'badge badge-warning';
  return 'badge badge-danger';
};

export default TeamPerformance;
