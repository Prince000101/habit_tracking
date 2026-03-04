import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Check, Flame, Plus, Loader, X } from 'lucide-react';
import './DailyCheckin.css';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const CATEGORIES = ['Health', 'Fitness', 'Mindfulness', 'Learning', 'Productivity', 'Social', 'Finance', 'Other'];
const CAT_COLOR = { Health: 'green', Fitness: 'orange', Mindfulness: 'purple', Learning: 'blue', Productivity: 'blue', Social: 'yellow', Finance: 'green', Other: 'blue' };

function CompletionRing({ pct }) {
    const r = 54, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return (
        <svg width="140" height="140" viewBox="0 0 140 140" className="completion-ring">
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="70" cy="70" r={r} fill="none"
                stroke={pct === 100 ? '#2ecc71' : '#4f6bed'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={offset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text x="70" y="68" textAnchor="middle" fill="#e8e8e5" fontSize="22" fontWeight="800" fontFamily="Inter,sans-serif">{pct}%</text>
            <text x="70" y="86" textAnchor="middle" fill="#9b9a97" fontSize="11" fontFamily="Inter,sans-serif">complete</text>
        </svg>
    );
}

export default function DailyCheckin() {
    const [habits, setHabits] = useState([]);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [streaks, setStreaks] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('Health');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [{ data: h, error: hErr }, { data: logs, error: lErr }] = await Promise.all([
                supabase.from('habits').select('*').order('created_at', { ascending: true }),
                supabase.from('habit_logs').select('habit_id, completed_date').order('completed_date', { ascending: false }),
            ]);

            if (hErr) throw hErr;
            if (lErr) throw lErr;

            const habitsArr = h || [];
            setHabits(habitsArr);

            const todaySet = new Set((logs || [])
                .filter(l => l.completed_date === TODAY)
                .map(l => l.habit_id));
            setCompletedIds(todaySet);

            const allLogs = logs || [];
            const streakMap = {};
            for (const habit of habitsArr) {
                const dates = [...new Set(allLogs
                    .filter(l => l.habit_id === habit.id)
                    .map(l => l.completed_date)
                )].sort().reverse();
                let streak = 0, check = TODAY;
                for (const d of dates) {
                    if (d === check) {
                        streak++;
                        const prev = new Date(check);
                        prev.setDate(prev.getDate() - 1);
                        check = format(prev, 'yyyy-MM-dd');
                    } else break;
                }
                streakMap[habit.id] = streak;
            }
            setStreaks(streakMap);
        } catch (err) {
            setError('Failed to load habits. Check your Supabase connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggle = async (habitId) => {
        const isDone = completedIds.has(habitId);
        setCompletedIds(prev => {
            const next = new Set(prev);
            isDone ? next.delete(habitId) : next.add(habitId);
            return next;
        });
        try {
            if (isDone) {
                const { error } = await supabase.from('habit_logs').delete()
                    .eq('habit_id', habitId).eq('completed_date', TODAY);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('habit_logs')
                    .insert({ habit_id: habitId, completed_date: TODAY });
                if (error) throw error;
            }
        } catch (err) {
            console.error('Toggle error:', err.message);
            fetchData(); // revert on error
        }
    };

    const addHabit = async () => {
        if (!newTitle.trim()) return;
        setSaving(true);
        setError('');
        try {
            const { data, error } = await supabase.from('habits').insert({
                title: newTitle.trim(),
                category: newCategory,
                frequency: 'Daily',   // required NOT NULL field
            }).select().single();

            if (error) throw error;
            if (data) {
                setHabits(prev => [...prev, data]);
                setStreaks(prev => ({ ...prev, [data.id]: 0 }));
            }
            setNewTitle('');
            setShowAdd(false);
        } catch (err) {
            setError(`Could not create habit: ${err.message}`);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const deleteHabit = async (habitId, e) => {
        e.stopPropagation(); // don't toggle when clicking delete
        try {
            // habit_logs cascade deletes automatically due to ON DELETE CASCADE
            const { error } = await supabase.from('habits').delete().eq('id', habitId);
            if (error) throw error;
            setHabits(prev => prev.filter(h => h.id !== habitId));
            setCompletedIds(prev => { const s = new Set(prev); s.delete(habitId); return s; });
        } catch (err) {
            setError(`Delete failed: ${err.message}`);
        }
    };

    const pct = habits.length ? Math.round((completedIds.size / habits.length) * 100) : 0;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    if (loading) return <div className="loading-spinner"><Loader size={18} className="spin" /> Loading your habits...</div>;

    return (
        <div className="daily-page animate-in">
            {error && (
                <div className="error-banner">
                    ⚠️ {error}
                    <button onClick={() => setError('')}><X size={14} /></button>
                </div>
            )}

            {/* Top section: greeting + ring */}
            <div className="daily-top-grid">
                <div className="daily-summary notion-card">
                    <div className="daily-greeting">
                        <h2>{greeting} 👋</h2>
                        <p className="daily-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                        <div className="daily-meta">
                            <span className="tag tag-blue">{completedIds.size}/{habits.length} done today</span>
                            {pct === 100 && <span className="tag tag-green">🎉 Perfect day!</span>}
                        </div>
                        {/* Progress bar */}
                        <div className="daily-progress-bar-row">
                            <div className="progress-bar" style={{ flex: 1 }}>
                                <div className="progress-fill" style={{
                                    width: `${pct}%`,
                                    background: pct === 100 ? '#2ecc71' : '#4f6bed'
                                }} />
                            </div>
                            <span className="daily-pct-label">{pct}%</span>
                        </div>
                    </div>
                    <CompletionRing pct={pct} />
                </div>

                {/* Quick stats */}
                <div className="daily-quick-stats">
                    <div className="qs-card notion-card">
                        <span className="qs-icon">✅</span>
                        <span className="qs-value">{completedIds.size}</span>
                        <span className="qs-label">Done</span>
                    </div>
                    <div className="qs-card notion-card">
                        <span className="qs-icon">⏳</span>
                        <span className="qs-value">{habits.length - completedIds.size}</span>
                        <span className="qs-label">Left</span>
                    </div>
                    <div className="qs-card notion-card">
                        <span className="qs-icon">🔥</span>
                        <span className="qs-value">{Math.max(...Object.values(streaks), 0)}</span>
                        <span className="qs-label">Best Streak</span>
                    </div>
                    <div className="qs-card notion-card">
                        <span className="qs-icon">📋</span>
                        <span className="qs-value">{habits.length}</span>
                        <span className="qs-label">Habits</span>
                    </div>
                </div>
            </div>

            {/* Habit list */}
            <div className="habit-list-section">
                <div className="habit-list-header">
                    <h3>Today's Habits</h3>
                    <button className="notion-btn notion-btn-primary" onClick={() => setShowAdd(true)}>
                        <Plus size={15} /> Add Habit
                    </button>
                </div>

                <div className="habit-list notion-card">
                    {habits.map((habit, i) => {
                        const done = completedIds.has(habit.id);
                        const streak = streaks[habit.id] || 0;
                        const col = CAT_COLOR[habit.category] || 'blue';
                        return (
                            <div
                                key={habit.id}
                                className={`habit-row ${done ? 'done' : ''}`}
                                style={{ animationDelay: `${i * 35}ms` }}
                                onClick={() => toggle(habit.id)}
                            >
                                <div className={`habit-checkbox ${done ? 'checked' : ''}`}>
                                    {done && <Check size={13} strokeWidth={3} />}
                                </div>
                                <div className="habit-info">
                                    <span className="habit-title">{habit.title}</span>
                                    <span className={`tag tag-${col}`}>{habit.category}</span>
                                </div>
                                {streak > 0 && (
                                    <div className="streak-badge">
                                        <Flame size={13} /><span>{streak}</span>
                                    </div>
                                )}
                                <button className="habit-delete-btn" onClick={(e) => deleteHabit(habit.id, e)} title="Delete habit">
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Add form */}
                    {showAdd && (
                        <div className="habit-add-form" onClick={e => e.stopPropagation()}>
                            <input
                                className="notion-input"
                                placeholder="Habit name (e.g. Meditate 10 mins)"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') addHabit();
                                    if (e.key === 'Escape') setShowAdd(false);
                                }}
                                autoFocus
                            />
                            <select className="notion-select" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: 'auto' }}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button className="notion-btn notion-btn-primary" onClick={addHabit} disabled={saving || !newTitle.trim()}>
                                    {saving ? <Loader size={14} className="spin" /> : <Plus size={14} />} Add
                                </button>
                                <button className="notion-btn notion-btn-ghost" onClick={() => { setShowAdd(false); setNewTitle(''); }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {!showAdd && habits.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">✨</div>
                            <div className="empty-state-title">No habits yet</div>
                            <div className="empty-state-sub">Click "Add Habit" above to start building your routine.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
