import { useState, useEffect } from 'react';
import './DailyCheckin.css';

// Mock data until Supabase is fully wired
const MOCK_HABITS = [
    { id: 1, title: 'Drink 2L Water', completed: false, category: 'Health' },
    { id: 2, title: 'Read 20 pages', completed: true, category: 'Learning' },
    { id: 3, title: 'Exercise 30 mins', completed: false, category: 'Health' },
    { id: 4, title: 'Meditate', completed: true, category: 'Mindfulness' },
    { id: 5, title: 'Write Journal', completed: false, category: 'Mindfulness' }
];

export default function DailyCheckin() {
    const [habits, setHabits] = useState(MOCK_HABITS);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const completedCount = habits.filter(h => h.completed).length;
        setProgress(Math.round((completedCount / habits.length) * 100));
    }, [habits]);

    const toggleHabit = (id) => {
        setHabits(habits.map(h =>
            h.id === id ? { ...h, completed: !h.completed } : h
        ));
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="daily-checkin">
            <header className="checkin-header glass-panel">
                <div>
                    <h3>{today}</h3>
                    <p className="subtitle">You are {progress}% done for today. Keep going!</p>
                </div>
                <div className="progress-ring-container">
                    <svg className="progress-ring" width="60" height="60">
                        <circle className="progress-ring__circle bg" stroke="var(--border-color)" strokeWidth="4" fill="transparent" r="26" cx="30" cy="30" />
                        <circle
                            className="progress-ring__circle fg"
                            stroke="var(--accent-primary)"
                            strokeWidth="4"
                            fill="transparent"
                            r="26" cx="30" cy="30"
                            style={{ strokeDasharray: `${2 * Math.PI * 26}`, strokeDashoffset: `${2 * Math.PI * 26 * (1 - progress / 100)}` }}
                        />
                    </svg>
                    <span className="progress-text">{progress}%</span>
                </div>
            </header>

            <div className="habits-list">
                {habits.map(habit => (
                    <div
                        key={habit.id}
                        className={`habit-card glass-panel ${habit.completed ? 'completed' : ''}`}
                        onClick={() => toggleHabit(habit.id)}
                    >
                        <div className={`checkbox ${habit.completed ? 'checked' : ''}`}>
                            {habit.completed && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <div className="habit-info">
                            <span className="habit-title">{habit.title}</span>
                            <span className="habit-category">{habit.category}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
