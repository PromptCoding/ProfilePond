import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://api.domain.com'
const supabaseAnonKey = 'xey'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)