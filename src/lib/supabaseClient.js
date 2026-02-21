import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  const msg = '[CEPREVAL] ERROR: VITE_SUPABASE_URL no está configurada. Edita .env.local con tu URL real de Supabase.'
  console.error(msg)
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  const msg = '[CEPREVAL] ERROR: VITE_SUPABASE_ANON_KEY no está configurada. Edita .env.local con tu anon key real de Supabase.'
  console.error(msg)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function checkEnvVars() {
  const errors = []
  if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
    errors.push('VITE_SUPABASE_URL no configurada')
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
    errors.push('VITE_SUPABASE_ANON_KEY no configurada')
  }
  return errors
}
