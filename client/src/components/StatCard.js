import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <div className="stat-card-info">
          <h3 className="stat-card-title">{title}</h3>
          <p className="stat-card-value">{value}</p>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </div>
        {icon && <div className="stat-card-icon">{icon}</div>}
      </div>
      {trend !== undefined && trend !== null && (
        <div className={`stat-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          <span className="trend-icon">{trend >= 0 ? '↑' : '↓'}</span>
          <span className="trend-value">
            {trend >= 0 ? '+' : ''}{trend.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
