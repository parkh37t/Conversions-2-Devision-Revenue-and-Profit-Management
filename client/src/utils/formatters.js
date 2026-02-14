// 금액 포맷팅 (원화)
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// 간단한 금액 포맷팅 (억 단위)
export const formatCurrencySimple = (value) => {
  if (value === null || value === undefined) return '-';
  const eok = value / 100000000;
  return `${eok.toFixed(1)}억`;
};

// 퍼센트 포맷팅
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// 월 이름
export const getMonthName = (month) => {
  return `${month}월`;
};

// 날짜 포맷팅
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// 달성률 색상
export const getAchievementColor = (rate) => {
  if (rate === null || rate === undefined) return 'gray';
  if (rate >= 0) return 'green';
  return 'red';
};

// 달성률 배지 스타일
export const getAchievementBadgeClass = (rate) => {
  if (rate === null || rate === undefined) return 'badge';
  if (rate >= 10) return 'badge badge-success';
  if (rate >= 0) return 'badge badge-warning';
  return 'badge badge-danger';
};
