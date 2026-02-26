import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProvinceData {
  id: number;
  name: string;
  category: string;
  province: string;
  address: string;
  image_url: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}
