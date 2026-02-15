import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 목표 관련 API
export const targetsAPI = {
  getAll: (year) => api.get(`/targets/${year}`),
  get: (year, month) => api.get(`/targets/${year}/${month}`),
  save: (data) => api.post('/targets', data),
  saveBulk: (targets) => api.post('/targets/bulk', { targets }),
  delete: (year, month) => api.delete(`/targets/${year}/${month}`),
};

// 실적 관련 API
export const actualsAPI = {
  getAll: (year) => api.get(`/actuals/${year}`),
  get: (year, month) => api.get(`/actuals/${year}/${month}`),
  save: (data) => api.post('/actuals', data),
  saveBulk: (actuals) => api.post('/actuals/bulk', { actuals }),
  delete: (year, month) => api.delete(`/actuals/${year}/${month}`),
};

// 예상 관련 API
export const forecastAPI = {
  getAll: (year) => api.get(`/forecast/${year}`),
  get: (year, month) => api.get(`/forecast/${year}/${month}`),
  save: (data) => api.post('/forecast', data),
  saveBulk: (forecasts) => api.post('/forecast/bulk', { forecasts }),
  delete: (year, month) => api.delete(`/forecast/${year}/${month}`),
};

// 대시보드 관련 API
export const dashboardAPI = {
  getData: (year) => api.get(`/dashboard/${year}`),
  getRecentUpdates: (year, limit = 10) =>
    api.get(`/dashboard/${year}/recent-updates?limit=${limit}`),
};

// 팀 관련 API
export const teamsAPI = {
  getAll: (activeOnly = true) => api.get(`/teams?active=${activeOnly}`),
  get: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// 실적 관리 (팀별) API
export const performanceAPI = {
  // 연간 전체 팀별 실적 조회
  getYearData: (year) => api.get(`/performance/${year}`),
  // 월간 팀별 실적 상세 조회
  getMonthData: (year, month) => api.get(`/performance/${year}/${month}`),
  // 팀별 목표 저장
  saveTeamTarget: (data) => api.post('/performance/team-targets', data),
  saveTeamTargetsBulk: (targets) => api.post('/performance/team-targets/bulk', { targets }),
  // 팀별 실적 저장
  saveTeamActual: (data) => api.post('/performance/team-actuals', data),
  saveTeamActualsBulk: (actuals) => api.post('/performance/team-actuals/bulk', { actuals }),
  // 팀별 예상 저장
  saveTeamForecast: (data) => api.post('/performance/team-forecasts', data),
  saveTeamForecastsBulk: (forecasts) => api.post('/performance/team-forecasts/bulk', { forecasts }),
  // 비고 관리
  getNotes: (year, month) => api.get(`/performance/notes/${year}/${month}`),
  addNote: (data) => api.post('/performance/notes', data),
  updateNote: (id, data) => api.put(`/performance/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/performance/notes/${id}`),
};

// 헬스 체크
export const healthCheck = () => api.get('/health');

export default api;
