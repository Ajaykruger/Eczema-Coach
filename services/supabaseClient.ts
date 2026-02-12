
import { createClient } from '@supabase/supabase-js';

// Using provided credentials as defaults if env vars are not set
const supabaseUrl = process.env.SUPABASE_URL || 'https://vgobsuztogkclztxtnnh.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnb2JzdXp0b2drY2x6dHh0bm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTQ1NTgsImV4cCI6MjA4MDkzMDU1OH0.venY-fXHHa-VES3MYIdWeYfamf4Tqvn7NSlxyLTyUzY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
