const PUBLIC_SUPABASE_ENV = {
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
} as const;

export function hasSupabasePublicEnv() {
  return Boolean(PUBLIC_SUPABASE_ENV.url && PUBLIC_SUPABASE_ENV.publishableKey);
}

export function hasSupabaseServiceRoleEnv() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabaseAuthConfigured() {
  return hasSupabasePublicEnv() && hasSupabaseServiceRoleEnv();
}

export function getSupabasePublicEnv() {
  const { publishableKey, url } = PUBLIC_SUPABASE_ENV;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    publishableKey,
    url,
  };
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Supabase auth is not fully configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    );
  }

  return serviceRoleKey;
}
