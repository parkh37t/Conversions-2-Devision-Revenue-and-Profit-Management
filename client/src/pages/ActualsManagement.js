import React, { useState, useEffect } from 'react';
import { actualsAPI, targetsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatCurrencySimple, formatPercent } from '../utils/formatters';
import './Management.css';

const ActualsManagement = ({ year }) => {
  const [actuals, setActuals] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMonth, setEditingMonth] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actualsRes, targetsRes] = await Promise.all([
        actualsAPI.getAll(year),
        targetsAPI.getAll(year),
      ]);
      setActuals(actualsRes.data.data);
      setTargets(targetsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  const handleEdit = (month, actual) => {
    setEditingMonth(month);
    setFormData({
      revenue_actual: actual?.revenue_actual || '',
      profit_actual: actual?.profit_actual || '',
    });
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setFormData({});
  };

  const handleSave = async (month) => {
    try {
      setSaving(true);
      await actualsAPI.save({
        year,
        month,
        revenue_actual: formData.revenue_actual ? parseFloat(formData.revenue_actual) : null,
        profit_actual: formData.profit_actual ? parseFloat(formData.profit_actual) : null,
      });
      await fetchData();
      setEditingMonth(null);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) return <Loading message="실적 데이터를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  // 12개월 데이터 준비
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const actual = actuals.find((a) => a.month === month);
    const target = targets.find((t) => t.month === month);
    return {
      month,
      actual,
      target,
    };
  });

  const totalRevenueActual = actuals.reduce((sum, a) => sum + (a.revenue_actual || 0), 0);
  const totalProfitActual = actuals.reduce((sum, a) => sum + (a.profit_actual || 0), 0);
  const totalRevenueTarget = targets.reduce((sum, t) => sum + (t.revenue_target || 0), 0);
  const totalProfitTarget = targets.reduce((sum, t) => sum + (t.profit_target || 0), 0);

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{year}년 실적 관리 (당월)</h2>
          <p className="page-subtitle">월별 매출 및 손이익 실적을 입력하고 관리합니다</p>
        </div>
        <div className="summary-box">
          <div className="summary-item">
            <span className="summary-label">누적 매출 실적</span>
            <span className="summary-value">{formatCurrencySimple(totalRevenueActual)}</span>
            {totalRevenueTarget > 0 && (
              <span className="summary-detail">
                목표 대비 {formatPercent(((totalRevenueActual - totalRevenueTarget) / totalRevenueTarget) * 100)}
              </span>
            )}
          </div>
          <div className="summary-item">
            <span className="summary-label">누적 손이익 실적</span>
            <span className="summary-value">{formatCurrencySimple(totalProfitActual)}</span>
            {totalProfitTarget > 0 && (
              <span className="summary-detail">
                목표 대비 {formatPercent(((totalProfitActual - totalProfitTarget) / totalProfitTarget) * 100)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table management-table">
            <thead>
              <tr>
                <th>월</th>
                <th>매출 목표</th>
                <th>매출 실적</th>
                <th>매출 달성률</th>
                <th>손이익 목표</th>
                <th>손이익 실적</th>
                <th>손이익 달성률</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(({ month, actual, target }) => {
                const isEditing = editingMonth === month;
                const revenueAchievement =
                  actual?.revenue_actual && target?.revenue_target
                    ? (((actual.revenue_actual - target.revenue_target) / target.revenue_target) * 100)
                    : null;
                const profitAchievement =
                  actual?.profit_actual && target?.profit_target
                    ? (((actual.profit_actual - target.profit_target) / target.profit_target) * 100)
                    : null;

                return (
                  <tr key={month}>
                    <td className="month-cell">{month}월</td>
                    <td>
                      {target?.revenue_target ? (
                        <div>
                          <div className="primary-value">{formatCurrencySimple(target.revenue_target)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input"
                          value={formData.revenue_actual}
                          onChange={(e) => handleChange('revenue_actual', e.target.value)}
                          placeholder="매출 실적 (원)"
                          step="100000000"
                        />
                      ) : actual?.revenue_actual ? (
                        <div>
                          <div className="primary-value actual-highlight">
                            {formatCurrencySimple(actual.revenue_actual)}
                          </div>
                          <div className="secondary-value">{formatCurrency(actual.revenue_actual)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {!isEditing && revenueAchievement !== null && (
                        <span className={getAchievementClass(revenueAchievement)}>
                          {formatPercent(revenueAchievement)}
                        </span>
                      )}
                    </td>
                    <td>
                      {target?.profit_target ? (
                        <div>
                          <div className="primary-value">{formatCurrencySimple(target.profit_target)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input"
                          value={formData.profit_actual}
                          onChange={(e) => handleChange('profit_actual', e.target.value)}
                          placeholder="손이익 실적 (원)"
                          step="10000000"
                        />
                      ) : actual?.profit_actual ? (
                        <div>
                          <div className="primary-value actual-highlight">
                            {formatCurrencySimple(actual.profit_actual)}
                          </div>
                          <div className="secondary-value">{formatCurrency(actual.profit_actual)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {!isEditing && profitAchievement !== null && (
                        <span className={getAchievementClass(profitAchievement)}>
                          {formatPercent(profitAchievement)}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSave(month)}
                            disabled={saving}
                          >
                            {saving ? '저장 중...' : '저장'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEdit(month, actual)}
                        >
                          {actual?.revenue_actual ? '수정' : '입력'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

export default ActualsManagement;
