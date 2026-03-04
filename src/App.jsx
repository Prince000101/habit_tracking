import { useState } from 'react';
import { format } from 'date-fns';
import DailyCheckin from './components/DailyCheckin';
import HabitManager from './components/HabitManager';
import Progress from './components/Progress';
import Goals from './components/Goals';
import './App.css';

const NAV = [
  { id: 'daily', label: 'Daily Check-in', icon: '✅', emoji: '📅' },
  { id: 'progress', label: 'Progress', icon: '📈', emoji: '📊' },
  { id: 'goals', label: 'Goals', icon: '🎯', emoji: '🏆' },
  { id: 'habits', label: 'Habits', icon: '📝', emoji: '📋' },
];

function Sidebar({ active, onNav }) {
  const today = format(new Date(), 'EEEE, MMM d');
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">📓</div>
        <span className="sidebar-brand-name">HabitOS</span>
      </div>

      <div className="sidebar-section-label">Workspace</div>
      {NAV.map(item => (
        <button
          key={item.id}
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => onNav(item.id)}
        >
          <span className="nav-item-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="sidebar-footer">
        <div className="sidebar-date-block">
          <div className="sidebar-date-label">Today</div>
          <div className="sidebar-date-value">{today}</div>
        </div>
      </div>
    </nav>
  );
}

function MobileNav({ active, onNav }) {
  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-nav-items">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}

const PAGE_META = {
  daily: { icon: '📅', title: 'Daily Check-in', subtitle: "Track today's habits. One habit at a time." },
  habits: { icon: '📋', title: 'Habits', subtitle: 'Manage your complete habit library.' },
  progress: { icon: '📊', title: 'Progress', subtitle: 'Visualize consistency over time.' },
  goals: { icon: '🏆', title: 'Goals', subtitle: 'Long-term targets powered by daily habits.' },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('habitos_auth') === 'true');
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [page, setPage] = useState('daily');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple password lock - change this to whatever you want
    if (passInput === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('habitos_auth', 'true');
    } else {
      setPassError(true);
      setPassInput('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <form className="auth-box notion-card" onSubmit={handleLogin}>
          <div className="auth-icon">🔒</div>
          <h2>HabitOS Is Locked</h2>
          <p>Please enter your access key.</p>
          <input
            type="password"
            className="notion-input"
            placeholder="Password..."
            value={passInput}
            onChange={e => { setPassInput(e.target.value); setPassError(false); }}
            autoFocus
          />
          {passError && <span className="auth-error">Incorrect password.</span>}
          <button type="submit" className="notion-btn notion-btn-primary" style={{ width: '100%' }}>Unlock</button>
        </form>
      </div>
    );
  }

  const meta = PAGE_META[page];

  return (
    <div className="app-shell">
      <Sidebar active={page} onNav={setPage} />

      <main className="main-content">
        <div className="page-header">
          <div className="page-title-row">
            <span className="page-icon">{meta.icon}</span>
            <h1 className="page-title">{meta.title}</h1>
          </div>
          <p className="page-subtitle">{meta.subtitle}</p>
        </div>

        <div className="page-body">
          {page === 'daily' && <DailyCheckin />}
          {page === 'habits' && <HabitManager />}
          {page === 'progress' && <Progress />}
          {page === 'goals' && <Goals />}
        </div>
      </main>

      <MobileNav active={page} onNav={setPage} />
    </div>
  );
}
