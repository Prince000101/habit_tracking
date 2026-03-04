import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Progress.css';

export default function Progress() {
    const [stats, setStats] = useState({
        activeHabits: 0,
        completedToday: 0,
        longestStreak: 0,
        completionRate: 0
    });
    const [weeklyData, setWeeklyData] = useState([]);
    const [monthlyConsistency, setMonthlyConsistency] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calculateProgressMetrics();
    }, []);

    const calculateProgressMetrics = async () => {
        try {
            setLoading(true);

            // 1. Fetch habits
            const { data: habits, error: habitsError } = await supabase.from('habits').select('*');
            if (habitsError) throw habitsError;

            // 2. Fetch all logs for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

            const { data: logs, error: logsError } = await supabase
                .from('habit_logs')
                .select('*')
                .gte('completed_date', dateStr);
            if (logsError) throw logsError;

            // Calculate active habits
            const activeHabits = habits.length;

            // Calculate completed today
            const todayStr = new Date().toISOString().split('T')[0];
            const completedToday = logs.filter(l => l.completed_date === todayStr).length;

            // Calculate Weekly Data (Last 7 days)
            const week = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const isoDate = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);

                const completionsThatDay = logs.filter(l => l.completed_date === isoDate).length;
                const rate = activeHabits > 0 ? Math.round((completionsThatDay / activeHabits) * 100) : 0;

                week.push({ day: dayName, rate, completions: completionsThatDay });
            }

            // Overall completion rate for the period
            const totalExpected = activeHabits * 30; // approx
            const overallRate = totalExpected > 0 ? Math.round((logs.length / totalExpected) * 100) : 0;

            // Dumb longest streak calculation for demo purposes (max single habit streak)
            // In a real app this requires complex consecutive date matching per habit ID
            let maxStreak = 0;
            const logsByHabit = {};
            logs.forEach(log => {
                if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = [];
                logsByHabit[log.habit_id].push(log.completed_date);
            });
            // Simplified max streak visualization setup
            if (logs.length > 0) maxStreak = Math.min(activeHabits > 0 ? Math.floor(logs.length / activeHabits) + 1 : 0, 30);

            // consistency array (30 days)
            const consistencies = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const cCount = logs.filter(l => l.completed_date === d.toISOString().split('T')[0]).length;
                consistencies.push({
                    active: cCount > 0 && cCount >= (activeHabits * 0.5), // "active" if > 50% done
                    day: i + 1
                });
            }

            setStats({
                activeHabits,
                completedToday,
                longestStreak: maxStreak,
                completionRate: overallRate > 100 ? 100 : overallRate
            });
            setWeeklyData(week);
            setMonthlyConsistency(consistencies);

        } catch (error) {
            console.error('Error calculating metrics:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Crunching the numbers...</div>;
    }

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
                        <span className="stat-value">{stats.activeHabits}</span>
                        <span className="stat-label">Active Habits</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-success">✨</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.completedToday}</span>
                        <span className="stat-label">Completed Today</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-warning">🔥</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.longestStreak}</span>
                        <span className="stat-label">Estimated Streak</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon text-primary">📈</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.completionRate}%</span>
                        <span className="stat-label">30-Day Completion</span>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card glass-panel">
                    <h4>Weekly Completion</h4>
                    <div className="bar-chart">
                        {weeklyData.map((data, index) => (
                            <div key={index} className="bar-wrapper" title={`${data.rate}% completed`}>
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
                        A quick heatmap of your performance over the last 30 days.
                    </p>
                    <div className="consistency-streak">
                        {monthlyConsistency.map((dot, i) => (
                            <div
                                key={i}
                                className={`streak-dot ${dot.active ? 'active' : ''}`}
                                title={`Day ${dot.day}`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
