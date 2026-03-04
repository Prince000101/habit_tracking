import { useState } from 'react';
import './HabitMaster.css';

const MOCK_MASTER_HABITS = [
    { id: 1, title: 'Drink 2L Water', category: 'Health', frequency: 'Daily', streak: 12 },
    { id: 2, title: 'Read 20 pages', category: 'Learning', frequency: 'Daily', streak: 5 },
    { id: 3, title: 'Exercise 30 mins', category: 'Health', frequency: 'Daily', streak: 8 },
];

export default function HabitMaster() {
    const [habits, setHabits] = useState(MOCK_MASTER_HABITS);

    return (
        <div className="habit-master">
            <header className="master-header">
                <div>
                    <h3>All Habits</h3>
                    <p className="subtitle">Manage your routines and track all-time statistics.</p>
                </div>
                <button className="btn-primary">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Habit
                </button>
            </header>

            <div className="table-container glass-panel">
                <table className="habit-table">
                    <thead>
                        <tr>
                            <th>Habit Name</th>
                            <th>Category</th>
                            <th>Frequency</th>
                            <th>Current Streak</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => (
                            <tr key={habit.id}>
                                <td className="font-medium text-primary">{habit.title}</td>
                                <td><span className="badge category-badge">{habit.category}</span></td>
                                <td>{habit.frequency}</td>
                                <td>
                                    <div className="streak-badge">
                                        <span>🔥</span> {habit.streak} days
                                    </div>
                                </td>
                                <td className="actions-cell">
                                    <button className="btn-icon" title="Edit">✏️</button>
                                    <button className="btn-icon danger" title="Delete">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
