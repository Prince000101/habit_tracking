import './Goals.css';

const MOCK_GOALS = [
    { id: 1, title: 'Read 24 Books this Year', target: 24, current: 8, unit: 'books', color: 'var(--accent-primary)' },
    { id: 2, title: 'Run a Half Marathon', target: 21, current: 15, unit: 'km', color: 'var(--accent-success)' },
    { id: 3, title: 'Save $5000', target: 5000, current: 2300, unit: '$', color: 'var(--accent-warning)' },
];

export default function Goals() {
    return (
        <div className="goals-dashboard">
            <header className="goals-header">
                <div>
                    <h3>Long-term Goals</h3>
                    <p className="subtitle">Connect your daily habits to your macro objectives.</p>
                </div>
                <button className="btn-primary">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Goal
                </button>
            </header>

            <div className="goals-grid">
                {MOCK_GOALS.map(goal => {
                    const percentage = Math.round((goal.current / goal.target) * 100);
                    return (
                        <div key={goal.id} className="goal-card glass-panel">
                            <div className="goal-header">
                                <h4>{goal.title}</h4>
                                <div className="goal-badge" style={{ backgroundColor: `${goal.color}33`, color: goal.color }}>
                                    {percentage}%
                                </div>
                            </div>

                            <div className="goal-progress-wrapper">
                                <div className="goal-progress-bg">
                                    <div
                                        className="goal-progress-fill"
                                        style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                                    ></div>
                                </div>
                                <div className="goal-stats">
                                    <span>{goal.current} {goal.unit}</span>
                                    <span>{goal.target} {goal.unit}</span>
                                </div>
                            </div>

                            <div className="linked-habits">
                                <span className="linked-label">Linked Habits:</span>
                                <div className="linked-tags">
                                    <span className="habit-tag">Daily Habit 1</span>
                                    <span className="habit-tag">Daily Habit 2</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
