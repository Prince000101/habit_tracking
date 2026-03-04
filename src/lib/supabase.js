import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to initialize db (since we can't use CLI right now)
// Note: In a real prod setup, migrations should be done via CLI.
// We execute this from the App component.
export const setupDatabase = async () => {
    try {
        const schemaQueries = [
            `CREATE TABLE IF NOT EXISTS habits (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                user_id UUID,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                frequency TEXT NOT NULL DEFAULT 'Daily',
                archived BOOLEAN DEFAULT false
            );`,
            `CREATE TABLE IF NOT EXISTS habit_logs (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
                user_id UUID,
                completed_date DATE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                UNIQUE(habit_id, completed_date)
            );`,
            `CREATE TABLE IF NOT EXISTS goals (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                user_id UUID,
                title TEXT NOT NULL,
                target NUMERIC NOT NULL,
                current NUMERIC DEFAULT 0,
                unit TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1'
            );`
        ];

        // The JS client cannot run raw DDL queries by default unless there is an RPC function.
        // We will attempt to insert a dummy record and catch the error to see if table exists.
        const { error } = await supabase.from('habits').select('id').limit(1);

        if (error && error.code === '42P01') {
            console.error("Tables do not exist. Please run the SQL queries in the Supabase Dashboard SQL Editor.");
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error checking db:", err);
        return false;
    }
};
