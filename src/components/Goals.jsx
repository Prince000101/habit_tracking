import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X, Loader } from 'lucide-react';
import './Goals.css';

const COLORS = [
    { label: 'Blue', value: '#4f6bed' },
    { label: 'Purple', value: '#9b59d0' },
    { label: 'Green', value: '#2ecc71' },
    { label: 'Orange', value: '#e67e22' },
    { label: 'Red', value: '#e74c3c' },
    { label: 'Yellow', value: '#f1c40f' },
];

function GoalRing({ current, target, color }) {
    const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const r = 38, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return (
        <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text x="48" y="46" textAnchor="middle" fill="#e8e8e5" fontSize="15" fontWeight="800" fontFamily="Inter,sans-serif">{pct}%</text>
            <text x="48" y="60" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="Inter,sans-serif">{current}/{target}</text>
        </svg>
    );
}

function GoalModal({ goal, onSave, onClose }) {
    const [title, setTitle] = useState(goal?.title || '');
    const [target, setTarget] = useState(goal?.target || 30);
    const [current, setCurrent] = useState(goal?.current || 0);
    const [unit, setUnit] = useState(goal?.unit || 'days');
    const [color, setColor] = useState(goal?.color || '#4f6bed');
    const [note, setNote] = useState(goal?.note || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!title.trim()) return;
        setSaving(true);
        // Omit 'note' entirely to prevent schema errors if the column hasn't been added
        const payload = { title: title.trim(), target, unit, current, color };
        let data, err;

        if (goal) {
            const res = await supabase.from('goals').update(payload).eq('id', goal.id).select().single();
            data = res.data; err = res.error;
        } else {
            const res = await supabase.from('goals').insert(payload).select().single();
            data = res.data; err = res.error;
        }

        setSaving(false);
        if (err) { alert('Error saving goal: ' + err.message); return; }
        onSave(data, !!goal);
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-close-row">
                    <h2 className="modal-title">{goal ? 'Edit Goal' : 'New Goal'}</h2>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="form-group">
                    <label className="form-label">Goal Title</label>
                    <input className="notion-input" placeholder="e.g. Read 12 books this year" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Target</label>
                        <input className="notion-input" type="number" min="1" value={target} onChange={e => setTarget(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Unit</label>
                        <input className="notion-input" placeholder="days, books, km…" value={unit} onChange={e => setUnit(e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Current Progress</label>
                    <input className="notion-input" type="number" min="0" value={current} onChange={e => setCurrent(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">Color</label>
                    <div className="color-picker">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                className={`color-dot ${color === c.value ? 'selected' : ''}`}
                                style={{ background: c.value }}
                                onClick={() => setColor(c.value)}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Notes (optional)</label>
                    <input className="notion-input" placeholder="Why is this goal important?" value={note} onChange={e => setNote(e.target.value)} />
                </div>

                <div className="modal-actions">
                    <button className="notion-btn notion-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="notion-btn notion-btn-primary" onClick={save} disabled={saving || !title.trim()}>
                        {saving ? <Loader size={14} className="spin" /> : null} {goal ? 'Save Changes' : 'Create Goal'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
        setGoals(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = (saved, isEdit) => {
        setGoals(prev => isEdit ? prev.map(g => g.id === saved.id ? saved : g) : [...prev, saved]);
        setModal(null);
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        await supabase.from('goals').delete().eq('id', id);
        setGoals(prev => prev.filter(g => g.id !== id));
        setDeleting(null);
    };

    const updateProgress = async (goal, delta) => {
        const newCurrent = Math.max(0, Math.min(goal.target, goal.current + delta));
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, current: newCurrent } : g));
        await supabase.from('goals').update({ current: newCurrent }).eq('id', goal.id);
    };

    if (loading) return <div className="loading-spinner"><Loader size={18} className="spin" /> Loading goals...</div>;

    return (
        <div className="goals-page animate-in">
            <div className="goals-toolbar">
                <p className="goals-count">{goals.length} goal{goals.length !== 1 ? 's' : ''} set</p>
                <button className="notion-btn notion-btn-primary" onClick={() => setModal('new')}>
                    <Plus size={16} /> New Goal
                </button>
            </div>

            {goals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <div className="empty-state-title">No goals yet</div>
                    <div className="empty-state-sub">Set meaningful targets and track your progress towards them.</div>
                </div>
            ) : (
                <div className="goals-grid">
                    {goals.map(goal => {
                        const pct = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0;
                        return (
                            <div key={goal.id} className="goal-card notion-card">
                                <div className="goal-card-header">
                                    <div className="goal-card-actions">
                                        <button className="icon-btn" onClick={() => setModal(goal)} title="Edit"><Edit2 size={14} /></button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(goal.id)} disabled={deleting === goal.id} title="Delete">
                                            {deleting === goal.id ? <Loader size={14} className="spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="goal-card-body">
                                    <GoalRing current={goal.current} target={goal.target} color={goal.color || '#4f6bed'} />
                                    <div className="goal-info">
                                        <h3 className="goal-title">{goal.title}</h3>
                                        {goal.note && <p className="goal-note">{goal.note}</p>}
                                        <div className="goal-stats">
                                            <span>{goal.current} / {goal.target} {goal.unit}</span>
                                        </div>
                                        <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                                            <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color || '#4f6bed' }} />
                                        </div>
                                        {/* Inline progress controls */}
                                        <div className="goal-controls">
                                            <button className="goal-ctrl-btn" onClick={() => updateProgress(goal, -1)}>−</button>
                                            <span className="goal-ctrl-label">{pct}% complete</span>
                                            <button className="goal-ctrl-btn" onClick={() => updateProgress(goal, 1)}>+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modal && (
                <GoalModal
                    goal={modal === 'new' ? null : modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
