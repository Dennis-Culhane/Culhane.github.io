// lib/api/profile.ts
// Server-side data fetching for the professor's profile.

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

/**
 * Fetch the professor's profile (single row).
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Profile;
}
