import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => (process.env[key] || '').trim();

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseUrl.includes('dashboard/project')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;
