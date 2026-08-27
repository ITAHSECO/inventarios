const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

function createUserClient(accessToken) {
  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}

module.exports = { supabaseAdmin, supabaseAnon, createUserClient };
