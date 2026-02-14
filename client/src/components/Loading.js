import React from 'react';

const Loading = ({ message = '로딩 중...' }) => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
        {message}
      </p>
    </div>
  );
};

export default Loading;
