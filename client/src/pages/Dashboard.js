import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatCurrencySimple, formatPercent } from '../utils/formatters';
import './Dashboard.css';

const Dashboard = ({ year }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getData(year);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  if (loading) return <Loading message="대시보드 데이터를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!data) return null;

  const { summary, monthly } = data;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="page-title">{year}년 매출 및 손이익 현황</h2>
        <p className="page-subtitle">
          전체 목표 대비 실적 및 예상을 한눈에 확인하세요
        </p>
      </div>

      {/* 요약 통계 카드 */}
      <div className="stats-grid">
        <StatCard
          title="연간 매출 목표"
          value={formatCurrencySimple(summary.total_revenue_target)}
          subtitle={formatCurrency(summary.total_revenue_target)}
          icon="💰"
          color="blue"
        />
        <StatCard
          title="매출 실적"
          value={formatCurrencySimple(summary.total_revenue_actual)}
          subtitle={`${summary.months_with_actuals}개월 집계`}
          icon="📈"
          color="green"
          trend={parseFloat(summary.revenue_achievement_rate || 0)}
        />
        <StatCard
          title="연간 손이익 목표"
          value={formatCurrencySimple(summary.total_profit_target)}
          subtitle={formatCurrency(summary.total_profit_target)}
          icon="💎"
          color="purple"
        />
        <StatCard
          title="손이익 실적"
          value={formatCurrencySimple(summary.total_profit_actual)}
          subtitle={`${summary.months_with_actuals}개월 집계`}
          icon="📊"
          color="orange"
          trend={parseFloat(summary.profit_achievement_rate || 0)}
        />
      </div>

      {/* 월별 상세 테이블 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="section-title">월별 상세 현황</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>월</th>
                <th>매출 목표</th>
                <th>매출 실적</th>
                <th>매출 예상</th>
                <th>매출 달성률</th>
                <th>손이익 목표</th>
                <th>손이익 실적</th>
                <th>손이익 예상</th>
                <th>손이익 달성률</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((month) => (
                <tr key={month.month}>
                  <td className="month-cell">{month.month}월</td>
                  <td>{formatCurrencySimple(month.revenue_target)}</td>
                  <td className={month.revenue_actual ? 'actual-cell' : 'empty-cell'}>
                    {month.revenue_actual ? formatCurrencySimple(month.revenue_actual) : '-'}
                  </td>
                  <td className={month.revenue_forecast ? 'forecast-cell' : 'empty-cell'}>
                    {month.revenue_forecast ? formatCurrencySimple(month.revenue_forecast) : '-'}
                  </td>
                  <td>
                    {month.revenue_achievement_rate !== null ? (
                      <span className={getAchievementClass(month.revenue_achievement_rate)}>
                        {formatPercent(month.revenue_achievement_rate)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{formatCurrencySimple(month.profit_target)}</td>
                  <td className={month.profit_actual ? 'actual-cell' : 'empty-cell'}>
                    {month.profit_actual ? formatCurrencySimple(month.profit_actual) : '-'}
                  </td>
                  <td className={month.profit_forecast ? 'forecast-cell' : 'empty-cell'}>
                    {month.profit_forecast ? formatCurrencySimple(month.profit_forecast) : '-'}
                  </td>
                  <td>
                    {month.profit_achievement_rate !== null ? (
                      <span className={getAchievementClass(month.profit_achievement_rate)}>
                        {formatPercent(month.profit_achievement_rate)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>합계</td>
                <td>{formatCurrencySimple(summary.total_revenue_target)}</td>
                <td className="actual-cell">
                  {formatCurrencySimple(summary.total_revenue_actual)}
                </td>
                <td className="forecast-cell">
                  {summary.total_revenue_forecast > 0
                    ? formatCurrencySimple(summary.total_revenue_forecast)
                    : '-'}
                </td>
                <td>
                  {summary.revenue_achievement_rate && (
                    <span className={getAchievementClass(parseFloat(summary.revenue_achievement_rate))}>
                      {summary.revenue_achievement_rate}%
                    </span>
                  )}
                </td>
                <td>{formatCurrencySimple(summary.total_profit_target)}</td>
                <td className="actual-cell">
                  {formatCurrencySimple(summary.total_profit_actual)}
                </td>
                <td className="forecast-cell">
                  {summary.total_profit_forecast > 0
                    ? formatCurrencySimple(summary.total_profit_forecast)
                    : '-'}
                </td>
                <td>
                  {summary.profit_achievement_rate && (
                    <span className={getAchievementClass(parseFloat(summary.profit_achievement_rate))}>
                      {summary.profit_achievement_rate}%
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 범례 */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-box actual-cell"></span>
          <span>실적 (당월)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box forecast-cell"></span>
          <span>예상 (익월)</span>
        </div>
      </div>
    </div>
  );
};

// 달성률에 따른 CSS 클래스 반환
const getAchievementClass = (rate) => {
  if (rate >= 10) return 'achievement-excellent';
  if (rate >= 0) return 'achievement-good';
  return 'achievement-poor';
};

export default Dashboard;
