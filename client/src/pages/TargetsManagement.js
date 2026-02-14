import React, { useState, useEffect } from 'react';
import { targetsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatCurrencySimple } from '../utils/formatters';
import './Management.css';

const TargetsManagement = ({ year }) => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMonth, setEditingMonth] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await targetsAPI.getAll(year);
      setTargets(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || '목표 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [year]);

  const handleEdit = (month, target) => {
    setEditingMonth(month);
    setFormData({
      revenue_target: target?.revenue_target || '',
      profit_target: target?.profit_target || '',
    });
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setFormData({});
  };

  const handleSave = async (month) => {
    try {
      setSaving(true);
      await targetsAPI.save({
        year,
        month,
        revenue_target: parseFloat(formData.revenue_target),
        profit_target: parseFloat(formData.profit_target),
      });
      await fetchTargets();
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

  if (loading) return <Loading message="목표 데이터를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTargets} />;

  // 12개월 데이터 준비 (없는 월은 빈 객체)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return targets.find((t) => t.month === month) || { month, revenue_target: null, profit_target: null };
  });

  const totalRevenue = targets.reduce((sum, t) => sum + (t.revenue_target || 0), 0);
  const totalProfit = targets.reduce((sum, t) => sum + (t.profit_target || 0), 0);

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{year}년 목표 관리</h2>
          <p className="page-subtitle">월별 매출 및 손이익 목표를 설정하고 관리합니다</p>
        </div>
        <div className="summary-box">
          <div className="summary-item">
            <span className="summary-label">연간 매출 목표</span>
            <span className="summary-value">{formatCurrencySimple(totalRevenue)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">연간 손이익 목표</span>
            <span className="summary-value">{formatCurrencySimple(totalProfit)}</span>
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
                <th>손이익 목표</th>
                <th>손이익률</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((target) => {
                const isEditing = editingMonth === target.month;
                const profitRate =
                  target.revenue_target && target.profit_target
                    ? ((target.profit_target / target.revenue_target) * 100).toFixed(2)
                    : '-';

                return (
                  <tr key={target.month}>
                    <td className="month-cell">{target.month}월</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input"
                          value={formData.revenue_target}
                          onChange={(e) => handleChange('revenue_target', e.target.value)}
                          placeholder="매출 목표 (원)"
                          step="100000000"
                        />
                      ) : target.revenue_target ? (
                        <div>
                          <div className="primary-value">{formatCurrencySimple(target.revenue_target)}</div>
                          <div className="secondary-value">{formatCurrency(target.revenue_target)}</div>
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
                          value={formData.profit_target}
                          onChange={(e) => handleChange('profit_target', e.target.value)}
                          placeholder="손이익 목표 (원)"
                          step="10000000"
                        />
                      ) : target.profit_target ? (
                        <div>
                          <div className="primary-value">{formatCurrencySimple(target.profit_target)}</div>
                          <div className="secondary-value">{formatCurrency(target.profit_target)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {!isEditing && profitRate !== '-' && (
                        <span className="badge badge-success">{profitRate}%</span>
                      )}
                      {!isEditing && profitRate === '-' && <span className="empty-value">-</span>}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSave(target.month)}
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
                          onClick={() => handleEdit(target.month, target)}
                        >
                          {target.revenue_target ? '수정' : '입력'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>합계</td>
                <td>
                  <div className="primary-value">{formatCurrencySimple(totalRevenue)}</div>
                  <div className="secondary-value">{formatCurrency(totalRevenue)}</div>
                </td>
                <td>
                  <div className="primary-value">{formatCurrencySimple(totalProfit)}</div>
                  <div className="secondary-value">{formatCurrency(totalProfit)}</div>
                </td>
                <td>
                  {totalRevenue > 0 && (
                    <span className="badge badge-success">
                      {((totalProfit / totalRevenue) * 100).toFixed(2)}%
                    </span>
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TargetsManagement;
