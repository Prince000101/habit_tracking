import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Goals.css';

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Goal Form
    const [newTitle, setNewTitle] = useState('');
    const [newTarget, setNewTarget] = useState(10);
    const [newUnit, setNewUnit] = useState('');
    const [newColor, setNewColor] = useState('var(--accent-primary)');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Error fetching goals:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const addGoal = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newUnit.trim()) return;

        try {
            const { data, error } = await supabase
                .from('goals')
                .insert([{
                    title: newTitle,
                    target: newTarget,
                    current: 0,
                    unit: newUnit,
                    color: newColor
                }])
                .select();

            if (error) throw error;
            setGoals([data[0], ...goals]);
            setIsAdding(false);
            setNewTitle('');
            setNewUnit('');
            setNewTarget(10);
        } catch (error) {
            console.error('Error adding goal:', error.message);
        }
    };

    const deleteGoal = async (id) => {
        if (!window.confirm('Delete this goal permanently?')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            setGoals(goals.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error deleting goal:', error.message);
        }
    };

    return (
        <div className="goals-dashboard">
            <header className="goals-header">
                <div>
                    <h3>Long-term Goals</h3>
                    <p className="subtitle">Connect your daily habits to your macro objectives.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        {isAdding ? (
                            <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
                        ) : (
                            <><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></>
                        )}
                    </svg>
                    {isAdding ? 'Cancel' : 'New Goal'}
                </button>
            </header>

            {isAdding && (
                <form className="add-habit-form glass-panel" onSubmit={addGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', padding: '1.5rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <input
                            type="text"
                            placeholder="Goal Title (e.g., Read 24 Books)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="form-input"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="number"
                            min="1"
                            placeholder="Target Number"
                            value={newTarget}
                            onChange={(e) => setNewTarget(Number(e.target.value))}
                            className="form-input"
                            title="Target amount"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Unit (e.g., books, km, $)"
                            value={newUnit}
                            onChange={(e) => setNewUnit(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <select value={newColor} onChange={(e) => setNewColor(e.target.value)} className="form-select">
                            <option value="var(--accent-primary)">Indigo</option>
                            <option value="var(--accent-secondary)">Violet</option>
                            <option value="var(--accent-success)">Emerald</option>
                            <option value="var(--accent-warning)">Amber</option>
                            <option value="var(--accent-danger)">Rose</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '42px', alignSelf: 'flex-end' }}>Create</button>
                </form>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading goals...</div>
            ) : goals.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    No long-term goals set. Click "New Goal" to get started!
                </div>
            ) : (
                <div className="goals-grid">
                    {goals.map(goal => {
                        const target = Number(goal.target) || 1;
                        const current = Number(goal.current) || 0;
                        let percentage = Math.round((current / target) * 100);
                        if (percentage > 100) percentage = 100;

                        return (
                            <div key={goal.id} className="goal-card glass-panel" style={{ position: 'relative' }}>
                                <button
                                    className="btn-icon danger"
                                    onClick={() => deleteGoal(goal.id)}
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.5 }}
                                    title="Delete Goal"
                                >
                                    🗑️
                                </button>

                                <div className="goal-header" style={{ paddingRight: '2rem' }}>
                                    <h4>{goal.title}</h4>
                                    <div className="goal-badge" style={{ backgroundColor: `${goal.color}33`, color: goal.color }}>
                                        {percentage}%
                                    </div>
                                </div>

                                <div className="goal-progress-wrapper" style={{ marginTop: 'auto' }}>
                                    <div className="goal-progress-bg">
                                        <div
                                            className="goal-progress-fill"
                                            style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                                        ></div>
                                    </div>
                                    <div className="goal-stats">
                                        <span>{current} {goal.unit}</span>
                                        <span>{target} {goal.unit}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
