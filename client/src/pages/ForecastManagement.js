import React, { useState, useEffect } from 'react';
import { forecastAPI, targetsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatCurrencySimple, formatPercent } from '../utils/formatters';
import './Management.css';

const ForecastManagement = ({ year }) => {
  const [forecasts, setForecasts] = useState([]);
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
      const [forecastsRes, targetsRes] = await Promise.all([
        forecastAPI.getAll(year),
        targetsAPI.getAll(year),
      ]);
      setForecasts(forecastsRes.data.data);
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

  const handleEdit = (month, forecast) => {
    setEditingMonth(month);
    setFormData({
      revenue_forecast: forecast?.revenue_forecast || '',
      profit_forecast: forecast?.profit_forecast || '',
    });
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setFormData({});
  };

  const handleSave = async (month) => {
    try {
      setSaving(true);
      await forecastAPI.save({
        year,
        month,
        revenue_forecast: formData.revenue_forecast ? parseFloat(formData.revenue_forecast) : null,
        profit_forecast: formData.profit_forecast ? parseFloat(formData.profit_forecast) : null,
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

  if (loading) return <Loading message="예상 데이터를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  // 12개월 데이터 준비
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const forecast = forecasts.find((f) => f.month === month);
    const target = targets.find((t) => t.month === month);
    return {
      month,
      forecast,
      target,
    };
  });

  const totalRevenueForecast = forecasts.reduce((sum, f) => sum + (f.revenue_forecast || 0), 0);
  const totalProfitForecast = forecasts.reduce((sum, f) => sum + (f.profit_forecast || 0), 0);
  const totalRevenueTarget = targets.reduce((sum, t) => sum + (t.revenue_target || 0), 0);
  const totalProfitTarget = targets.reduce((sum, t) => sum + (t.profit_target || 0), 0);

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{year}년 예상 관리 (익월)</h2>
          <p className="page-subtitle">월별 매출 및 손이익 예상을 입력하고 관리합니다</p>
        </div>
        <div className="summary-box">
          <div className="summary-item">
            <span className="summary-label">누적 매출 예상</span>
            <span className="summary-value">{formatCurrencySimple(totalRevenueForecast)}</span>
            {totalRevenueTarget > 0 && totalRevenueForecast > 0 && (
              <span className="summary-detail">
                목표 대비 {formatPercent(((totalRevenueForecast - totalRevenueTarget) / totalRevenueTarget) * 100)}
              </span>
            )}
          </div>
          <div className="summary-item">
            <span className="summary-label">누적 손이익 예상</span>
            <span className="summary-value">{formatCurrencySimple(totalProfitForecast)}</span>
            {totalProfitTarget > 0 && totalProfitForecast > 0 && (
              <span className="summary-detail">
                목표 대비 {formatPercent(((totalProfitForecast - totalProfitTarget) / totalProfitTarget) * 100)}
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
                <th>매출 예상</th>
                <th>예상 달성률</th>
                <th>손이익 목표</th>
                <th>손이익 예상</th>
                <th>예상 달성률</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(({ month, forecast, target }) => {
                const isEditing = editingMonth === month;
                const revenueForecastRate =
                  forecast?.revenue_forecast && target?.revenue_target
                    ? (((forecast.revenue_forecast - target.revenue_target) / target.revenue_target) * 100)
                    : null;
                const profitForecastRate =
                  forecast?.profit_forecast && target?.profit_target
                    ? (((forecast.profit_forecast - target.profit_target) / target.profit_target) * 100)
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
                          value={formData.revenue_forecast}
                          onChange={(e) => handleChange('revenue_forecast', e.target.value)}
                          placeholder="매출 예상 (원)"
                          step="100000000"
                        />
                      ) : forecast?.revenue_forecast ? (
                        <div>
                          <div className="primary-value forecast-highlight">
                            {formatCurrencySimple(forecast.revenue_forecast)}
                          </div>
                          <div className="secondary-value">{formatCurrency(forecast.revenue_forecast)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {!isEditing && revenueForecastRate !== null && (
                        <span className={getAchievementClass(revenueForecastRate)}>
                          {formatPercent(revenueForecastRate)}
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
                          value={formData.profit_forecast}
                          onChange={(e) => handleChange('profit_forecast', e.target.value)}
                          placeholder="손이익 예상 (원)"
                          step="10000000"
                        />
                      ) : forecast?.profit_forecast ? (
                        <div>
                          <div className="primary-value forecast-highlight">
                            {formatCurrencySimple(forecast.profit_forecast)}
                          </div>
                          <div className="secondary-value">{formatCurrency(forecast.profit_forecast)}</div>
                        </div>
                      ) : (
                        <span className="empty-value">-</span>
                      )}
                    </td>
                    <td>
                      {!isEditing && profitForecastRate !== null && (
                        <span className={getAchievementClass(profitForecastRate)}>
                          {formatPercent(profitForecastRate)}
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
                          onClick={() => handleEdit(month, forecast)}
                        >
                          {forecast?.revenue_forecast ? '수정' : '입력'}
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

export default ForecastManagement;
