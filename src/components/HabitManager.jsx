import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Trash2, Plus, X, Loader, Flame } from 'lucide-react';
import { format } from 'date-fns';
import './HabitManager.css';

const CATEGORIES = ['Health', 'Fitness', 'Mindfulness', 'Learning', 'Productivity', 'Social', 'Finance', 'Other'];
const CATEGORY_COLORS = { Health: 'green', Fitness: 'orange', Mindfulness: 'purple', Learning: 'blue', Productivity: 'blue', Social: 'yellow', Finance: 'green', Other: 'blue' };

function HabitModal({ habit, onSave, onClose }) {
    const [title, setTitle] = useState(habit?.title || '');
    const [category, setCategory] = useState(habit?.category || 'Health');
    const [note, setNote] = useState(habit?.note || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!title.trim()) return;
        setSaving(true);
        // Include frequency (required NOT NULL field in schema)
        const payload = { title: title.trim(), category, note: note || '', frequency: 'Daily' };
        let data, err;
        if (habit) {
            const res = await supabase.from('habits').update(payload).eq('id', habit.id).select().single();
            data = res.data; err = res.error;
        } else {
            const res = await supabase.from('habits').insert(payload).select().single();
            data = res.data; err = res.error;
        }
        setSaving(false);
        if (err) { alert('Error saving habit: ' + err.message); return; }
        onSave(data, !!habit);
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-close-row">
                    <h2 className="modal-title">{habit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="form-group">
                    <label className="form-label">Habit Name</label>
                    <input className="notion-input" placeholder="e.g. Read for 30 minutes" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
                </div>
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="notion-select" value={category} onChange={e => setCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Notes (optional)</label>
                    <input className="notion-input" placeholder="Why does this habit matter?" value={note} onChange={e => setNote(e.target.value)} />
                </div>
                <div className="modal-actions">
                    <button className="notion-btn notion-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="notion-btn notion-btn-primary" onClick={save} disabled={saving || !title.trim()}>
                        {saving ? <Loader size={14} className="spin" /> : null} {habit ? 'Save Changes' : 'Create Habit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function HabitManager() {
    const [habits, setHabits] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'new' | {habit}
    const [deleting, setDeleting] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [{ data: h }, { data: l }] = await Promise.all([
            supabase.from('habits').select('*').order('created_at', { ascending: true }),
            supabase.from('habit_logs').select('habit_id, completed_date'),
        ]);
        setHabits(h || []);
        setLogs(l || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = (saved, isEdit) => {
        setHabits(prev => isEdit ? prev.map(h => h.id === saved.id ? saved : h) : [...prev, saved]);
        setModal(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this habit and all its logs?')) return;
        setDeleting(id);
        // habit_logs uses ON DELETE CASCADE so only need to delete habit
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) {
            alert('Delete failed: ' + error.message);
            setDeleting(null);
            return;
        }
        setHabits(prev => prev.filter(h => h.id !== id));
        setDeleting(null);
    };

    const getStats = (habitId) => {
        const hLogs = logs.filter(l => l.habit_id === habitId);
        const total = hLogs.length;

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
        return { total, streak };
    };

    if (loading) return <div className="loading-spinner"><Loader size={18} className="spin" />Loading habits...</div>;

    return (
        <div className="habit-manager animate-in">
            <div className="hm-toolbar">
                <div>
                    <h3 className="hm-count">{habits.length} habit{habits.length !== 1 ? 's' : ''} in your library</h3>
                </div>
                <button className="notion-btn notion-btn-primary" onClick={() => setModal('new')}>
                    <Plus size={16} /> New Habit
                </button>
            </div>

            {habits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div className="empty-state-title">No habits yet</div>
                    <div className="empty-state-sub">Click "New Habit" to start building your routine.</div>
                </div>
            ) : (
                <div className="hm-table-wrapper">
                    <table className="hm-table">
                        <thead>
                            <tr>
                                <th>Habit</th>
                                <th>Category</th>
                                <th>Total Done</th>
                                <th>Streak</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {habits.map(habit => {
                                const { total, streak } = getStats(habit.id);
                                const col = CATEGORY_COLORS[habit.category] || 'blue';
                                return (
                                    <tr key={habit.id} className="hm-row">
                                        <td className="hm-habit-name">
                                            <span className="hm-title">{habit.title}</span>
                                            {habit.note && <span className="hm-note">{habit.note}</span>}
                                        </td>
                                        <td><span className={`tag tag-${col}`}>{habit.category}</span></td>
                                        <td className="hm-stat">{total} days</td>
                                        <td>
                                            {streak > 0 ? (
                                                <span className="streak-badge"><Flame size={13} />{streak}</span>
                                            ) : <span className="hm-no-streak">—</span>}
                                        </td>
                                        <td className="hm-actions">
                                            <button className="icon-btn" onClick={() => setModal(habit)} title="Edit">
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleDelete(habit.id)}
                                                disabled={deleting === habit.id}
                                                title="Delete"
                                            >
                                                {deleting === habit.id ? <Loader size={15} className="spin" /> : <Trash2 size={15} />}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <HabitModal
                    habit={modal === 'new' ? null : modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
