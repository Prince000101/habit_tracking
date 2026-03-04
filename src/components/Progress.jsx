import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Loader, TrendingUp } from 'lucide-react';
import './Progress.css';

const MONTHS_BACK = 3;

export default function Progress() {
    const [habits, setHabits] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const start = format(startOfMonth(subMonths(new Date(), MONTHS_BACK)), 'yyyy-MM-dd');
        const [{ data: h }, { data: l }] = await Promise.all([
            supabase.from('habits').select('*').order('created_at'),
            supabase.from('habit_logs').select('habit_id, completed_date').gte('completed_date', start),
        ]);
        setHabits(h || []);
        setLogs(l || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build daily chart data for the current month
    const currentMonth = new Date();
    const daysList = useMemo(() => eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    }), []);

    const chartData = useMemo(() => {
        if (!habits.length) return [];
        return daysList.map(day => {
            const ds = format(day, 'yyyy-MM-dd');
            const done = logs.filter(l => l.completed_date === ds).length;
            const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
            return { label: format(day, 'd'), date: ds, done, pct };
        });
    }, [daysList, logs, habits]);

    // Per-habit stats
    const habitStats = useMemo(() => habits.map(h => {
        const hLogs = logs.filter(l => l.habit_id === h.id);
        const total = hLogs.length;
        const daysInPeriod = MONTHS_BACK * 30;
        const rate = Math.round((total / daysInPeriod) * 100);

        // streak
        const dates = [...new Set(hLogs.map(l => l.completed_date))].sort().reverse();
        let streak = 0;
        const today = format(new Date(), 'yyyy-MM-dd');
        let check = today;
        for (const d of dates) {
            if (d === check) {
                streak++;
                const prev = new Date(check);
                prev.setDate(prev.getDate() - 1);
                check = format(prev, 'yyyy-MM-dd');
            } else break;
        }

        let best = 0, run = 0, last = '';
        for (const d of [...dates].reverse()) {
            if (!last) { run = 1; last = d; }
            else {
                const expected = new Date(last);
                expected.setDate(expected.getDate() + 1);
                if (d === format(expected, 'yyyy-MM-dd')) run++;
                else run = 1;
            }
            last = d;
            if (run > best) best = run;
        }

        return { ...h, total, rate: Math.min(rate, 100), streak, best };
    }), [habits, logs]);

    // Today's global pct
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayDone = logs.filter(l => l.completed_date === todayStr).length;
    const todayPct = habits.length ? Math.round((todayDone / habits.length) * 100) : 0;

    // Heatmap: last 90 days
    const heatmapDays = useMemo(() => {
        const end = new Date();
        const start = new Date(); start.setDate(start.getDate() - 89);
        return eachDayOfInterval({ start, end }).map(day => {
            const ds = format(day, 'yyyy-MM-dd');
            const done = logs.filter(l => l.completed_date === ds).length;
            const level = habits.length ? Math.round((done / habits.length) * 4) : 0;
            return { ds, day: format(day, 'd'), level };
        });
    }, [logs, habits]);

    if (loading) return <div className="loading-spinner"><Loader size={18} className="spin" /> Loading progress...</div>;

    return (
        <div className="progress-page animate-in">
            {/* Summary cards */}
            <div className="prog-summary-row">
                <div className="prog-summary-card notion-card">
                    <div className="prog-sc-icon" style={{ background: 'rgba(79,107,237,0.12)', color: '#7c9ef8' }}>📅</div>
                    <div className="prog-sc-value">{todayPct}%</div>
                    <div className="prog-sc-label">Today's completion</div>
                    <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                        <div className="progress-fill" style={{ width: `${todayPct}%` }} />
                    </div>
                </div>
                <div className="prog-summary-card notion-card">
                    <div className="prog-sc-icon" style={{ background: 'rgba(46,204,113,0.12)', color: '#4ade80' }}>✅</div>
                    <div className="prog-sc-value">{logs.filter(l => l.completed_date === todayStr).length}</div>
                    <div className="prog-sc-label">Done today</div>
                </div>
                <div className="prog-summary-card notion-card">
                    <div className="prog-sc-icon" style={{ background: 'rgba(246,113,34,0.12)', color: '#fb923c' }}>🔥</div>
                    <div className="prog-sc-value">{Math.max(...habitStats.map(h => h.streak), 0)}</div>
                    <div className="prog-sc-label">Best active streak</div>
                </div>
                <div className="prog-summary-card notion-card">
                    <div className="prog-sc-icon" style={{ background: 'rgba(155,89,208,0.12)', color: '#c084fc' }}>📊</div>
                    <div className="prog-sc-value">{logs.length}</div>
                    <div className="prog-sc-label">Total completions</div>
                </div>
            </div>

            {/* Area Chart */}
            <div className="prog-section notion-card">
                <div className="prog-section-header">
                    <TrendingUp size={16} />
                    <h3>{format(currentMonth, 'MMMM yyyy')} — Daily Completion %</h3>
                </div>
                <div className="prog-chart-area">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f6bed" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#4f6bed" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#252525', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px' }}
                                formatter={(v) => [`${v}%`, 'Completed']}
                                labelFormatter={(l) => `Day ${l}`}
                            />
                            <Area type="monotone" dataKey="pct" stroke="#4f6bed" strokeWidth={2.5} fill="url(#grad1)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Heatmap */}
            <div className="prog-section notion-card">
                <div className="prog-section-header">
                    <span>🗓️</span>
                    <h3>Last 90 Days — Activity Heatmap</h3>
                </div>
                <div className="heatmap-grid">
                    {heatmapDays.map(d => (
                        <div key={d.ds} className={`heatmap-cell level-${d.level}`} data-tooltip={`${d.ds}: ${d.level === 0 ? 'No habits' : `Level ${d.level}`}`} />
                    ))}
                </div>
                <div className="heatmap-legend">
                    <span>Less</span>
                    {[0, 1, 2, 3, 4].map(l => <div key={l} className={`heatmap-cell level-${l}`} />)}
                    <span>More</span>
                </div>
            </div>

            {/* Per-habit breakdown */}
            <div className="prog-section notion-card">
                <div className="prog-section-header">
                    <span>📝</span>
                    <h3>Habit Breakdown — Last {MONTHS_BACK} Months</h3>
                </div>
                <div className="habit-breakdown-list">
                    {habitStats.map(h => (
                        <div key={h.id} className="hb-row">
                            <div className="hb-meta">
                                <span className="hb-title">{h.title}</span>
                                <div className="hb-stats">
                                    <span>{h.total} days done</span>
                                    {h.streak > 0 && <span className="streak-badge"><Flame size={12} />{h.streak} day streak</span>}
                                    {h.best > h.streak && <span className="tag tag-purple">Best: {h.best} days</span>}
                                </div>
                            </div>
                            <div className="hb-bar-col">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${h.rate}%`, background: h.rate >= 80 ? '#2ecc71' : h.rate >= 50 ? '#4f6bed' : '#e67e22' }} />
                                </div>
                                <span className="hb-rate">{h.rate}%</span>
                            </div>
                        </div>
                    ))}
                    {habits.length === 0 && <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No habit data yet</div></div>}
                </div>
            </div>
        </div>
    );
}
