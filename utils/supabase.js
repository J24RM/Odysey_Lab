const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseKey !== 'pega_aqui_tu_anon_public_key') {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
