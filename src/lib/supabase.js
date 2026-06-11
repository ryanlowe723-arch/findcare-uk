import { createClient } from '@supabase/supabase-js'

// Fallback to placeholder so createClient doesn't throw before env vars are wired up.
// API calls will simply return errors until real values are provided.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL      || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
)
