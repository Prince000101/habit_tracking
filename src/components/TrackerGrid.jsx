import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Check, Plus, Trash2 } from 'lucide-react';
import './TrackerGrid.css';

export default function TrackerGrid() {
    const [habits, setHabits] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchMonthData(currentDate);
    }, [currentDate]);

    const fetchMonthData = async (date) => {
        try {
            setLoading(true);
            const start = startOfMonth(date).toISOString().split('T')[0];
            const end = endOfMonth(date).toISOString().split('T')[0];

            // Fetch habits
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .order('created_at', { ascending: true });
            if (habitsError) throw habitsError;

            // Fetch logs for the month
            const { data: logsData, error: logsError } = await supabase
                .from('habit_logs')
                .select('*')
                .gte('completed_date', start)
                .lte('completed_date', end);
            if (logsError) throw logsError;

            setHabits(habitsData || []);
            setLogs(logsData || []);
        } catch (error) {
            console.error('Error fetching tracker data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleHabit = async (habitId, dateStr) => {
        const existingLog = logs.find(l => l.habit_id === habitId && l.completed_date === dateStr);

        // Optimistic update
        if (existingLog) {
            setLogs(logs.filter(l => l.id !== existingLog.id));
            try {
                await supabase.from('habit_logs').delete().eq('id', existingLog.id);
            } catch (err) {
                console.error(err);
                fetchMonthData(currentDate); // revert
            }
        } else {
            const tempId = 'temp-' + Date.now();
            const newLog = { id: tempId, habit_id: habitId, completed_date: dateStr };
            setLogs([...logs, newLog]);
            try {
                const { data } = await supabase.from('habit_logs').insert([{ habit_id: habitId, completed_date: dateStr }]).select();
                if (data && data[0]) {
                    setLogs(prev => prev.map(l => l.id === tempId ? data[0] : l));
                }
            } catch (err) {
                console.error(err);
                fetchMonthData(currentDate); // revert
            }
        }
    };

    // --- Derived Data Calculations ---
    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    }, [currentDate]);

    const chartData = useMemo(() => {
        if (habits.length === 0) return [];
        return daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const completedCount = logs.filter(l => l.completed_date === dateStr).length;
            const percentage = Math.round((completedCount / habits.length) * 100);
            return {
                date: dateStr,
                dayLabel: format(day, 'd'),
                completed: completedCount,
                percentage: percentage
            };
        });
    }, [daysInMonth, logs, habits]);

    const totalLogsThisMonth = logs.length;
    const totalPossibleLogs = habits.length * daysInMonth.length;

    // Group days into weeks for header
    const weeksMap = new Map();
    daysInMonth.forEach(day => {
        const weekNum = format(day, 'w');
        if (!weeksMap.has(weekNum)) weeksMap.set(weekNum, []);
        weeksMap.get(weekNum).push(day);
    });

    if (loading && habits.length === 0) {
        return <div className="loading-state">Loading Tracker...</div>;
    }

    return (
        <div className="tracker-dashboard">
            {/* Header Section */}
            <header className="tracker-header glass-panel">
                <div className="month-selector">
                    <h2>{format(currentDate, 'MMMM').toUpperCase()}</h2>
                    <span className="year-label">{format(currentDate, 'yyyy')}</span>
                </div>

                <div className="summary-stats">
                    <div className="stat-box">
                        <span className="stat-label">Number of Habits</span>
                        <span className="stat-value">{habits.length}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">Completed Habits</span>
                        <span className="stat-value">{totalLogsThisMonth}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">Overall Progress</span>
                        <span className="stat-value">{totalPossibleLogs > 0 ? Math.round((totalLogsThisMonth / totalPossibleLogs) * 100) : 0}%</span>
                    </div>
                </div>
            </header>

            {/* Desktop Spreadsheet Grid */}
            <div className="spreadsheet-container glass-panel">
                <div className="grid-scroll-wrapper">
                    <table className="tracker-table">
                        <thead>
                            {/* Week Groups Row */}
                            <tr>
                                <th className="sticky-col header-corner">Habits</th>
                                {Array.from(weeksMap.entries()).map(([weekNum, days], i) => (
                                    <th key={`week-${weekNum}`} colSpan={days.length} className="week-header">
                                        Week {i + 1}
                                    </th>
                                ))}
                                <th className="analysis-header" colSpan={3}>Analysis</th>
                            </tr>
                            {/* Day Labels Row */}
                            <tr>
                                <th className="sticky-col sub-header">Focus Area</th>
                                {daysInMonth.map(day => (
                                    <th key={`dayname-${day}`} className="day-name header-cell">
                                        {format(day, 'EEEEEE')} {/* Mo, Tu, We */}
                                    </th>
                                ))}
                                <th className="analysis-sub">Goal</th>
                                <th className="analysis-sub">Actual</th>
                                <th className="analysis-sub progress-col">Progress</th>
                            </tr>
                            {/* Date Numbers Row */}
                            <tr>
                                <th className="sticky-col sub-header"></th>
                                {daysInMonth.map(day => (
                                    <th key={`datenumber-${day}`} className="date-number header-cell">
                                        {format(day, 'd')}
                                    </th>
                                ))}
                                <th className="analysis-sub"></th>
                                <th className="analysis-sub"></th>
                                <th className="analysis-sub"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {habits.map(habit => {
                                const habitLogs = logs.filter(l => l.habit_id === habit.id).length;
                                const goal = daysInMonth.length; // target is every day for now
                                const progressPct = Math.round((habitLogs / goal) * 100);

                                return (
                                    <tr key={habit.id}>
                                        <td className="sticky-col habit-name-cell">
                                            <span className="habit-title">{habit.title}</span>
                                            <span className="habit-cat">{habit.category}</span>
                                        </td>

                                        {daysInMonth.map(day => {
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            const isDone = logs.some(l => l.habit_id === habit.id && l.completed_date === dateStr);

                                            // Optional: highlight current day
                                            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                                            return (
                                                <td key={`${habit.id}-${dateStr}`} className={`checkbox-cell ${isToday ? 'is-today' : ''}`}>
                                                    <div
                                                        className={`grid-checkbox ${isDone ? 'checked' : ''}`}
                                                        onClick={() => toggleHabit(habit.id, dateStr)}
                                                    >
                                                        {isDone && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Analysis Columns */}
                                        <td className="analysis-cell text-center">{goal}</td>
                                        <td className="analysis-cell text-center">{habitLogs}</td>
                                        <td className="analysis-cell">
                                            <div className="mini-progress-bar">
                                                <div className="mini-progress-fill" style={{ width: `${progressPct}%` }}></div>
                                                <span className="mini-progress-text">{progressPct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>

                        {/* Summary Footer */}
                        <tfoot>
                            <tr className="summary-row spacing-row">
                                <td className="sticky-col">Percentage</td>
                                {chartData.map((d, i) => (
                                    <td key={`pct-${i}`} className="text-center pct-text">{d.percentage}%</td>
                                ))}
                                <td colSpan={3}></td>
                            </tr>
                            <tr className="summary-row">
                                <td className="sticky-col">Completed</td>
                                {chartData.map((d, i) => (
                                    <td key={`done-${i}`} className="text-center count-text">{d.completed}</td>
                                ))}
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Bottom Chart Visualization */}
            <div className="chart-section glass-panel">
                <h4 className="chart-title">Consistency Area Chart</h4>
                <div className="area-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="dayLabel"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(15, 17, 21, 0.9)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--accent-success)' }}
                                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                                formatter={(value) => [`${value}%`, 'Completed']}
                                labelFormatter={(label) => `Day ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="percentage"
                                stroke="var(--accent-success)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorPct)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Mobile View Disclaimer & Daily List */}
            <div className="mobile-fallback-view">
                <div className="mobile-today-header">
                    <h3>Today's Focus</h3>
                    <p className="subtitle">{format(new Date(), 'EEEE, MMMM do')}</p>
                </div>

                <div className="mobile-habits-list">
                    {habits.map(habit => {
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        const isDone = logs.some(l => l.habit_id === habit.id && l.completed_date === todayStr);

                        return (
                            <div
                                key={`mobile-habit-${habit.id}`}
                                className={`mobile-habit-card glass-panel ${isDone ? 'completed' : ''}`}
                                onClick={() => toggleHabit(habit.id, todayStr)}
                            >
                                <div className={`grid-checkbox ${isDone ? 'checked' : ''}`}>
                                    {isDone && <Check size={16} strokeWidth={3} />}
                                </div>
                                <div className="mobile-habit-info">
                                    <span className="mobile-habit-title">{habit.title}</span>
                                    <span className="mobile-habit-cat">{habit.category}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mobile-rotate-hint glass-panel text-center">
                    <p>Rotate device to landscape to view the full monthly spreadsheet matrix.</p>
                </div>
            </div>
        </div>
    );
}
