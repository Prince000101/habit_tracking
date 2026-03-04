import { useState } from 'react';
import DailyCheckin from './components/DailyCheckin';
import HabitMaster from './components/HabitMaster';
import Progress from './components/Progress';
import Goals from './components/Goals';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('daily');

  const navigation = [
    { id: 'daily', label: 'Daily Check-in', icon: '✨' },
    { id: 'habits', label: 'Habit Master', icon: '📝' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand-title">
            <span>●</span> Habits
          </h1>
        </div>

        <div className="nav-links">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>

        <div className="content-wrapper">
          <header className="page-header">
            <h2 className="page-title">
              {navigation.find(n => n.id === activeTab)?.label}
            </h2>
            <p className="page-subtitle">
              {activeTab === 'daily' && "Here's your focus for today. Let's build consistency."}
              {activeTab === 'habits' && "Manage and edit your master list of habits."}
              {activeTab === 'progress' && "Visualize your consistency over time."}
              {activeTab === 'goals' && "Connect daily actions to long-term success."}
            </p>
          </header>

          {activeTab === 'daily' ? (
            <DailyCheckin />
          ) : activeTab === 'habits' ? (
            <HabitMaster />
          ) : activeTab === 'progress' ? (
            <Progress />
          ) : activeTab === 'goals' ? (
            <Goals />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
