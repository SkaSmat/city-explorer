// Wrapper sécurisé pour le client Supabase principal
// Gère le cas où les variables d'environnement ne sont pas encore chargées
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qycsyvjnynvkuluiyzyx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Y3N5dmpueW52a3VsdWl5enl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDI0ODcsImV4cCI6MjA4MzcxODQ4N30.JfsKjbV9I_35iBXsg1iCBSTVYKtywo7LqXMPgZ14m9U';

export const supabaseAuth: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
