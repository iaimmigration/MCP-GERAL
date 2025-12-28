
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Initialize as null to prevent "supabaseUrl is required" error during module loading
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
      return supabaseInstance;
    } catch (e) {
      console.error("Supabase Initialization Error:", e);
      return null;
    }
  }
  return null;
};

export interface InfraVault {
  key_name: string;
  encrypted_value: string;
}

export const getRemoteConfig = async (): Promise<Record<string, string>> => {
  const client = getSupabaseClient();
  if (!client) {
    console.warn("Supabase Config: SUPABASE_URL ou SUPABASE_ANON_KEY ausentes. Usando ambiente local.");
    return {};
  }

  try {
    const { data, error } = await client
      .from('infra_vault')
      .select('key_name, encrypted_value');

    if (error) throw error;

    return (data || []).reduce((acc, item) => ({
      ...acc,
      [item.key_name]: item.encrypted_value
    }), {});
  } catch (e) {
    console.error("Supabase Remote Config Fetch Error:", e);
    return {};
  }
};

export const saveRemoteConfig = async (keyName: string, encryptedValue: string) => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("SUPABASE_UNCONFIGURED: Configure as variáveis de ambiente no seu host.");
  }

  const { error } = await client
    .from('infra_vault')
    .upsert({ key_name: keyName, encrypted_value: encryptedValue }, { onConflict: 'key_name' });
  
  if (error) throw error;
};
