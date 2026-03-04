export default {
    "habits": `
        CREATE TABLE IF NOT EXISTS habits (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            user_id UUID,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            frequency TEXT NOT NULL DEFAULT 'Daily',
            archived BOOLEAN DEFAULT false
        );
    `,
    "habit_logs": `
        CREATE TABLE IF NOT EXISTS habit_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
            user_id UUID,
            completed_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(habit_id, completed_date)
        );
    `,
    "goals": `
        CREATE TABLE IF NOT EXISTS goals (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            user_id UUID,
            title TEXT NOT NULL,
            target NUMERIC NOT NULL,
            current NUMERIC DEFAULT 0,
            unit TEXT NOT NULL,
            color TEXT DEFAULT '#6366f1'
        );
    `
};
