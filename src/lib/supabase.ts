 import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

const { supabaseUrl, supabasePublishableKey } = CONFIG.integrations;
export const supabaseReady = Boolean(supabaseUrl && supabasePublishableKey);
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function uploadCollegeImage(file: File): Promise<string> {
  const c = CONFIG.integrations;
  if (!c.cloudinaryCloudName || !c.cloudinaryUploadPreset) throw new Error('Cloudinary config is missing in src/config.ts');
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image must be 8 MB or smaller.');
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', c.cloudinaryUploadPreset);
  body.append('folder', c.cloudinaryFolder);
  body.append('use_filename', 'true');
  body.append('unique_filename', 'false');
  const response = await fetch(c.cloudinaryUploadUrl, { method: 'POST', body });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || 'Cloudinary upload failed. Check your unsigned preset settings.');
  return result.secure_url as string;
}
