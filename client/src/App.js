import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TargetsManagement from './pages/TargetsManagement';
import ActualsManagement from './pages/ActualsManagement';
import ForecastManagement from './pages/ForecastManagement';
import TeamPerformance from './pages/TeamPerformance';
import MonthlyReport from './pages/MonthlyReport';
import './App.css';

function App() {
  const [selectedYear, setSelectedYear] = useState(2026);

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <h1 className="app-title">
                <span className="title-icon">📊</span>
                컨버전스 2본부
              </h1>
              <div className="year-selector">
                <label htmlFor="year">연도:</label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="year-select"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <nav className="app-nav">
          <div className="container">
            <ul className="nav-list">
              <li>
                <Link to="/" className="nav-link">
                  대시보드
                </Link>
              </li>
              <li>
                <Link to="/team-performance" className="nav-link nav-highlight">
                  팀별 실적
                </Link>
              </li>
              <li>
                <Link to="/monthly-report" className="nav-link nav-highlight">
                  월간 보고서
                </Link>
              </li>
              <li>
                <Link to="/targets" className="nav-link">
                  목표 관리
                </Link>
              </li>
              <li>
                <Link to="/actuals" className="nav-link">
                  실적 입력
                </Link>
              </li>
              <li>
                <Link to="/forecast" className="nav-link">
                  예상 관리
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard year={selectedYear} />} />
              <Route path="/team-performance" element={<TeamPerformance year={selectedYear} />} />
              <Route path="/monthly-report" element={<MonthlyReport year={selectedYear} />} />
              <Route path="/targets" element={<TargetsManagement year={selectedYear} />} />
              <Route path="/actuals" element={<ActualsManagement year={selectedYear} />} />
              <Route path="/forecast" element={<ForecastManagement year={selectedYear} />} />
            </Routes>
          </div>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>© 2026 컨버전스 2본부. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
