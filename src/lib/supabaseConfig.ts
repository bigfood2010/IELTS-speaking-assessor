function extractProjectRef(supabaseUrl: string): string | null {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    const subdomain = hostname.split('.')[0];
    return subdomain || null;
  } catch {
    return null;
  }
}

export function getSupabaseClientKey(env: {
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}) {
  return env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
}

export function getSupabaseConfigError(supabaseUrl: string, supabaseKey: string): string | null {
  if (!supabaseUrl) {
    return 'Supabase URL is missing. Set VITE_SUPABASE_URL in your environment.';
  }

  if (!supabaseKey) {
    return 'Supabase client key is missing. Set VITE_SUPABASE_ANON_KEY in your environment.';
  }

  if (supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('eyJ')) {
    return null;
  }

  const projectRef = extractProjectRef(supabaseUrl);

  if (projectRef && supabaseKey === projectRef) {
    return 'Supabase client key is invalid. Replace VITE_SUPABASE_ANON_KEY with your project anon key or publishable key from Supabase.';
  }

  return 'Supabase client key format looks invalid. Use your Supabase anon key or publishable key.';
}
