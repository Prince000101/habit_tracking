import './Progress.css';

// Mock stats for visual testing
const STATS = {
    activeHabits: 5,
    completedToday: 3,
    longestStreak: 12,
    completionRate: 78
};

const WEEKLY_DATA = [
    { day: 'Mo', rate: 100 },
    { day: 'Tu', rate: 80 },
    { day: 'We', rate: 60 },
    { day: 'Th', rate: 100 },
    { day: 'Fr', rate: 40 },
    { day: 'Sa', rate: 0 },
    { day: 'Su', rate: 0 }
];

export default function Progress() {
    return (
        <div className="progress-dashboard">
            <header className="progress-header">
                <div>
                    <h3>Your Progress</h3>
                    <p className="subtitle">Visualize your consistency and track overall performance.</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-accent">📝</div>
                    <div className="stat-info">
                        <span className="stat-value">{STATS.activeHabits}</span>
                        <span className="stat-label">Active Habits</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-success">✨</div>
                    <div className="stat-info">
                        <span className="stat-value">{STATS.completedToday}</span>
                        <span className="stat-label">Completed Today</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-warning">🔥</div>
                    <div className="stat-info">
                        <span className="stat-value">{STATS.longestStreak}</span>
                        <span className="stat-label">Longest Streak</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-primary">📈</div>
                    <div className="stat-info">
                        <span className="stat-value">{STATS.completionRate}%</span>
                        <span className="stat-label">Overall Completion</span>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card glass-panel">
                    <h4>Weekly Completion</h4>
                    <div className="bar-chart">
                        {WEEKLY_DATA.map((data, index) => (
                            <div key={index} className="bar-wrapper">
                                <div
                                    className="bar"
                                    style={{ height: `${data.rate}%`, opacity: data.rate / 100 || 0.1 }}
                                ></div>
                                <span className="bar-label">{data.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h4>Consistency Overview</h4>
                    <p className="chart-desc">
                        Your consistency is up <strong>12%</strong> compared to last week. You perform best on Mondays and Thursdays!
                    </p>
                    <div className="consistency-streak">
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={i}
                                className={`streak-dot ${Math.random() > 0.3 ? 'active' : ''}`}
                                title={`Day ${i + 1}`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
