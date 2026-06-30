import { supabase } from './supabase';

export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.onboarding_completed ?? false;
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId);

  if (error) throw error;
}
