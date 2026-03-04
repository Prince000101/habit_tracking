import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './DailyCheckin.css';

export default function DailyCheckin() {
    const [habits, setHabits] = useState([]);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    useEffect(() => {
        fetchDailyHabits();
    }, []);

    const fetchDailyHabits = async () => {
        try {
            setLoading(true);

            // 1. Fetch all active habits
            const { data: allHabits, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .order('created_at', { ascending: true });

            if (habitsError) throw habitsError;

            // 2. Fetch today's logs
            const { data: todayLogs, error: logsError } = await supabase
                .from('habit_logs')
                .select('habit_id')
                .eq('completed_date', todayStr);

            if (logsError) throw logsError;

            const completedHabitIds = new Set(todayLogs.map(l => l.habit_id));

            // 3. Merge status
            const mergedHabits = (allHabits || []).map(h => ({
                ...h,
                completed: completedHabitIds.has(h.id)
            }));

            setHabits(mergedHabits);
            calculateProgress(mergedHabits);
        } catch (error) {
            console.error('Error fetching today habits:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (habitList) => {
        if (habitList.length === 0) {
            setProgress(0);
            return;
        }
        const completedCount = habitList.filter(h => h.completed).length;
        setProgress(Math.round((completedCount / habitList.length) * 100));
    };

    const toggleHabit = async (habitId, currentStatus) => {
        // Optimistic UI update
        const updatedHabits = habits.map(h =>
            h.id === habitId ? { ...h, completed: !currentStatus } : h
        );
        setHabits(updatedHabits);
        calculateProgress(updatedHabits);

        try {
            if (!currentStatus) {
                // Mark as completed
                await supabase.from('habit_logs').insert([
                    { habit_id: habitId, completed_date: todayStr }
                ]);
            } else {
                // Mark as incomplete
                await supabase.from('habit_logs')
                    .delete()
                    .match({ habit_id: habitId, completed_date: todayStr });
            }
        } catch (error) {
            console.error('Error toggling habit:', error.message);
            // Revert on error
            fetchDailyHabits();
        }
    };

    const displayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="daily-checkin">
            <header className="checkin-header glass-panel">
                <div>
                    <h3>{displayDate}</h3>
                    <p className="subtitle">
                        {habits.length === 0 ? "No active habits found." : `You are ${progress}% done for today. Keep going!`}
                    </p>
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
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading your day...</div>
                ) : habits.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        Nothing to do today! Head over to the Habit Master to add some routines.
                    </div>
                ) : (
                    habits.map(habit => (
                        <div
                            key={habit.id}
                            className={`habit-card glass-panel ${habit.completed ? 'completed' : ''}`}
                            onClick={() => toggleHabit(habit.id, habit.completed)}
                        >
                            <div className={`checkbox ${habit.completed ? 'checked' : ''}`}>
                                {habit.completed && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <div className="habit-info">
                                <span className="habit-title">{habit.title}</span>
                                <span className="habit-category">{habit.category}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
