import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Check, Flame, Plus, Loader } from 'lucide-react';
import './DailyCheckin.css';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function CompletionRing({ pct }) {
    const r = 54;
    const c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" className="completion-ring">
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
                cx="70" cy="70" r={r} fill="none"
                stroke={pct === 100 ? '#2ecc71' : '#4f6bed'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={offset}
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [{ data: h }, { data: logs }] = await Promise.all([
                supabase.from('habits').select('*').order('created_at', { ascending: true }),
                supabase.from('habit_logs').select('habit_id, completed_date').order('completed_date', { ascending: false }),
            ]);

            const habitsArr = h || [];
            setHabits(habitsArr);

            // Build today's completed set
            const todaySet = new Set((logs || [])
                .filter(l => l.completed_date === TODAY)
                .map(l => l.habit_id));
            setCompletedIds(todaySet);

            // Calculate streaks
            const allLogs = logs || [];
            const streakMap = {};
            for (const habit of habitsArr) {
                const habitDates = [...new Set(allLogs
                    .filter(l => l.habit_id === habit.id)
                    .map(l => l.completed_date)
                )].sort().reverse();

                let streak = 0;
                let check = TODAY;
                for (const d of habitDates) {
                    if (d === check) {
                        streak++;
                        const prev = new Date(check);
                        prev.setDate(prev.getDate() - 1);
                        check = format(prev, 'yyyy-MM-dd');
                    } else {
                        break;
                    }
                }
                streakMap[habit.id] = streak;
            }
            setStreaks(streakMap);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggle = async (habitId) => {
        const isDone = completedIds.has(habitId);
        // Optimistic
        setCompletedIds(prev => {
            const next = new Set(prev);
            isDone ? next.delete(habitId) : next.add(habitId);
            return next;
        });

        if (isDone) {
            await supabase.from('habit_logs').delete()
                .eq('habit_id', habitId).eq('completed_date', TODAY);
        } else {
            await supabase.from('habit_logs').insert({ habit_id: habitId, completed_date: TODAY });
        }
    };

    const addHabit = async () => {
        if (!newTitle.trim()) return;
        setSaving(true);
        const { data } = await supabase.from('habits').insert({
            title: newTitle.trim(),
            category: newCategory,
        }).select().single();
        if (data) setHabits(prev => [...prev, data]);
        setNewTitle('');
        setShowAdd(false);
        setSaving(false);
    };

    const pct = habits.length ? Math.round((completedIds.size / habits.length) * 100) : 0;
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

    if (loading) return <div className="loading-spinner"><Loader size={18} className="spin" />Loading your habits...</div>;

    return (
        <div className="daily-page animate-in">
            {/* Summary header */}
            <div className="daily-summary">
                <div className="daily-greeting">
                    <h2>{greeting} 👋</h2>
                    <p className="daily-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                    <div className="daily-meta">
                        <span className="tag tag-blue">{completedIds.size}/{habits.length} done today</span>
                        {pct === 100 && <span className="tag tag-green">🎉 Perfect day!</span>}
                    </div>
                </div>
                <CompletionRing pct={pct} />
            </div>

            {/* Progress bar */}
            <div className="daily-progress-bar-row">
                <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#2ecc71' : '#4f6bed' }} />
                </div>
                <span className="daily-pct-label">{pct}%</span>
            </div>

            {/* Habit list */}
            <div className="habit-list">
                {habits.map((habit, i) => {
                    const done = completedIds.has(habit.id);
                    const streak = streaks[habit.id] || 0;
                    return (
                        <div
                            key={habit.id}
                            className={`habit-row ${done ? 'done' : ''}`}
                            style={{ animationDelay: `${i * 40}ms` }}
                            onClick={() => toggle(habit.id)}
                        >
                            <div className={`habit-checkbox ${done ? 'checked' : ''}`}>
                                {done && <Check size={13} strokeWidth={3} />}
                            </div>
                            <div className="habit-info">
                                <span className="habit-title">{habit.title}</span>
                                <span className={`tag tag-${categoryColor(habit.category)}`}>{habit.category}</span>
                            </div>
                            {streak > 0 && (
                                <div className="streak-badge" data-tooltip={`${streak}-day streak!`}>
                                    <Flame size={13} />
                                    <span>{streak}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add habit inline */}
                {showAdd ? (
                    <div className="habit-add-form">
                        <input
                            className="notion-input"
                            placeholder="Habit name (e.g. Meditate 10 mins)"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addHabit(); if (e.key === 'Escape') setShowAdd(false); }}
                            autoFocus
                        />
                        <select className="notion-select" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: 'auto' }}>
                            {['Health', 'Fitness', 'Mindfulness', 'Learning', 'Productivity', 'Social', 'Finance', 'Other'].map(c =>
                                <option key={c}>{c}</option>
                            )}
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button className="notion-btn notion-btn-primary" onClick={addHabit} disabled={saving}>
                                {saving ? <Loader size={14} className="spin" /> : null} Add
                            </button>
                            <button className="notion-btn notion-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button className="habit-add-btn" onClick={() => setShowAdd(true)}>
                        <Plus size={16} />
                        Add a habit
                    </button>
                )}
            </div>

            {habits.length === 0 && !showAdd && (
                <div className="empty-state">
                    <div className="empty-state-icon">✨</div>
                    <div className="empty-state-title">Your habit list is empty</div>
                    <div className="empty-state-sub">Click "Add a habit" above to start building your routine.</div>
                </div>
            )}
        </div>
    );
}

function categoryColor(cat) {
    const map = { Health: 'green', Fitness: 'orange', Mindfulness: 'purple', Learning: 'blue', Productivity: 'blue', Social: 'yellow', Finance: 'green', Other: '' };
    return map[cat] || 'blue';
}
