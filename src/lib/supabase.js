import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqmyayqpuqyjhzduywvy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbXlheXFwdXF5amh6ZHV5d3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjcxNTksImV4cCI6MjA5MTEwMzE1OX0.rj9z1P1kIjxx1TC9eTbSPFuAQUDlGMnUPr9AibZK_Iw'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
})
